'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { authActionClient } from '@/lib/safe-action'
import { getTrialSettings } from '@/lib/utils/settings'

export const updateOrganization = authActionClient
  .schema(zfd.formData({
    name: zfd.text(z.string().min(2, "Name must be at least 2 characters")),
    slug: zfd.text(z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")),
    business_type: zfd.text(z.string().optional()),
    logo_url: zfd.text(z.string().optional()),
    role: zfd.text(z.enum(['owner', 'manager']).optional()),
    refund_policy: zfd.text(z.string().max(2000).optional())
  }))
  .action(async ({ parsedInput: { name, slug, business_type, logo_url, role, refund_policy }, ctx: { supabase, user } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/settings')
      return { success: true }
    }

    const { createAdminClient } = await import('@/lib/supabase/server')
    const adminClient = await createAdminClient()

    // Find existing org for this user (first check membership, then fallback to created_by)
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    let currentOrgId = member?.organization_id || ''

    if (!currentOrgId) {
      const { data: orgByCreator } = await supabase
        .from('organizations')
        .select('id')
        .eq('created_by', user.id)
        .limit(1)
        .single()
      if (orgByCreator) {
        currentOrgId = orgByCreator.id
      }
    }

    const existedBefore = !!currentOrgId

    if (existedBefore) {
      // Update existing org
      const { error } = await adminClient
        .from('organizations')
        .update({ name, slug, ...(business_type ? { business_type } : {}), ...(logo_url !== undefined ? { logo_url } : {}), refund_policy: refund_policy || null })
        .eq('id', currentOrgId)
      
      if (error) {
        if (error.code === '23505' || error.message.toLowerCase().includes('unique constraint') || error.message.toLowerCase().includes('slug')) {
          throw new Error('This public slug (URL) is already taken. Please choose another slug.')
        }
        throw new Error('Failed to update organization: ' + error.message)
      }
    } else {
      // Create new org atomized with adminClient so RLS ordering never blocks onboarding
      let referredByAffiliateId: string | null = null
      
      // Try to read the referral cookie
      const cookieStore = await cookies()
      const refCode = cookieStore.get('ourmenu_ref')?.value
      
      if (refCode) {
        const { data: affiliate } = await adminClient
          .from('affiliates')
          .select('id')
          .eq('referral_code', refCode)
          .single()
          
        if (affiliate) {
          referredByAffiliateId = affiliate.id
        }
      }

      const trialSettings = await getTrialSettings()
      const trialDays = (trialSettings as Record<string, unknown>).default_trial_days as number ?? 15
      const trialEndsAt = trialDays > 0 ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString() : undefined

      const { data: newOrg, error } = await adminClient
        .from('organizations')
        .insert({
          name,
          slug,
          created_by: user.id,
          referred_by_affiliate_id: referredByAffiliateId,
          trial_ends_at: trialEndsAt,
          business_type: business_type || null,
          logo_url: logo_url || null,
          refund_policy: refund_policy || null
        })
        .select('id')
        .single()
      
      if (error || !newOrg) {
        if (error && (error.code === '23505' || error.message.toLowerCase().includes('unique constraint') || error.message.toLowerCase().includes('slug'))) {
          throw new Error('This public slug (URL) is already taken. Please choose another slug.')
        }
        throw new Error('Failed to create organization: ' + (error?.message || 'unknown error'))
      }
      currentOrgId = newOrg.id

      // Add the creator to organization_members with the selected role (or default to owner)
      const selectedRole = role || 'owner'
      await adminClient.from('organization_members').insert({
        organization_id: currentOrgId,
        user_id: user.id,
        role: selectedRole
      })
    }

    // Always ensure a default location exists
    const { data: loc } = await adminClient
      .from('locations')
      .select('id')
      .eq('organization_id', currentOrgId)
      .limit(1)

    if (!loc || loc.length === 0) {
      let designTokens = null
      let preset = null
      if (business_type) {
        const { BUSINESS_TYPE_PRESETS } = await import('@/lib/templates/presets')
        preset = BUSINESS_TYPE_PRESETS[business_type]
        if (preset?.design_tokens) {
          designTokens = preset.design_tokens
        }
      }

      const { data: newLoc, error: locErr } = await adminClient
        .from('locations')
        .insert({
          organization_id: currentOrgId,
          name: 'Main Location',
          slug,
          address: 'Update your address',
          publication_status: 'draft',
          ...(designTokens ? { design_tokens: designTokens } : {})
        })
        .select('id')
        .single()
      
      if (locErr && (locErr.code === '23505' || locErr.message.toLowerCase().includes('unique constraint'))) {
        // If location slug taken, try inserting with org id appended or handled
        const fallbackSlug = `${slug}-${currentOrgId.slice(0, 6)}`
        const { data: retryLoc } = await adminClient
          .from('locations')
          .insert({
            organization_id: currentOrgId,
            name: 'Main Location',
            slug: fallbackSlug,
            address: 'Update your address',
            publication_status: 'draft',
            ...(designTokens ? { design_tokens: designTokens } : {})
          })
          .select('id')
          .single()
          
        if (retryLoc) {
          await adminClient.from('menus').insert({
            organization_id: currentOrgId,
            location_id: retryLoc.id,
            name: 'Main Menu',
          })
        }
      } else if (newLoc) {
        await adminClient.from('menus').insert({
          organization_id: currentOrgId,
          location_id: newLoc.id,
          name: 'Main Menu',
        })

        // Auto-create their primary page based on their selected business type
        if (preset) {
          const { buildPageTitle } = await import('@/lib/templates/presets')
          await adminClient.from('location_pages').insert({
            location_id: newLoc.id,
            title: buildPageTitle(preset, name),
            slug: 'home',
            template_type: preset.template_type,
            is_primary: true,
            billing_enabled: preset.billing_enabled,
            billing_mode: preset.billing_mode,
            payment_mode: preset.payment_mode,
            deposit_percentage: preset.deposit_percentage || null,
            business_type_preset: business_type,
            is_published: true,
          })
        }
      }
    }

    if (!existedBefore) {
      redirect('/dashboard')
    } else {
      revalidatePath('/dashboard/settings')
      return { success: true }
    }
  })

export const saveLocationAiSettings = authActionClient
  .schema(zfd.formData({
    locationId: zfd.text(z.string().uuid()),
    pageId: zfd.text(z.string().uuid().optional()),
    aiEnabled: zfd.checkbox(),
    aiName: zfd.text(z.string().min(1, "AI Name is required").max(30, "Name must be 30 characters or less")),
    aiBasePersonality: zfd.text(z.string().optional()),
    aiEscalationContact: zfd.text(z.string().max(200).optional()),
    aiInstructions: zfd.text(z.string().max(2000).optional()),
    aiFaqs: zfd.text(z.string().optional()), // JSON string
    brandKnowledge: zfd.text(z.string().max(4000).optional()),
    aiManagerProtectionMode: zfd.checkbox(),
  }))
  .action(async ({ parsedInput, ctx: { supabase, user } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/settings')
      return { success: true }
    }

    const {
      locationId,
      pageId,
      aiEnabled,
      aiName,
      aiBasePersonality,
      aiEscalationContact,
      aiInstructions,
      aiFaqs,
      brandKnowledge,
      aiManagerProtectionMode
    } = parsedInput

    let parsedFaqs = []
    try {
      if (aiFaqs) parsedFaqs = JSON.parse(aiFaqs)
    } catch (_e) {
      // Ignore parse error
    }

    let activeLocationId = locationId
    let targetPageId = pageId

    if (targetPageId) {
      // Fetch the page to verify it belongs to the location
      const { data: page, error: pageError } = await supabase
        .from('location_pages')
        .select('location_id')
        .eq('id', targetPageId)
        .single()

      if (pageError || !page) throw new Error('Page not found')
      activeLocationId = page.location_id
    } else {
      // If no pageId provided, we are editing the primary page of the location
      const { data: primaryPage, error: primaryError } = await supabase
        .from('location_pages')
        .select('id')
        .eq('location_id', locationId)
        .eq('is_primary', true)
        .limit(1)
        .single()
      
      if (!primaryError && primaryPage) {
        targetPageId = primaryPage.id
      }
    }

    const { data: loc, error: locError } = await supabase
      .from('locations')
      .select('organization_id')
      .eq('id', activeLocationId)
      .single()

    if (locError || !loc) throw new Error('Location not found')

    // Verify user role
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', loc.organization_id)
      .eq('user_id', user.id)
      .single()

    let isAuthorized = member?.role === 'owner' || member?.role === 'manager'
    if (!member) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', loc.organization_id)
        .eq('created_by', user.id).limit(1).maybeSingle()
      isAuthorized = !!org
    }

    if (!isAuthorized) throw new Error('Unauthorized')

    // Update settings on the page
    if (targetPageId) {
      const { error: updateError } = await supabase
        .from('location_pages')
        .update({
          ai_enabled: aiEnabled,
          ai_name: aiName,
          ai_base_personality: aiBasePersonality || 'professional',
          ai_escalation_contact: aiEscalationContact || null,
          ai_instructions: aiInstructions || null,
          ai_faqs: parsedFaqs,
        })
        .eq('id', targetPageId)
      
      if (updateError) throw new Error('Failed to update AI settings')
    }

    // Also update brand_knowledge and ai_manager_protection_mode on the location since it's venue-wide
    await supabase
      .from('locations')
      .update({
        brand_knowledge: brandKnowledge || null,
        ai_manager_protection_mode: aiManagerProtectionMode ?? false
      })
      .eq('id', activeLocationId)

    revalidatePath('/dashboard/settings')
    return { success: true }
  })

