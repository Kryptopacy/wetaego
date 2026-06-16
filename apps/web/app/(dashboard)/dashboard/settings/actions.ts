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
    if (authError || !userData?.user) throw new Error('Not authenticated')

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
      
      if (error) throw new Error('Could not update organization')
    } else {
      // Create new org
      const { data: newOrg, error } = await supabase
        .from('organizations')
        .insert({
          name: validatedData.name,
          slug: validatedData.slug,
          created_by: userData.user.id,
        })
        .select('id')
        .single()
      
      if (error) throw new Error('Could not create organization')
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

export async function saveLocationAiSettings(formData: FormData): Promise<void> {
  try {
    const supabase = await createClient()

    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData?.user) throw new Error('Not authenticated')

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

    if (locError || !loc) throw new Error('Location not found')

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

    if (!isAuthorized) throw new Error('Only owners and managers can modify AI settings.')

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

    if (updateError) throw new Error(updateError.message)

    revalidatePath('/dashboard/settings')
  } catch (error) {
    Sentry.captureException(error)
    throw error
  }
}

const locationInfoSchema = z.object({
  locationId: z.string().uuid(),
  wifiNetwork: z.string().max(100).optional().nullable(),
  wifiPassword: z.string().max(100).optional().nullable(),
  instagramHandle: z.string().max(50).optional().nullable(),
  twitterHandle: z.string().max(50).optional().nullable(),
  facebookHandle: z.string().max(50).optional().nullable(),
  whatsappNumber: z.string().max(30).optional().nullable(),
  phoneNumber: z.string().max(30).optional().nullable(),
  googleMapsUrl: z.string().max(300).url().optional().nullable().or(z.literal('')),
  operatingHours: z.string().max(200).optional().nullable(),
})

export async function saveLocationInfoSettings(formData: FormData): Promise<void> {
  try {
    const supabase = await createClient()

    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData?.user) throw new Error('Not authenticated')

    const locationId = formData.get('locationId') as string
    
    // Validate
    const validatedData = locationInfoSchema.parse({
      locationId,
      wifiNetwork: formData.get('wifiNetwork') || null,
      wifiPassword: formData.get('wifiPassword') || null,
      instagramHandle: formData.get('instagramHandle') || null,
      twitterHandle: formData.get('twitterHandle') || null,
      facebookHandle: formData.get('facebookHandle') || null,
      whatsappNumber: formData.get('whatsappNumber') || null,
      phoneNumber: formData.get('phoneNumber') || null,
      googleMapsUrl: formData.get('googleMapsUrl') || null,
      operatingHours: formData.get('operatingHours') || null,
    })

    // Fetch the location to verify auth
    const { data: loc, error: locError } = await supabase
      .from('locations')
      .select('organization_id')
      .eq('id', validatedData.locationId)
      .single()

    if (locError || !loc) throw new Error('Location not found')

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

    if (!isAuthorized) throw new Error('Only owners and managers can modify location info.')

    // Update settings
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        wifi_network: validatedData.wifiNetwork,
        wifi_password: validatedData.wifiPassword,
        instagram_handle: validatedData.instagramHandle,
        twitter_handle: validatedData.twitterHandle,
        facebook_handle: validatedData.facebookHandle,
        whatsapp_number: validatedData.whatsappNumber,
        phone_number: validatedData.phoneNumber,
        google_maps_url: validatedData.googleMapsUrl === '' ? null : validatedData.googleMapsUrl,
        operating_hours: validatedData.operatingHours,
      })
      .eq('id', validatedData.locationId)

    if (updateError) throw new Error(updateError.message)

    revalidatePath('/dashboard/settings')
  } catch (error) {
    Sentry.captureException(error)
    throw error
  }
}
