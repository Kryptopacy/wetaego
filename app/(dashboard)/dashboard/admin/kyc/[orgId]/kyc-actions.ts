'use server'

import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/utils/admin'
import { authActionClient } from '@/lib/safe-action'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

import { zfd } from 'zod-form-data'

export const updateKycStatus = authActionClient
  .schema(zfd.formData({
    org_id: zfd.text(z.string().min(1)),
    status: zfd.text(z.string().min(1)),
    notes: zfd.text(z.string().optional())
  }))
  .action(async ({ parsedInput: { org_id: orgId, status, notes }, ctx: { user } }) => {
    const supabase = await createClient()

    if (!isAdminEmail(user.email)) {
      throw new Error('Unauthorized')
    }

    if (!orgId || !status) throw new Error('Missing fields')

    // If 'waived', we just approve the org but don't strictly approve the KYC record 
    if (status !== 'waived') {
      const updateData = {
        status: status as 'approved' | 'in_review' | 'pending_kyc' | 'suspended',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: notes || null
      }
      // @ts-expect-error organization_kyc schema extension
      await supabase.from('organization_kyc').update(updateData).eq('organization_id', orgId)
    }

    // Update org table
    await supabase
      .from('organizations')
      .update({ status: (status === 'approved' || status === 'waived') ? 'approved' : 'pending_kyc' })
      .eq('id', orgId)

    revalidatePath('/dashboard/admin')
    revalidatePath(`/dashboard/admin/kyc/${orgId}`)
    
    return { success: true }
  })

