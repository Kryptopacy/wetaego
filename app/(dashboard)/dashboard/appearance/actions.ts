'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { authActionClient } from '@/lib/safe-action'

export const quickCreatePageAction = authActionClient
  .schema(zfd.formData({
    locationId: zfd.text(z.string().uuid()),
    title: zfd.text(z.string().min(1, "Title is required").max(100)),
    template_type: zfd.text(z.string().default('catalog')),
  }))
  .action(async ({ parsedInput: { locationId, title, template_type }, ctx: { supabase, user } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/appearance')
      return { success: true, page: { id: `demo-${Date.now()}`, title, slug: title.toLowerCase().replace(/\s+/g, '-'), template_type } }
    }

    // Verify location ownership
    const { data: loc } = await supabase
      .from('locations')
      .select('organization_id')
      .eq('id', locationId)
      .single()
    if (!loc) throw new Error('Location not found')

    const orgId = loc.organization_id

    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single()

    let isAuthorized = member?.role === 'owner' || member?.role === 'manager'
    if (!member) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', orgId)
        .eq('created_by', user.id)
        .single()
      isAuthorized = !!org
    }

    if (!isAuthorized) throw new Error('Unauthorized')

    // Generate unique slug
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `page-${Date.now().toString().slice(-4)}`

    let slug = baseSlug
    let counter = 1
    const adminClient = await createAdminClient()

    while (true) {
      const { data: existing } = await adminClient
        .from('location_pages')
        .select('id')
        .eq('location_id', locationId)
        .eq('slug', slug)
        .maybeSingle()

      if (!existing) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const { data: newPage, error } = await adminClient
      .from('location_pages')
      .insert({
        location_id: locationId,
        title,
        slug,
        template_type,
        is_primary: false,
        is_published: true,
        billing_enabled: template_type === 'catalog' || template_type === 'booking',
        billing_mode: 'standard_checkout',
        payment_mode: 'full'
      })
      .select('id, title, slug, template_type, cover_image_url, design_tokens')
      .single()

    if (error || !newPage) throw new Error(error?.message || 'Failed to create page')

    revalidatePath('/dashboard/appearance')
    revalidatePath('/dashboard/pages')
    revalidatePath('/dashboard/menus')

    return {
      success: true,
      page: newPage
    }
  })