export const saveLocationTheme = authActionClient
  .schema(zfd.formData({
    locationId: zfd.text(z.string().uuid()),
    themeColor: zfd.text(z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")),
  }))
  .action(async ({ parsedInput, ctx: { supabase, user } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/settings')
      return { success: true }
    }

    const { locationId, themeColor } = parsedInput

    const { data: loc, error: locError } = await supabase
      .from('locations')
      .select('organization_id')
      .eq('id', locationId)
      .single()

    if (locError || !loc) throw new Error('Location not found')

    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', loc.organization_id)
      .eq('user_id', user.id)
      .single()

    let isAuthorized = member?.role === 'owner' || member?.role === 'manager'
    if (!member) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', loc.organization_id)
        .eq('created_by', user.id).limit(1).maybeSingle()
      isAuthorized = !!org
    }

    if (!isAuthorized) throw new Error('Unauthorized')

    const { error: updateError } = await supabase
      .from('locations')
      .update({ theme_color: themeColor })
      .eq('id', locationId)

    if (updateError) throw new Error('Failed to update theme color')

    revalidatePath('/dashboard/settings')
    return { success: true }
  })

export const saveLocationInfoSettings = authActionClient
  .schema(zfd.formData({
    locationId: zfd.text(z.string().uuid()),
    pageId: zfd.text(z.string().uuid().optional().or(z.literal(''))),
    currencyCode: zfd.text(z.string().min(3).max(3).optional()),
    wifiNetwork: zfd.text(z.string().max(100).optional()),
    wifiPassword: zfd.text(z.string().max(100).optional()),
    instagramHandle: zfd.text(z.string().max(50).optional()),
    twitterHandle: zfd.text(z.string().max(50).optional()),
    xHandle: zfd.text(z.string().max(50).optional()),
    tiktokHandle: zfd.text(z.string().max(50).optional()),
    facebookHandle: zfd.text(z.string().max(50).optional()),
    whatsappNumber: zfd.text(z.string().max(30).optional()),
    phoneNumber: zfd.text(z.string().max(30).optional()),
    googleMapsUrl: zfd.text(z.string().max(300).url().optional().or(z.literal(''))),
    operatingHours: zfd.text(z.string().max(200).optional()),
    fulfillmentLocationLabel: zfd.text(z.string().max(50).optional()),
    portalDisplayName: zfd.text(z.string().max(100).optional()),
    randomizerEnabled: zfd.checkbox(),
    isSearchVisible: zfd.checkbox(),
    managerPin: zfd.text(z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits").optional().or(z.literal(''))),
    address: zfd.text(z.string().max(300).optional()),
    latitude: zfd.numeric(z.number().optional()),
    longitude: zfd.numeric(z.number().optional()),
    geofenceRadiusMeters: zfd.numeric(z.number().min(50).max(5000).optional()),
  }))
  .action(async ({ parsedInput, ctx: { supabase, user } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/settings')
      return { success: true }
    }

    const { locationId, pageId } = parsedInput

    // Fetch the location to verify auth
    const { data: loc, error: locError } = await supabase
      .from('locations')
      .select('organization_id')
      .eq('id', locationId)
      .single()

    if (locError || !loc) throw new Error('Location not found')

    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', loc.organization_id)
      .eq('user_id', user.id)
      .single()

    let isAuthorized = member?.role === 'owner' || member?.role === 'manager'
    if (!member) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', loc.organization_id)
        .eq('created_by', user.id).limit(1).maybeSingle()
      isAuthorized = !!org
    }

    if (!isAuthorized) throw new Error('Unauthorized')

    if (pageId) {
      // Update page settings (independent sub-business overrides)
      const { error: updateError } = await supabase
        .from('location_pages')
        .update({
          wifi_network: parsedInput.wifiNetwork || null,
          wifi_password: parsedInput.wifiPassword || null,
          contact_phone: parsedInput.phoneNumber || null,
          operating_hours: parsedInput.operatingHours || null,
          address: parsedInput.address || null,
        })
        .eq('id', pageId)
        .eq('location_id', locationId)

      if (updateError) throw new Error('Failed to update page info')
    } else {
      // Update location settings
      const { error: updateError } = await supabase
        .from('locations')
        .update({
          currency_code: parsedInput.currencyCode || undefined,
          wifi_network: parsedInput.wifiNetwork || null,
          wifi_password: parsedInput.wifiPassword || null,
          instagram_handle: parsedInput.instagramHandle || null,
          twitter_handle: parsedInput.twitterHandle || null,
          x_handle: parsedInput.xHandle || null,
          tiktok_handle: parsedInput.tiktokHandle || null,
          facebook_handle: parsedInput.facebookHandle || null,
          whatsapp_number: parsedInput.whatsappNumber || null,
          phone_number: parsedInput.phoneNumber || null,
          google_maps_url: parsedInput.googleMapsUrl || null,
          operating_hours: parsedInput.operatingHours || null,
          fulfillment_location_label: parsedInput.fulfillmentLocationLabel || 'Table',
          portal_display_name: parsedInput.portalDisplayName || null,
          randomizer_enabled: parsedInput.randomizerEnabled,
          is_search_visible: parsedInput.isSearchVisible,
          manager_pin: parsedInput.managerPin || null,
          address: parsedInput.address || null,
          latitude: parsedInput.latitude || null,
          longitude: parsedInput.longitude || null,
          geofence_radius_meters: parsedInput.geofenceRadiusMeters || 100,
        })
        .eq('id', locationId)

      if (updateError) throw new Error('Failed to update location info')
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
  })

export const saveLoyaltySettings = authActionClient
  .schema(zfd.formData({
    organizationId: zfd.text(z.string().uuid()),
    isEnabled: zfd.checkbox(),
    pointsPerMajorUnit: zfd.numeric(z.number().min(1).max(1000000).default(1)),
    rewardThreshold: zfd.numeric(z.number().min(1).max(1000000).default(100)),
    rewardDiscountMinor: zfd.numeric(z.number().min(0).default(0)),
    advancedRules: zfd.text(z.string().optional()),
  }))
  .action(async ({ parsedInput, ctx: { supabase, user } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/settings')
      return { success: true }
    }

    const { organizationId, isEnabled, pointsPerMajorUnit, rewardThreshold, rewardDiscountMinor, advancedRules } = parsedInput

    // Verify auth
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    let isAuthorized = member?.role === 'owner' || member?.role === 'manager'
    if (!member) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', organizationId)
        .eq('created_by', user.id).limit(1).maybeSingle()
      isAuthorized = !!org
    }

    if (!isAuthorized) throw new Error('Unauthorized')

    // Upsert settings
    const { error: upsertError } = await supabase
      .from('loyalty_settings')
      .upsert({
        organization_id: organizationId,
        is_enabled: isEnabled,
        points_per_major_unit: pointsPerMajorUnit,
        reward_threshold: rewardThreshold,
        reward_discount_minor: rewardDiscountMinor,
        advanced_rules: advancedRules ? JSON.parse(advancedRules) : [],
        updated_at: new Date().toISOString()
      }, { onConflict: 'organization_id' })

    if (upsertError) throw new Error('Failed to save loyalty settings')

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/customers')
    return { success: true }
  })

