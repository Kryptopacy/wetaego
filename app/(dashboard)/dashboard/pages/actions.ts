'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Json } from '@/lib/supabase/types'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { authActionClient } from '@/lib/safe-action'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// ─── Business Type Setup ───────────────────────────────────────────────────────

export const setBusinessTypeAction = authActionClient
  .schema(zfd.formData({
    businessType: zfd.text(),
    orgId: zfd.text(),
    mode: zfd.text()
  }))
  .action(async ({ parsedInput: { businessType, orgId, mode }, ctx: { supabase } }) => {
    if (orgId === 'demo-org') {
      redirect(`/dashboard/pages/build/${businessType}?mode=${mode}`)
    }

    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/pages')
      return { success: true }
    }

    if (mode === 'primary') {
      await supabase
        .from('organizations')
        .update({ business_type: businessType })
        .eq('id', orgId)
    }

    redirect(`/dashboard/pages/build/${businessType}?mode=${mode}`)
  })

// ─── Page Creation ─────────────────────────────────────────────────────────────

export const createCustomPage = authActionClient
  .schema(zfd.formData({
    title: zfd.text(),
    slug: zfd.text(),
    content: zfd.text(z.string().optional()),
    location_id: zfd.text(),
    template_type: zfd.text(z.string().default('info')),
    is_primary: zfd.checkbox(),
    billing_enabled: zfd.checkbox(),
    billing_mode: zfd.text(z.string().default('standard_checkout')),
    payment_mode: zfd.text(z.string().default('full')),
    deposit_percentage: zfd.numeric(z.number().optional()),
    business_type_preset: zfd.text(z.string().optional())
  }))
  .action(async ({ parsedInput, ctx: { supabase, user } }) => {
    const {
      title, slug, content, location_id, template_type, is_primary,
      billing_enabled, billing_mode, payment_mode, deposit_percentage, business_type_preset
    } = parsedInput

    if (location_id === 'demo-loc') {
      revalidatePath('/dashboard/pages')
      return { success: true }
    }

    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/pages')
      return { success: true }
    }

    const { data: loc } = await supabase
      .from('locations')
      .select('organization_id')
      .eq('id', location_id)
      .single()
    if (!loc) throw new Error('Location not found')
    const orgId = loc.organization_id

    const { data: org } = await supabase
      .from('organizations')
      .select('subscription_tier')
      .eq('id', orgId)
      .single()

    const { count } = await supabase
      .from('location_pages')
      .select('id', { count: 'exact' })
      .eq('location_id', location_id)

    const { getFreePagesLimit } = await import('@/lib/utils/billing')
    const freeLimit = await getFreePagesLimit(org?.subscription_tier || 'lite')

    if (!is_primary && (count || 0) >= freeLimit) {
      const { getCreditCosts } = await import('@/lib/utils/settings')
      const creditCosts = await getCreditCosts() as Record<string, number>
      const pageCost = creditCosts.custom_page || 10

      const { chargeCredits } = await import('@/lib/payments/credits')
      const charge = await chargeCredits(
        orgId,
        pageCost,
        `Created Page: ${slug} (${template_type})`,
        user.id
      )
      if (!charge.success) {
        throw new Error(`Insufficient credits to create an extra page. (Cost: ${pageCost})`)
      }
    }

    if (is_primary) {
      await supabase
        .from('location_pages')
        .update({ is_primary: false })
        .eq('location_id', location_id)
        .eq('is_primary', true)
    }

    const { error } = await supabase.from('location_pages').insert({
      location_id,
      title,
      slug,
      content: content || null,
      template_type,
      is_primary,
      billing_enabled,
      billing_mode,
      payment_mode,
      deposit_percentage: deposit_percentage || null,
      business_type_preset: business_type_preset || null,
      is_published: true,
    })

    if (error) throw new Error((error as Error).message)

    revalidatePath('/dashboard/pages')
    redirect('/dashboard/pages')
  })

// ─── Page Update ───────────────────────────────────────────────────────────────

