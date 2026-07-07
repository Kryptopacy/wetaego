'use server'

import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/utils/admin'
import { authActionClient } from '@/lib/safe-action'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { revalidatePath } from 'next/cache'

export const updateKycStatus = authActionClient
  .schema(zfd.formData(z.any()))
  .action(async ({ parsedInput: formData, ctx: { user } }) => {
    const supabase = await createClient()

    if (!isAdminEmail(user.email)) {
      throw new Error('Unauthorized')
    }

    const orgId = formData.get('org_id') as string
    const status = formData.get('status') as string // 'approved', 'rejected', 'waived'
    const notes = formData.get('notes') as string

    if (!orgId || !status) throw new Error('Missing fields')

    // If 'waived', we just approve the org but don't strictly approve the KYC record 
    // (or we can mark the KYC record as 'waived' if it exists)
    if (status !== 'waived') {
      await (supabase as any)
        .from('organization_kyc')
        .update({
          status: status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: notes || null
        })
        .eq('organization_id', orgId)
    }

    // Update org table
    await (supabase as any)
      .from('organizations')
      .update({ status: (status === 'approved' || status === 'waived') ? 'approved' : 'pending_kyc' })
      .eq('id', orgId)

    revalidatePath('/dashboard/admin')
    revalidatePath(`/dashboard/admin/kyc/${orgId}`)
    
    return { success: true }
  })
