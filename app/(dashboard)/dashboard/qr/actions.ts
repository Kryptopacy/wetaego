'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { authActionClient } from '@/lib/safe-action'

export const generateQrBatch = authActionClient
  .schema(zfd.formData({
    organization_id: zfd.text(z.string().min(1)),
    location_id: zfd.text(z.string().uuid()),
    quantity: zfd.numeric(z.number().min(1).max(100)),
  }))
  .action(async ({ parsedInput: { organization_id: orgId, location_id: locationId, quantity }, ctx: { supabase, user } }) => {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const isDemo = cookieStore.get('demo_mode')?.value === '1'

    if (isDemo && orgId === 'demo-org') {
      if (quantity > 1) throw new Error('Demo mode is limited to generating 1 QR code at a time.')
      // In Demo Mode, allow 1 generation just to demonstrate the UI
      return { success: true }
    }

    // Fetch the location slug
    const { data: loc, error: locError } = await supabase
      .from('locations')
      .select('slug')
      .eq('id', locationId)
      .single()

    if (locError || !loc) {
      throw new Error('Location not found')
    }

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
          throw new Error(`Insufficient credits to generate extra QR codes. You need ${totalCost} credits for the extra ${excess} codes. Buy a credit pack or upgrade your plan.`)
        }
      }
    }

    // Generate generic QR codes
     
    
    const qrCodes = Array.from({ length: quantity }).map((__, _i) => {
      return {
        organization_id: orgId,
        location_id: locationId,
        label: `Generic QR`,
        destination_path: `/m/${loc.slug}`,
        table_identifier: null,
        is_active: true
      }
    })

    const { error } = await supabase.from('qr_codes').insert(qrCodes)

    if (error) {
      throw new Error((error as Error).message)
    }

    revalidatePath('/dashboard/qr')
    return { success: true }
  })

export const deleteQrCode = authActionClient
  .schema(z.object({
    qrId: z.string().min(1)
  }))
  .action(async ({ parsedInput: { qrId }, ctx: { supabase } }) => {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    if (cookieStore.get('demo_mode')?.value === '1' && qrId.startsWith('qr-')) {
      return { success: true }
    }
    
    const { error } = await supabase.from('qr_codes').delete().eq('id', qrId)
    
    if (error) throw new Error((error as Error).message)
    
    revalidatePath('/dashboard/qr')
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
    if (cookieStore.get('demo_mode')?.value === '1' && qrId.startsWith('qr-')) {
      return { success: true }
    }
    
    const { error } = await supabase
      .from('qr_codes')
      .update({ table_identifier: tableIdentifier || null })
      .eq('id', qrId)
    
    if (error) throw new Error((error as Error).message)
    
    revalidatePath('/dashboard/qr')
    return { success: true }
  })