export const updatePage = authActionClient
  .schema(zfd.formData({
    pageId: zfd.text(),
    title: zfd.text(z.string().max(100)),
    content: zfd.text(z.string().max(2000).optional()),
    billing_enabled: zfd.checkbox(),
    billing_mode: zfd.text(z.string().default('standard_checkout')),
    payment_mode: zfd.text(z.string().default('full')),
    deposit_percentage: zfd.numeric(z.number().min(0).max(100).optional()),
    randomizer_enabled: zfd.checkbox(),
    hide_delivery: zfd.checkbox(),
    payment_channels: zfd.repeatableOfType(zfd.text()),
    refund_policy: zfd.text(z.string().optional()),
    milestones_enabled: zfd.checkbox(),
    whatsapp_number: zfd.text(z.string().optional()),
    phone_number: zfd.text(z.string().optional()),
    instagram_handle: zfd.text(z.string().optional()),
    x_handle: zfd.text(z.string().optional()),
    tiktok_handle: zfd.text(z.string().optional()),
    fulfillment_options: zfd.text(z.string().optional()),
  }))
  .action(async ({ parsedInput, ctx: { supabase } }) => {
    const {
      pageId, title, content, billing_enabled, billing_mode, payment_mode, deposit_percentage,
      randomizer_enabled, hide_delivery, payment_channels, refund_policy, milestones_enabled,
      whatsapp_number, phone_number, instagram_handle, x_handle, tiktok_handle, fulfillment_options
    } = parsedInput

    if (pageId.startsWith('page-')) {
      revalidatePath('/dashboard/pages')
      return { success: true }
    }

    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/pages')
      return { success: true }
    }

    const { data: existing } = await supabase.from('location_pages').select('template_data').eq('id', pageId).single()
    const template_data = { 
      ...((existing?.template_data as Record<string, unknown>) || {}), 
      hide_delivery, 
      payment_channels: payment_channels.length > 0 ? payment_channels : undefined, 
      refund_policy, 
      milestones_enabled,
      whatsapp_number,
      phone_number,
      instagram_handle,
      x_handle,
      tiktok_handle,
      ...(fulfillment_options ? { fulfillment_options: JSON.parse(fulfillment_options) } : {})
    }

    const { error } = await supabase
      .from('location_pages')
      .update({ title, content, billing_enabled, billing_mode, payment_mode, deposit_percentage: deposit_percentage || null, randomizer_enabled, template_data })
      .eq('id', pageId)

    if (error) throw new Error((error as Error).message)

    revalidatePath('/dashboard/pages')
    return { success: true }
  })

// ─── Page Items (Catalog, Booking, Listing, Rate Card) ────────────────────────

export const addPageItem = authActionClient
  .schema(zfd.formData({
    page_id: zfd.text(),
    title: zfd.text(z.string().max(100)),
    subtitle: zfd.text(z.string().max(200).optional()),
    description: zfd.text(z.string().max(1000).optional()),
    price_minor: zfd.numeric(z.number().min(0).optional()),
    price_display: zfd.text(z.string().max(50).optional()),
    availability_status: zfd.text(z.string().default('available')),
    item_data: zfd.text(z.string().optional()),
    deposit_percentage: zfd.numeric(z.number().min(0).max(100).optional()),
    payment_mode: zfd.text(z.string().default('full')),
    inventory_count: zfd.numeric(z.number().min(0).optional()),
    image: zfd.file().optional(),
    ai_image_url: zfd.text(z.string().optional())
  }))
  .action(async ({ parsedInput, ctx: { supabase, user } }) => {
    const {
      page_id, title, subtitle, description, price_minor, price_display, availability_status,
      item_data, deposit_percentage, payment_mode, inventory_count, image, ai_image_url
    } = parsedInput

    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/pages')
      return { success: true }
    }

    let images: string[] = []
    if (ai_image_url) {
      images = [ai_image_url]
    } else if (image && image.size > 0) {
      if (image.size > MAX_FILE_SIZE) throw new Error('Image must be less than 5MB')
      if (!ACCEPTED_IMAGE_TYPES.includes(image.type)) throw new Error('Invalid image format.')

      const fileExt = image.name.split('.').pop()
      const fileName = `page-items/${user.id}-${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(fileName, image)
        
      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage.from('public-assets').getPublicUrl(fileName)
        images = [publicUrlData.publicUrl]
      } else {
        throw new Error('Failed to upload image')
      }
    }

    const { error } = await supabase.from('page_items').insert({
      page_id,
      title,
      subtitle: subtitle || null,
      description: description || null,
      price_minor: price_minor ?? null,
      price_display: price_display || null,
      availability_status,
      item_data: item_data ? JSON.parse(item_data) : null,
      deposit_percentage: deposit_percentage ?? null,
      payment_mode,
      inventory_count: inventory_count ?? null,
      images
    })

    if (error) throw new Error((error as Error).message)

    revalidatePath('/dashboard/pages')
    return { success: true }
  })

export const updatePageItem = authActionClient
  .schema(zfd.formData({
    itemId: zfd.text(),
    title: zfd.text(z.string().max(100)),
    subtitle: zfd.text(z.string().max(200).optional()),
    description: zfd.text(z.string().max(1000).optional()),
    price_minor: zfd.numeric(z.number().min(0).optional()),
    price_display: zfd.text(z.string().max(50).optional()),
    availability_status: zfd.text(z.string().default('available')),
    item_data: zfd.text(z.string().optional()),
    inventory_count: zfd.numeric(z.number().min(0).optional()),
    image: zfd.file().optional(),
    ai_image_url: zfd.text(z.string().optional())
  }))
  .action(async ({ parsedInput, ctx: { supabase, user } }) => {
    const {
      itemId, title, subtitle, description, price_minor, price_display,
      availability_status, item_data, inventory_count, image, ai_image_url
    } = parsedInput

    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/pages')
      return { success: true }
    }

    const updatePayload: {
      title?: string
      subtitle?: string | null
      description?: string | null
      price_minor?: number | null
      price_display?: string | null
      availability_status?: string
      item_data?: Json | null
      inventory_count?: number | null
      images?: string[]
    } = { 
      title, 
      subtitle: subtitle || null, 
      description: description || null, 
      price_minor: price_minor ?? null, 
      price_display: price_display || null, 
      availability_status, 
      item_data: item_data ? JSON.parse(item_data) : null, 
      inventory_count: inventory_count ?? null 
    }

    if (ai_image_url) {
      updatePayload.images = [ai_image_url]
    } else if (image && image.size > 0) {
      if (image.size > MAX_FILE_SIZE) throw new Error('Image must be less than 5MB')
      if (!ACCEPTED_IMAGE_TYPES.includes(image.type)) throw new Error('Invalid image format.')

      const fileExt = image.name.split('.').pop()
      const fileName = `page-items/${user.id}-${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(fileName, image)
        
      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage.from('public-assets').getPublicUrl(fileName)
        updatePayload.images = [publicUrlData.publicUrl]
      } else {
        throw new Error('Failed to upload image')
      }
    }

    const { error } = await supabase
      .from('page_items')
      .update(updatePayload)
      .eq('id', itemId)

    if (error) throw new Error((error as Error).message)

    revalidatePath('/dashboard/pages')
    return { success: true }
  })

