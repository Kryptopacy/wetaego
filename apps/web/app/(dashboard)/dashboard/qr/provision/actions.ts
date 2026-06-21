'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function assignQrCode(formData: FormData) {
  const supabase = await createClient()
  
  const qrId = formData.get('qr_id') as string
  const tableIdentifier = formData.get('table_identifier') as string
  
  if (!qrId || !tableIdentifier) {
    return { error: 'Missing parameters' }
  }

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
