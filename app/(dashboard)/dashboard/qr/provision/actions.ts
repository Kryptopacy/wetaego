'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const assignQrSchema = z.object({
  qrId: z.string().uuid(),
  tableIdentifier: z.string().min(1)
})

export async function assignQrCode(formData: FormData) {
  const supabase = await createClient()
  
  const qrId = formData.get('qr_id') as string
  const tableIdentifier = formData.get('table_identifier') as string
  
  const parsed = assignQrSchema.safeParse({ qrId, tableIdentifier })
  if (!parsed.success) return { error: 'Invalid parameters' }

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) return { error: 'Not authenticated' }

  const { data: qrData } = await supabase.from('qr_codes').select('location_id').eq('id', qrId).single()
  if (!qrData) return { error: 'QR Code not found' }

  const { data: loc } = await supabase.from('locations').select('organization_id').eq('id', qrData.location_id).single()
  if (!loc) return { error: 'Location not found' }

  const { data: member } = await supabase.from('organization_members').select('role').eq('organization_id', loc.organization_id).eq('user_id', userData.user.id).single()
  let isAuthorized = !!member
  if (!member) {
    const { data: org } = await supabase.from('organizations').select('id').eq('id', loc.organization_id).eq('created_by', userData.user.id).single()
    isAuthorized = !!org
  }
  if (!isAuthorized) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('qr_codes')
    .update({ table_identifier: tableIdentifier })
    .eq('id', qrId)

  if (error) {
    return { error: (error as Error).message }
  }

  revalidatePath('/dashboard/qr')
  redirect('/dashboard/qr') // Success, go back to batch generator
}