export const deletePageItem = authActionClient
  .schema(zfd.formData({ itemId: zfd.text() }))
  .action(async ({ parsedInput: { itemId }, ctx: { supabase } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/pages')
      return { success: true }
    }

    await supabase.from('page_items').delete().eq('id', itemId)
    revalidatePath('/dashboard/pages')
    return { success: true }
  })

export const updateItemAvailability = authActionClient
  .schema(zfd.formData({ itemId: zfd.text(), status: zfd.text() }))
  .action(async ({ parsedInput: { itemId, status }, ctx: { supabase } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/pages')
      return { success: true }
    }

    await supabase
      .from('page_items')
      .update({ availability_status: status })
      .eq('id', itemId)

    revalidatePath('/dashboard/pages')
    revalidatePath('/dashboard/manage/bookings')
    revalidatePath('/dashboard/manage/properties')
    return { success: true }
  })

// ─── Existing actions (unchanged) ────────────────────────────────────────────

export const togglePageStatus = authActionClient
  .schema(zfd.formData({ pageId: zfd.text(), currentStatus: zfd.checkbox() }))
  .action(async ({ parsedInput: { pageId, currentStatus }, ctx: { supabase } }) => {
    if (pageId.startsWith('page-')) {
      revalidatePath('/dashboard/pages')
      return { success: true }
    }

    await supabase
      .from('location_pages')
      .update({ is_published: !currentStatus })
      .eq('id', pageId)
    revalidatePath('/dashboard/pages')
    return { success: true }
  })

export const deletePage = authActionClient
  .schema(zfd.formData({ pageId: zfd.text() }))
  .action(async ({ parsedInput: { pageId }, ctx: { supabase } }) => {
    if (pageId.startsWith('page-')) {
      revalidatePath('/dashboard/pages')
      return { success: true }
    }

    await supabase.from('location_pages').delete().eq('id', pageId)
    revalidatePath('/dashboard/pages')
    return { success: true }
  })

// ─── Booking actions ───────────────────────────────────────────────────────────

export const updateBookingStatus = authActionClient
  .schema(zfd.formData({ bookingId: zfd.text(), status: zfd.text() }))
  .action(async ({ parsedInput: { bookingId, status }, ctx: { supabase } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/pages')
      return { success: true }
    }

    await supabase
      .from('page_bookings')
      .update({ status })
      .eq('id', bookingId)

    revalidatePath('/dashboard/manage/bookings')
    return { success: true }
  })

// ─── Inquiry actions ───────────────────────────────────────────────────────────

export const updateInquiryStatus = authActionClient
  .schema(zfd.formData({ inquiryId: zfd.text(), status: zfd.text() }))
  .action(async ({ parsedInput: { inquiryId, status }, ctx: { supabase } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/pages')
      return { success: true }
    }

    await supabase
      .from('page_inquiries')
      .update({ status })
      .eq('id', inquiryId)

    revalidatePath('/dashboard/manage/properties')
    revalidatePath('/dashboard/manage/quotes')
    return { success: true }
  })
