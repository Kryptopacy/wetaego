'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'

const organizationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
})

export async function updateOrganization(formData: FormData) {
  try {
    const supabase = await createClient()

    const { data: userData, error: authError } = await supabase.auth.getUser()
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/settings')
      return
    }
    if (authError || !userData?.user) return { error: 'Unauthorized' }

    const rawData = {
      name: formData.get('name'),
      slug: formData.get('slug'),
    }

    // Validate with Zod
    const validatedData = organizationSchema.parse(rawData)

    // Find existing org for this user
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', userData.user.id)
      .single()

    let currentOrgId = org?.id || ''

    if (org) {
      // Update existing org
      const { error } = await supabase
        .from('organizations')
        .update({ name: validatedData.name, slug: validatedData.slug })
        .eq('id', org.id)
      
      if (error) return { error: 'Unknown error' }
    } else {
      // Create new org
      let referredByAffiliateId: string | null = null
      
      // Try to read the referral cookie
      const { cookies } = await import('next/headers')
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
          name: validatedData.name,
          slug: validatedData.slug,
          created_by: userData.user.id,
          referred_by_affiliate_id: referredByAffiliateId
        })
        .select('id')
        .single()
      
      if (error) return { error: 'Unknown error' }
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
          slug: validatedData.slug,
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
  } catch (error) {
    Sentry.captureException(error)
    throw error // The UI can handle the thrown error
  }
}

const aiSettingsSchema = z.object({
  locationId: z.string().uuid(),
  aiEnabled: z.boolean(),
  aiName: z.string().min(1, "AI Name is required").max(30, "Name must be 30 characters or less"),
  aiInstructions: z.string().max(2000).optional().nullable(),
  brandKnowledge: z.string().max(4000).optional().nullable(),
})

export async function saveLocationAiSettings(formData: FormData) {
  try {
    const supabase = await createClient()

    const { data: userData, error: authError } = await supabase.auth.getUser()
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/settings')
      return
    }
    if (authError || !userData?.user) return { error: 'Unknown error' }

    const locationId = formData.get('locationId') as string
    const aiEnabled = formData.get('aiEnabled') === 'true'
    const aiName = formData.get('aiName') as string
    const aiInstructions = formData.get('aiInstructions') as string
    const brandKnowledge = formData.get('brandKnowledge') as string

    // Validate with Zod
    const validatedData = aiSettingsSchema.parse({
      locationId,
      aiEnabled,
      aiName,
      aiInstructions: aiInstructions || null,
      brandKnowledge: brandKnowledge || null,
    })

    // Fetch the location to find its organization
    const { data: loc, error: locError } = await supabase
      .from('locations')
      .select('organization_id')
      .eq('id', validatedData.locationId)
      .single()

    if (locError || !loc) return { error: 'Unknown error' }

    // Verify user role
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', loc.organization_id)
      .eq('user_id', userData.user.id)
      .single()

    let isAuthorized = member?.role === 'owner' || member?.role === 'manager'
    if (!member) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', loc.organization_id)
        .eq('created_by', userData.user.id)
        .single()
      isAuthorized = !!org
    }

    if (!isAuthorized) return { error: 'Unknown error' }

    // Update settings
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        ai_enabled: validatedData.aiEnabled,
        ai_name: validatedData.aiName,
        ai_instructions: validatedData.aiInstructions,
        brand_knowledge: validatedData.brandKnowledge,
      })
      .eq('id', validatedData.locationId)

    if (updateError) return { error: 'Unknown error' }

    revalidatePath('/dashboard/settings')
  } catch (error) {
    Sentry.captureException(error)
    throw error
  }
}

const locationInfoSchema = z.object({
  locationId: z.string().uuid(),
  currencyCode: z.string().min(3).max(3).optional(),
  wifiNetwork: z.string().max(100).optional().nullable(),
  wifiPassword: z.string().max(100).optional().nullable(),
  instagramHandle: z.string().max(50).optional().nullable(),
  twitterHandle: z.string().max(50).optional().nullable(),
  facebookHandle: z.string().max(50).optional().nullable(),
  whatsappNumber: z.string().max(30).optional().nullable(),
  phoneNumber: z.string().max(30).optional().nullable(),
  googleMapsUrl: z.string().max(300).url().optional().nullable().or(z.literal('')),
  operatingHours: z.string().max(200).optional().nullable(),
  randomizerEnabled: z.boolean().optional(),
})

export async function saveLocationInfoSettings(formData: FormData) {
  try {
    const supabase = await createClient()

    const { data: userData, error: authError } = await supabase.auth.getUser()
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/settings')
      return
    }
    if (authError || !userData?.user) return { error: 'Unknown error' }

    const locationId = formData.get('locationId') as string
    
    // Validate
    const validatedData = locationInfoSchema.parse({
      locationId,
      currencyCode: formData.get('currency_code') || null,
      wifiNetwork: formData.get('wifiNetwork') || null,
      wifiPassword: formData.get('wifiPassword') || null,
      instagramHandle: formData.get('instagramHandle') || null,
      twitterHandle: formData.get('twitterHandle') || null,
      facebookHandle: formData.get('facebookHandle') || null,
      whatsappNumber: formData.get('whatsappNumber') || null,
      phoneNumber: formData.get('phoneNumber') || null,
      googleMapsUrl: formData.get('googleMapsUrl') || null,
      operatingHours: formData.get('operatingHours') || null,
      randomizerEnabled: formData.get('randomizerEnabled') === 'true',
    })

    // Fetch the location to verify auth
    const { data: loc, error: locError } = await supabase
      .from('locations')
      .select('organization_id')
      .eq('id', validatedData.locationId)
      .single()

    if (locError || !loc) return { error: 'Unknown error' }

    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', loc.organization_id)
      .eq('user_id', userData.user.id)
      .single()

    let isAuthorized = member?.role === 'owner' || member?.role === 'manager'
    if (!member) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', loc.organization_id)
        .eq('created_by', userData.user.id)
        .single()
      isAuthorized = !!org
    }

    if (!isAuthorized) return { error: 'Unknown error' }

    // Update settings
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        currency_code: validatedData.currencyCode || undefined,
        wifi_network: validatedData.wifiNetwork,
        wifi_password: validatedData.wifiPassword,
        instagram_handle: validatedData.instagramHandle,
        twitter_handle: validatedData.twitterHandle,
        facebook_handle: validatedData.facebookHandle,
        whatsapp_number: validatedData.whatsappNumber,
        phone_number: validatedData.phoneNumber,
        google_maps_url: validatedData.googleMapsUrl === '' ? null : validatedData.googleMapsUrl,
        operating_hours: validatedData.operatingHours,
        randomizer_enabled: validatedData.randomizerEnabled,
      })
      .eq('id', validatedData.locationId)

    if (updateError) return { error: 'Unknown error' }

    revalidatePath('/dashboard/settings')
  } catch (error) {
    Sentry.captureException(error)
    throw error
  }
}


