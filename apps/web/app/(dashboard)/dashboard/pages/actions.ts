'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getPreset, buildPageTitle } from '@/lib/templates/presets'

// ─── Business Type Setup ───────────────────────────────────────────────────────

export async function setBusinessTypeAction(formData: FormData): Promise<void> {
  const businessType = formData.get('businessType') as string
  const orgId = formData.get('orgId') as string
  const mode = formData.get('mode') as string

  if (orgId === 'demo-org') {
    redirect(`/dashboard/pages/build/${businessType}?mode=${mode}`)
  }

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Not authenticated')

  // If primary mode, set the org's business_type
  if (mode === 'primary') {
    await supabase
      .from('organizations')
      .update({ business_type: businessType })
      .eq('id', orgId)
  }

  redirect(`/dashboard/pages/build/${businessType}?mode=${mode}`)
}

// ─── Page Creation ─────────────────────────────────────────────────────────────

export async function createCustomPage(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const title = formData.get('title') as string
  const slug = formData.get('slug') as string
  const content = (formData.get('content') as string) || null
  const location_id = formData.get('location_id') as string
  const template_type = (formData.get('template_type') as string) || 'info'
  const is_primary = formData.get('is_primary') === 'true'
  const billing_enabled = formData.get('billing_enabled') === 'true'
  const billing_mode = (formData.get('billing_mode') as string) || 'standard_checkout'
  const payment_mode = (formData.get('payment_mode') as string) || 'full'
  const deposit_percentage = formData.get('deposit_percentage')
    ? parseInt(formData.get('deposit_percentage') as string)
    : null
  const business_type_preset = (formData.get('business_type_preset') as string) || null

  if (location_id === 'demo-loc') {
    revalidatePath('/dashboard/pages')
    return
  }

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Not authenticated')

  // 1. Get organization ID for this location
  const { data: loc } = await supabase
    .from('locations')
    .select('organization_id')
    .eq('id', location_id)
    .single()
  if (!loc) throw new Error('Location not found')
  const orgId = loc.organization_id

  // 2. Get org tier and current page count
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
  const freeLimit = await getFreePagesLimit(org?.subscription_tier || 'starter')

  // 3. Primary pages are always free; only charge for extras beyond free limit
  if (!is_primary && (count || 0) >= freeLimit) {
    const { getCreditCosts } = await import('@/lib/utils/settings')
    const creditCosts = await getCreditCosts() as Record<string, number>
    const pageCost = creditCosts.custom_page || 10

    const { chargeCredits } = await import('@/lib/payments/credits')
    const charge = await chargeCredits(
      orgId,
      pageCost,
      `Created Page: ${slug} (${template_type})`,
      userData.user.id
    )
    if (!charge.success) {
      throw new Error(
        `Insufficient credits to create an extra page. (Cost: ${pageCost})`
      )
    }
  }

  // 4. If this is primary, unset any previous primary
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
    content,
    template_type,
    is_primary,
    billing_enabled,
    billing_mode,
    payment_mode,
    deposit_percentage,
    business_type_preset,
    is_published: true,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/pages')
  redirect('/dashboard/pages')
}

// ─── Page Update ───────────────────────────────────────────────────────────────

