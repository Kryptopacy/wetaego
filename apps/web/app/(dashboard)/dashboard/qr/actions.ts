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

  // Fetch the location slug
  const { data: loc, error: locError } = await supabase
    .from('locations')
    .select('slug')
    .eq('id', locationId)
    .single()

  if (locError || !loc) {
    return { error: 'Location not found' }
  }

  // Generate generic QR codes
  const qrCodes = Array.from({ length: quantity }).map((_, i) => {
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
    return { error: error.message }
  }

  revalidatePath('/dashboard/qr')
  return { success: true }
}

export async function deleteQrCode(qrId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('qr_codes').delete().eq('id', qrId)
  
  if (error) return { error: error.message }
  
  revalidatePath('/dashboard/qr')
  return { success: true }
}
