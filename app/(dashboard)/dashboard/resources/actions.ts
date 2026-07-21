'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { authActionClient } from '@/lib/safe-action'

export async function addResource({ 
  organization_id, 
  location_id, 
  name, 
  type, 
  capacity, 
  zone_name 
}: { 
  organization_id: string, 
  location_id: string, 
  name: string, 
  type: string, 
  capacity?: number, 
  zone_name?: string 
}) {
  const supabase = await createClient()

  const payload: import('@/lib/supabase/types').Database['public']['Tables']['resources']['Insert'] = {
    organization_id,
    location_id,
    name,
    type,
    zone_name: zone_name || null
  }
  if (capacity) payload.capacity = capacity

  const { error } = await supabase.from('resources').insert(payload)
  
  if (error) return { serverError: error.message }
  
  revalidatePath('/dashboard/resources')
  return { success: true }
}

export async function updateResource({ 
  id, 
  name, 
  type, 
  capacity, 
  zone_name 
}: { 
  id: string, 
  name: string, 
  type: string, 
  capacity?: number, 
  zone_name?: string 
}) {
  const supabase = await createClient()

  const payload: import('@/lib/supabase/types').Database['public']['Tables']['resources']['Update'] = {
    name,
    type,
    zone_name: zone_name || null,
    updated_at: new Date().toISOString()
  }
  if (capacity) payload.capacity = capacity
  else payload.capacity = null

  const { error } = await supabase.from('resources').update(payload).eq('id', id)
  
  if (error) return { serverError: error.message }
  
  revalidatePath('/dashboard/resources')
  return { success: true }
}

export async function deleteResource(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('resources').delete().eq('id', id)
  
  if (error) return { serverError: error.message }
  
  revalidatePath('/dashboard/resources')
  return { success: true }
}

// ----------------------------------------------------------------------
// QR Code Actions (Merged from legacy /qr/actions.ts)
// ----------------------------------------------------------------------

export const generateQrBatch = authActionClient
  .schema(zfd.formData({
    organization_id: zfd.text(z.string().min(1)),
    location_id: zfd.text(z.string().min(1)),
    quantity: zfd.numeric(z.number().min(1).max(100)),
    zone_id: zfd.text(z.string().optional()),
  }))
  .action(async ({ parsedInput: { organization_id: orgId, location_id: rawLocationId, quantity, zone_id }, ctx: { supabase, user } }) => {
    const [locationId, destinationPath] = rawLocationId.split('|')
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const isDemo = cookieStore.get('demo_mode')?.value === '1'

    if (isDemo && orgId === 'demo-org') {
      if (quantity > 1) throw new Error('Demo mode is limited to generating 1 QR code at a time.')
      return { success: true }
    }

    const { data: loc, error: locError } = await supabase
      .from('locations')
      .select('slug')
      .eq('id', locationId)
      .single()

    if (locError || !loc) throw new Error('Location not found')

    const { data: org } = await supabase
      .from('organizations')
      .select('subscription_tier')
      .eq('id', orgId)
      .single()

    const { count } = await supabase
      .from('qr_codes')
      .select('id', { count: 'exact' })
      .eq('organization_id', orgId)

    const { getFreeQrLimit } = await import('@/lib/utils/billing')
    const freeLimit = await getFreeQrLimit(org?.subscription_tier || 'lite')

    const currentCount = count || 0
    const totalAfterGeneration = currentCount + quantity

    if (totalAfterGeneration > freeLimit) {
      const excess = totalAfterGeneration - Math.max(currentCount, freeLimit)
      if (excess > 0) {
        const { getCreditCosts } = await import('@/lib/utils/settings')
        const creditCosts = await getCreditCosts() as Record<string, number>
        const qrCost = creditCosts.qr_code || 1
        const totalCost = excess * qrCost

        const { chargeCredits } = await import('@/lib/payments/credits')
        const charge = await chargeCredits(
          orgId,
          totalCost,
          `Generated ${excess} extra QR code(s)`,
          user.id
        )
        if (!charge.success) {
          throw new Error(`Insufficient credits. You need ${totalCost} credits for the extra ${excess} codes.`)
        }
      }
    }

    const qrCodes = Array.from({ length: quantity }).map(() => ({
      organization_id: orgId,
      location_id: locationId,
      label: `Generic QR`,
      destination_path: destinationPath || `/m/${loc.slug}`,
      table_identifier: null,
      zone_id: zone_id || null,
      is_active: true
    }))

    const { error } = await supabase.from('qr_codes').insert(qrCodes)
    if (error) throw new Error((error as Error).message)

    revalidatePath('/dashboard/resources')
    return { success: true }
  })

