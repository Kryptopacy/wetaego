
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function generateQrBatch(formData: FormData) {
  const supabase = await createClient()
  
  const orgId = formData.get('organization_id') as string
  const locationId = formData.get('location_id') as string
  const quantityStr = formData.get('quantity') as string
  const quantity = parseInt(quantityStr, 10)
  
  if (!orgId || !locationId || !quantity || quantity < 1 || quantity > 100) {
    return { error: 'Invalid parameters' }
  }

  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const isDemo = cookieStore.get('demo_mode')?.value === '1'

  if (isDemo && orgId === 'demo-org') {
    // In Demo Mode, allow unlimited generation just to demonstrate the UI
    return { success: true }
  }

  // Fetch the location slug
  const { data: loc, error: locError } = await supabase
    .from('locations')
    .select('slug')
    .eq('id', locationId)
    .single()

  if (locError || !loc) {
    return { error: 'Location not found' }
  }

  // Check limits and charge credits if necessary
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: 'Not authenticated' }

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
        userData.user.id
      )
      if (!charge.success) {
        return { error: `Insufficient credits to generate extra QR codes. You need ${totalCost} credits for the extra ${excess} codes. Buy a credit pack or upgrade your plan.` }
      }
    }
  }

  // Generate generic QR codes
   
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    return { error: (error as Error).message }
  }

  revalidatePath('/dashboard/qr')
  return { success: true }
}

export async function deleteQrCode(qrId: string) {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  if (cookieStore.get('demo_mode')?.value === '1' && qrId.startsWith('qr-')) {
    return { success: true }
  }

  const supabase = await createClient()
  
  const { error } = await supabase.from('qr_codes').delete().eq('id', qrId)
  
  if (error) return { error: (error as Error).message }
  
  revalidatePath('/dashboard/qr')
  return { success: true }
}

export async function assignQrTable(qrId: string, tableIdentifier: string | null) {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  if (cookieStore.get('demo_mode')?.value === '1' && qrId.startsWith('qr-')) {
    return { success: true }
  }

  const supabase = await createClient()
  
  const { error } = await supabase
    .from('qr_codes')
    .update({ table_identifier: tableIdentifier || null })
    .eq('id', qrId)
  
  if (error) return { error: (error as Error).message }
  
  revalidatePath('/dashboard/qr')
  return { success: true }
}