export async function updatePage(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const pageId = formData.get('pageId') as string
  const title = formData.get('title') as string
  const content = (formData.get('content') as string) || null
  const billing_enabled = formData.get('billing_enabled') === 'true'
  const billing_mode = (formData.get('billing_mode') as string) || 'standard_checkout'
  const payment_mode = (formData.get('payment_mode') as string) || 'full'
  const deposit_percentage = formData.get('deposit_percentage')
    ? parseInt(formData.get('deposit_percentage') as string)
    : null
  const randomizer_enabled = formData.get('randomizer_enabled') === 'true'

  if (pageId.startsWith('page-')) {
    revalidatePath('/dashboard/pages')
    return
  }

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('location_pages')
    .update({ title, content, billing_enabled, billing_mode, payment_mode, deposit_percentage, randomizer_enabled })
    .eq('id', pageId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/pages')
}

// ─── Page Items (Catalog, Booking, Listing, Rate Card) ────────────────────────

export async function addPageItem(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const page_id = formData.get('page_id') as string
  const title = formData.get('title') as string
  const subtitle = (formData.get('subtitle') as string) || null
  const description = (formData.get('description') as string) || null
  const price_minor = formData.get('price_minor')
    ? parseInt(formData.get('price_minor') as string)
    : null
  const price_display = (formData.get('price_display') as string) || null
  const availability_status = (formData.get('availability_status') as string) || 'available'
  const item_data = formData.get('item_data')
    ? JSON.parse(formData.get('item_data') as string)
    : null
  const deposit_percentage = formData.get('deposit_percentage')
    ? parseInt(formData.get('deposit_percentage') as string)
    : null
  const payment_mode = (formData.get('payment_mode') as string) || 'full'

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Not authenticated')

  const { error } = await supabase.from('page_items').insert({
    page_id,
    title,
    subtitle,
    description,
    price_minor,
    price_display,
    availability_status,
    item_data,
    deposit_percentage,
    payment_mode,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/pages')
}

export async function updatePageItem(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const itemId = formData.get('itemId') as string
  const title = formData.get('title') as string
  const subtitle = (formData.get('subtitle') as string) || null
  const description = (formData.get('description') as string) || null
  const price_minor = formData.get('price_minor')
    ? parseInt(formData.get('price_minor') as string)
    : null
  const price_display = (formData.get('price_display') as string) || null
  const availability_status = (formData.get('availability_status') as string) || 'available'
  const item_data = formData.get('item_data')
    ? JSON.parse(formData.get('item_data') as string)
    : null

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('page_items')
    .update({ title, subtitle, description, price_minor, price_display, availability_status, item_data })
    .eq('id', itemId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/pages')
}

export async function deletePageItem(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const itemId = formData.get('itemId') as string

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Not authenticated')

  await supabase.from('page_items').delete().eq('id', itemId)
  revalidatePath('/dashboard/pages')
}

export async function updateItemAvailability(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const itemId = formData.get('itemId') as string
  const status = formData.get('status') as string

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Not authenticated')

  await supabase
    .from('page_items')
    .update({ availability_status: status })
    .eq('id', itemId)

  revalidatePath('/dashboard/pages')
  revalidatePath('/dashboard/manage/bookings')
  revalidatePath('/dashboard/manage/properties')
}

// ─── Existing actions (unchanged) ────────────────────────────────────────────

export async function togglePageStatus(formData: FormData) {
  const supabase = await createClient()
  const pageId = formData.get('pageId') as string
  const currentStatus = formData.get('currentStatus') === 'true'

  if (pageId.startsWith('page-')) {
    revalidatePath('/dashboard/pages')
    return
  }

  await supabase
    .from('location_pages')
    .update({ is_published: !currentStatus })
    .eq('id', pageId)
  revalidatePath('/dashboard/pages')
}

export async function deletePage(formData: FormData) {
  const supabase = await createClient()
  const pageId = formData.get('pageId') as string

  if (pageId.startsWith('page-')) {
    revalidatePath('/dashboard/pages')
    return
  }

  await supabase.from('location_pages').delete().eq('id', pageId)
  revalidatePath('/dashboard/pages')
}

// ─── Booking actions ───────────────────────────────────────────────────────────

export async function updateBookingStatus(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const bookingId = formData.get('bookingId') as string
  const status = formData.get('status') as string

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Not authenticated')

  await supabase
    .from('page_bookings')
    .update({ status })
    .eq('id', bookingId)

  revalidatePath('/dashboard/manage/bookings')
}

// ─── Inquiry actions ───────────────────────────────────────────────────────────

export async function updateInquiryStatus(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const inquiryId = formData.get('inquiryId') as string
  const status = formData.get('status') as string

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Not authenticated')

  await supabase
    .from('page_inquiries')
    .update({ status })
    .eq('id', inquiryId)

  revalidatePath('/dashboard/manage/properties')
  revalidatePath('/dashboard/manage/quotes')
}