export const deleteQrCode = authActionClient
  .schema(z.object({
    qrId: z.string().min(1)
  }))
  .action(async ({ parsedInput: { qrId }, ctx: { supabase } }) => {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    if (cookieStore.get('demo_mode')?.value === '1' && qrId.startsWith('qr-')) return { success: true }
    
    const { error } = await supabase.from('qr_codes').delete().eq('id', qrId)
    if (error) throw new Error((error as Error).message)
    
    revalidatePath('/dashboard/resources')
    return { success: true }
  })

export const assignQrTable = authActionClient
  .schema(z.object({
    qrId: z.string().min(1),
    tableIdentifier: z.string().nullable().optional()
  }))
  .action(async ({ parsedInput: { qrId, tableIdentifier }, ctx: { supabase } }) => {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    if (cookieStore.get('demo_mode')?.value === '1' && qrId.startsWith('qr-')) return { success: true }
    
    const { error } = await supabase
      .from('qr_codes')
      .update({ table_identifier: tableIdentifier || null })
      .eq('id', qrId)
    
    if (error) throw new Error((error as Error).message)
    
    revalidatePath('/dashboard/resources')
    return { success: true }
  })

export const createQrZone = authActionClient
  .schema(zfd.formData({
    location_id: zfd.text(z.string().min(1)),
    name: zfd.text(z.string().min(1)),
    description: zfd.text(z.string().optional()),
  }))
  .action(async ({ parsedInput: { location_id, name, description }, ctx: { supabase } }) => {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    if (cookieStore.get('demo_mode')?.value === '1') return { success: true }

    const { error } = await supabase.from('qr_zones').insert({
      location_id,
      name,
      description: description || null
    })

    if (error) throw new Error((error as Error).message)
    
    revalidatePath('/dashboard/resources')
    return { success: true }
  })

export const assignQrZone = authActionClient
  .schema(z.object({
    qrId: z.string().min(1),
    zoneId: z.string().nullable().optional()
  }))
  .action(async ({ parsedInput: { qrId, zoneId }, ctx: { supabase } }) => {
    const { error } = await supabase
      .from('qr_codes')
      .update({ zone_id: zoneId || null })
      .eq('id', qrId)
    
    if (error) throw new Error((error as Error).message)
    
    revalidatePath('/dashboard/resources')
    return { success: true }
  })

export const generateResourceQr = authActionClient
  .schema(z.object({
    organizationId: z.string().min(1),
    locationId: z.string().min(1),
    resourceId: z.string().min(1),
    resourceType: z.string().min(1)
  }))
  .action(async ({ parsedInput: { organizationId, locationId, resourceId, resourceType }, ctx: { supabase, user } }) => {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const isDemo = cookieStore.get('demo_mode')?.value === '1'

    if (isDemo && organizationId === 'demo-org') {
      return { success: true }
    }

    const { data: loc, error: locError } = await supabase
      .from('locations')
      .select('slug')
      .eq('id', locationId)
      .single()

    if (locError || !loc) throw new Error('Location not found')

    const destPath = resourceType === 'register' 
      ? `/m/${loc.slug}/desk-pay?terminal=${resourceId}`
      : `/m/${loc.slug}?resource=${resourceId}`

    // 1. Check if it already exists
    const { data: existing } = await supabase
      .from('qr_codes')
      .select('id')
      .eq('destination_path', destPath)
      .single()

    if (existing) {
      // It already exists, return early
      return { success: true }
    }

    // 2. Check limits
    const { data: org } = await supabase
      .from('organizations')
      .select('subscription_tier')
      .eq('id', organizationId)
      .single()

    const { count } = await supabase
      .from('qr_codes')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)

    const { getFreeQrLimit } = await import('@/lib/utils/billing')
    const freeLimit = await getFreeQrLimit(org?.subscription_tier || 'lite')

    const currentCount = count || 0
    const totalAfterGeneration = currentCount + 1

    if (totalAfterGeneration > freeLimit) {
      const { getCreditCosts } = await import('@/lib/utils/settings')
      const creditCosts = await getCreditCosts() as Record<string, number>
      const qrCost = creditCosts.qr_code || 1

      const { chargeCredits } = await import('@/lib/payments/credits')
      const charge = await chargeCredits(
        organizationId,
        qrCost,
        `Generated Dynamic QR code for resource`,
        user.id
      )
      if (!charge.success) {
        throw new Error(`Insufficient credits. You need ${qrCost} credits to generate this dynamic QR code.`)
      }
    }

    // 3. Create the QR code
    const { error } = await supabase.from('qr_codes').insert({
      organization_id: organizationId,
      location_id: locationId,
      label: `Resource: ${resourceId}`,
      destination_path: destPath,
      table_identifier: resourceId, // we store the resource ID here for easy tracking
      zone_id: null,
      is_active: true
    })

    if (error) throw new Error((error as Error).message)

    revalidatePath('/dashboard/resources')
    return { success: true }
  })
