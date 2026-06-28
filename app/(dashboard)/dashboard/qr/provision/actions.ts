'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { authActionClient } from '@/lib/safe-action'

export const assignQrCode = authActionClient
  .schema(zfd.formData({
    qr_id: zfd.text(z.string().uuid()),
    table_identifier: zfd.text(z.string().min(1)),
    destination_path: zfd.text(z.string().min(1))
  }))
  .action(async ({ parsedInput: { qr_id: qrId, table_identifier: tableIdentifier, destination_path: destinationPath }, ctx: { supabase, user } }) => {
    const { data: qrData } = await supabase.from('qr_codes').select('location_id').eq('id', qrId).single()
    if (!qrData) throw new Error('QR Code not found')

    const { data: loc } = await supabase.from('locations').select('organization_id').eq('id', qrData.location_id).single()
    if (!loc) throw new Error('Location not found')

    const { data: member } = await supabase.from('organization_members').select('role').eq('organization_id', loc.organization_id).eq('user_id', user.id).single()
    let isAuthorized = !!member
    if (!member) {
      const { data: org } = await supabase.from('organizations').select('id').eq('id', loc.organization_id).eq('created_by', user.id).single()
      isAuthorized = !!org
    }
    if (!isAuthorized) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('qr_codes')
      .update({ 
        table_identifier: tableIdentifier,
        destination_path: destinationPath
      })
      .eq('id', qrId)

    if (error) {
      throw new Error((error as Error).message)
    }

    revalidatePath('/dashboard/qr')
    redirect('/dashboard/qr') // Success, go back to batch generator
  })
