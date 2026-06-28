'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { authActionClient } from '@/lib/safe-action'

export const updateOrganization = authActionClient
  .schema(zfd.formData({
    name: zfd.text(z.string().min(2, "Name must be at least 2 characters")),
    slug: zfd.text(z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"))
  }))
  .action(async ({ parsedInput: { name, slug }, ctx: { supabase, user } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/settings')
      return { success: true }
    }

    // Find existing org for this user
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .single()

    let currentOrgId = org?.id || ''

    if (org) {
      // Update existing org
      const { error } = await supabase
        .from('organizations')
        .update({ name, slug })
        .eq('id', org.id)
      
      if (error) throw new Error('Failed to update organization')
    } else {
      // Create new org
      let referredByAffiliateId: string | null = null
      
      // Try to read the referral cookie
      const cookieStore = await cookies()
      const refCode = cookieStore.get('ourmenu_ref')?.value
      
      if (refCode) {
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('id')
          .eq('referral_code', refCode)
          .single()
          
        if (affiliate) {
          referredByAffiliateId = affiliate.id
        }
      }

      const { data: newOrg, error } = await supabase
        .from('organizations')
        .insert({
          name,
          slug,
          created_by: user.id,
          referred_by_affiliate_id: referredByAffiliateId
        })
        .select('id')
        .single()
      
      if (error || !newOrg) throw new Error('Failed to create organization')
      currentOrgId = newOrg.id
    }

    // Always ensure a default location exists
    const { data: loc } = await supabase
      .from('locations')
      .select('id')
      .eq('organization_id', currentOrgId)
      .limit(1)

    if (!loc || loc.length === 0) {
      const { data: newLoc } = await supabase
        .from('locations')
        .insert({
          organization_id: currentOrgId,
          name: 'Main Location',
          slug,
          address: 'Update your address',
        })
        .select('id')
        .single()
      
      // Create default menu
      if (newLoc) {
        await supabase.from('menus').insert({
          organization_id: currentOrgId,
          location_id: newLoc.id,
          name: 'Main Menu',
        })
      }
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
  })

export const saveLocationAiSettings = authActionClient
  .schema(zfd.formData({
    locationId: zfd.text(z.string().uuid()),
    aiEnabled: zfd.checkbox(),
    aiName: zfd.text(z.string().min(1, "AI Name is required").max(30, "Name must be 30 characters or less")),
    aiInstructions: zfd.text(z.string().max(2000).optional()),
    brandKnowledge: zfd.text(z.string().max(4000).optional()),
  }))
  .action(async ({ parsedInput, ctx: { supabase, user } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/settings')
      return { success: true }
    }

    const {
      locationId,
      aiEnabled,
      aiName,
      aiInstructions,
      brandKnowledge
    } = parsedInput

    // Fetch the location to find its organization
    const { data: loc, error: locError } = await supabase
      .from('locations')
      .select('organization_id')
      .eq('id', locationId)
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
        .eq('created_by', user.id)
        .single()
      isAuthorized = !!org
    }

    if (!isAuthorized) throw new Error('Unauthorized')

    // Update settings
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        ai_enabled: aiEnabled,
        ai_name: aiName,
        ai_instructions: aiInstructions || null,
        brand_knowledge: brandKnowledge || null,
      })
      .eq('id', locationId)

    if (updateError) throw new Error('Failed to update AI settings')

    revalidatePath('/dashboard/settings')
    return { success: true }
  })

export const saveLocationInfoSettings = authActionClient
  .schema(zfd.formData({
    locationId: zfd.text(z.string().uuid()),
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
    randomizerEnabled: zfd.checkbox(),
  }))
  .action(async ({ parsedInput, ctx: { supabase, user } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/settings')
      return { success: true }
    }

    const { locationId } = parsedInput

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
        .eq('created_by', user.id)
        .single()
      isAuthorized = !!org
    }

    if (!isAuthorized) throw new Error('Unauthorized')

    // Update settings
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
        google_maps_url: parsedInput.googleMapsUrl === '' ? null : (parsedInput.googleMapsUrl || null),
        operating_hours: parsedInput.operatingHours || null,
        fulfillment_location_label: parsedInput.fulfillmentLocationLabel || null,
        randomizer_enabled: parsedInput.randomizerEnabled,
      })
      .eq('id', locationId)

    if (updateError) throw new Error('Failed to update location info')

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
  }))
  .action(async ({ parsedInput, ctx: { supabase, user } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/settings')
      return { success: true }
    }

    const { organizationId, isEnabled, pointsPerMajorUnit, rewardThreshold, rewardDiscountMinor } = parsedInput

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
        .eq('created_by', user.id)
        .single()
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingProfile } = await (supabase as any)
      .from('user_profiles')
      .select('paystack_subaccount_code, bank_name, account_number, account_name')
      .eq('id', user.id)
      .single()

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (supabase as any)
      .from('user_profiles')
      .upsert({
        id: user.id,
        full_name,
        bank_name: bank_name || null,
        account_number: account_number || null,
        account_name: account_name || null,
        paystack_subaccount_code: subaccountCode
      })

    if (profileError) {
      console.error('Error updating user_profiles:', profileError)
      throw new Error('Failed to update user profile')
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
  })