export const updateProfile = authActionClient
  .schema(zfd.formData({
    full_name: zfd.text(z.string().min(1, "Full name is required")),
    bank_name: zfd.text(z.string().optional()),
    account_number: zfd.text(z.string().optional()),
    account_name: zfd.text(z.string().optional()),
  }))
  .action(async ({ parsedInput, ctx: { supabase, user } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/settings')
      return { success: true }
    }

    const { full_name, bank_name, account_number, account_name } = parsedInput

    
    const { data: existingProfile } = (await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()) as { data: Record<string, unknown> | null }

    let subaccountCode = existingProfile?.paystack_subaccount_code || null

    if (
      bank_name && 
      account_number && 
      account_name && 
      (!subaccountCode || existingProfile?.bank_name !== bank_name || existingProfile?.account_number !== account_number || existingProfile?.account_name !== account_name)
    ) {
      const { createSubaccount } = await import('@/lib/payments/paystack')
      const { getPlatformFees } = await import('@/lib/utils/settings')
      try {
        const platformFees = await getPlatformFees() as { staff_tip_subaccount: number }
        subaccountCode = await createSubaccount(bank_name, account_number, account_name, platformFees.staff_tip_subaccount ?? 0)
      } catch (err) {
        console.error('Failed to create Paystack subaccount for staff tip profile:', err)
      }
    }

    // 1. Update Auth metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: { full_name }
    })

    if (updateError) throw new Error('Failed to update auth metadata')

    
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        full_name,
        bank_name: bank_name || null,
        account_number: account_number || null,
        account_name: account_name || null,
        paystack_subaccount_code: subaccountCode
      } as never)

    if (profileError) {
      console.error('Error updating user_profiles:', profileError)
      throw new Error('Failed to update user profile')
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
  })