const loyaltySettingsSchema = z.object({
  organizationId: z.string().uuid(),
  isEnabled: z.boolean(),
  pointsPerMajorUnit: z.number().min(1).max(1000000),
  rewardThreshold: z.number().min(1).max(1000000),
  rewardDiscountMinor: z.number().min(0),
})

export async function saveLoyaltySettings(formData: FormData) {
  try {
    const supabase = await createClient()

    const { data: userData, error: authError } = await supabase.auth.getUser()
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/settings')
      return
    }
    if (authError || !userData?.user) return { error: 'Unknown error' }

    const organizationId = formData.get('organizationId') as string
    
    // Validate
    const validatedData = loyaltySettingsSchema.parse({
      organizationId,
      isEnabled: formData.get('isEnabled') === 'true',
      pointsPerMajorUnit: parseInt(formData.get('pointsPerMajorUnit') as string) || 1,
      rewardThreshold: parseInt(formData.get('rewardThreshold') as string) || 100,
      rewardDiscountMinor: parseInt(formData.get('rewardDiscountMinor') as string) || 0,
    })

    // Verify auth
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', validatedData.organizationId)
      .eq('user_id', userData.user.id)
      .single()

    let isAuthorized = member?.role === 'owner' || member?.role === 'manager'
    if (!member) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', validatedData.organizationId)
        .eq('created_by', userData.user.id)
        .single()
      isAuthorized = !!org
    }

    if (!isAuthorized) return { error: 'Unknown error' }

    // Upsert settings
    const { error: upsertError } = await supabase
      .from('loyalty_settings')
      .upsert({
        organization_id: validatedData.organizationId,
        is_enabled: validatedData.isEnabled,
        points_per_major_unit: validatedData.pointsPerMajorUnit,
        reward_threshold: validatedData.rewardThreshold,
        reward_discount_minor: validatedData.rewardDiscountMinor,
        updated_at: new Date().toISOString()
      }, { onConflict: 'organization_id' })

    if (upsertError) return { error: 'Unknown error' }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/customers')
  } catch (error) {
    Sentry.captureException(error)
    throw error
  }
}

export async function updateProfile(formData: FormData) {
  try {
    const supabase = await createClient()

    const { data: userData, error: authError } = await supabase.auth.getUser()
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/settings')
      return { success: true }
    }
    if (authError || !userData?.user) return { error: 'Unknown error' }

    const fullName = formData.get('full_name') as string
    if (!fullName) return { error: 'Unknown error' }

    const bankName = (formData.get('bank_name') as string) || null
    const accountNumber = (formData.get('account_number') as string) || null
    const accountName = (formData.get('account_name') as string) || null

    // Fetch existing profile to check if we already have a subaccount
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingProfile } = await (supabase as any)
      .from('user_profiles')
      .select('paystack_subaccount_code, bank_name, account_number, account_name')
      .eq('id', userData.user.id)
      .single()

    let subaccountCode = existingProfile?.paystack_subaccount_code || null

    // Only create a new subaccount if bank details are provided AND they changed (or subaccount doesn't exist)
    if (
      bankName && 
      accountNumber && 
      accountName && 
      (!subaccountCode || existingProfile?.bank_name !== bankName || existingProfile?.account_number !== accountNumber || existingProfile?.account_name !== accountName)
    ) {
      const { createSubaccount } = await import('@/lib/payments/paystack')
      const { getPlatformFees } = await import('@/lib/utils/settings')
      try {
        const platformFees = await getPlatformFees() as { staff_tip_subaccount: number }
        // We pass the configured fee (defaulting to 0) for staff tips
        subaccountCode = await createSubaccount(bankName, accountNumber, accountName, platformFees.staff_tip_subaccount ?? 0)
      } catch (err) {
        console.error('Failed to create Paystack subaccount for staff tip profile:', err)
        // We don't fail the entire profile update, just log it
      }
    }

    // 1. Update Auth metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: { full_name: fullName }
    })

    if (updateError) return { error: 'Unknown error' }

    // 2. Upsert into user_profiles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (supabase as any)
      .from('user_profiles')
      .upsert({
        id: userData.user.id,
        full_name: fullName,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
        paystack_subaccount_code: subaccountCode
      })

    if (profileError) {
      console.error('Error updating user_profiles:', profileError)
      return { error: 'Unknown error' }
    }

    revalidatePath('/dashboard/settings')
  } catch (error) {
    Sentry.captureException(error)
    throw error
  }
}