export const createLocation = authActionClient
  .schema(zfd.formData({
    name: zfd.text(z.string().min(2, "Location name must be at least 2 characters").max(100)),
    slug: zfd.text(z.string().min(3, "Slug must be at least 3 characters").max(50).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")),
  }))
  .action(async ({ parsedInput, ctx: { supabase, user } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/settings')
      return { success: true }
    }

    const { name, slug } = parsedInput

    const { createAdminClient } = await import('@/lib/supabase/server')
    const adminClient = await createAdminClient()

    // 1. Get user org
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    let orgId = member?.organization_id
    let isAuthorized = member?.role === 'owner' || member?.role === 'manager'

    if (!orgId) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('created_by', user.id)
        .limit(1)
        .single()
      
      if (org) {
        orgId = org.id
        isAuthorized = true
      }
    }

    if (!orgId || !isAuthorized) {
      throw new Error('You do not have permission to create locations for this organization.')
    }

    // 2. Insert new location
    const { data: newLoc, error: locError } = await adminClient
      .from('locations')
      .insert({
        organization_id: orgId,
        name,
        slug,
        address: 'Update your address',
        publication_status: 'draft',
      })
      .select('id')
      .single()

    if (locError) {
      if (locError.code === '23505' || locError.message.toLowerCase().includes('unique constraint') || locError.message.toLowerCase().includes('slug')) {
        throw new Error('This public slug (URL) is already taken. Please choose another slug.')
      }
      throw new Error('Failed to create location: ' + locError.message)
    }

    if (newLoc) {
      // 3. Set up a default main menu
      await adminClient.from('menus').insert({
        organization_id: orgId,
        location_id: newLoc.id,
        name: 'Main Menu',
      })
      
      // 4. Switch the user to the new location context immediately
      const cookieStore = await cookies()
      cookieStore.set('ourmenu_active_location_id', newLoc.id, { path: '/' })
      cookieStore.delete('ourmenu_active_page_id') // Clear page context since it's a new location
    }

    const { revalidateTag } = await import('next/cache')
    try {
      revalidateTag(`location_${slug}`, 'default')
      if (newLoc?.id) revalidateTag(`location_pages_${newLoc.id}`, 'default')
    } catch {
      // Ignore cache tag errors in background
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings')
    revalidatePath(`/m/${slug}`)
    return { success: true }
  })


export const saveLocationDesignTokens = authActionClient
  .schema(zfd.formData({
    locationId: zfd.text(z.string().uuid()),
    layout_mode: zfd.text(z.string().optional()),
    corner_radius: zfd.text(z.string().optional()),
    surface_style: zfd.text(z.string().optional()),
    typography: zfd.text(z.string().optional()),
    animation_style: zfd.text(z.string().optional()),
    density: zfd.text(z.string().optional()),
    color_theme: zfd.text(z.string().optional()),
    aspect_ratio: zfd.text(z.string().optional()),
  }))
  .action(async ({ parsedInput, ctx: { supabase, user } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/settings')
      return { success: true }
    }

    const { locationId, ...tokens } = parsedInput
    const { data: loc } = await supabase.from('locations').select('organization_id').eq('id', locationId).single()
    if (!loc) throw new Error('Location not found')
    
    const { data: member } = await supabase.from('organization_members').select('role').eq('organization_id', loc.organization_id).eq('user_id', user.id).single()
    let isAuthorized = member?.role === 'owner' || member?.role === 'manager'
    if (!member) {
      const { data: org } = await supabase.from('organizations').select('id').eq('id', loc.organization_id).eq('created_by', user.id).single()
      isAuthorized = !!org
    }
    if (!isAuthorized) throw new Error('Unauthorized')

    // Filter out undefined tokens
    const cleanTokens = Object.fromEntries(Object.entries(tokens).filter(([_, v]) => v !== undefined))

    const { error } = await supabase.from('locations').update({ design_tokens: cleanTokens } as never).eq('id', locationId)
    if (error) throw new Error(error.message)
    
    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/appearance')
    return { success: true }
  })

export const savePageDesignTokens = authActionClient
  .schema(zfd.formData({
    pageId: zfd.text(z.string()),
    layout_mode: zfd.text(z.string().optional()),
    corner_radius: zfd.text(z.string().optional()),
    surface_style: zfd.text(z.string().optional()),
    typography: zfd.text(z.string().optional()),
    animation_style: zfd.text(z.string().optional()),
    density: zfd.text(z.string().optional()),
    color_theme: zfd.text(z.string().optional()),
    aspect_ratio: zfd.text(z.string().optional()),
  }))
  .action(async ({ parsedInput, ctx: { supabase, user } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/settings')
      return { success: true }
    }

    const { pageId, ...tokens } = parsedInput
    
    // Auth check
    const { data: page } = await supabase.from('location_pages').select('location_id').eq('id', pageId).single()
    if (!page) throw new Error('Page not found')
      
    const { data: loc } = await supabase.from('locations').select('organization_id').eq('id', page.location_id).single()
    if (!loc) throw new Error('Location not found')
    
    const { data: member } = await supabase.from('organization_members').select('role').eq('organization_id', loc.organization_id).eq('user_id', user.id).single()
    let isAuthorized = member?.role === 'owner' || member?.role === 'manager'
    if (!member) {
      const { data: org } = await supabase.from('organizations').select('id').eq('id', loc.organization_id).eq('created_by', user.id).single()
      isAuthorized = !!org
    }
    if (!isAuthorized) throw new Error('Unauthorized')

    // If tokens are all undefined/null, we want to set it to null to revert to Global
    const hasValues = Object.values(tokens).some(v => v !== undefined && v !== null && v !== '')
    
    const updateData = hasValues 
      ? Object.fromEntries(Object.entries(tokens).filter(([_, v]) => v !== undefined))
      : null

    const { error } = await supabase.from('location_pages').update({ design_tokens: updateData } as never).eq('id', pageId)
    if (error) throw new Error(error.message)
    
    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/appearance')
    return { success: true }
  })
