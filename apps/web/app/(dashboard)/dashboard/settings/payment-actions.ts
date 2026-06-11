'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function savePaymentSettings(formData: FormData) {
  const supabase = await createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) throw new Error('Not authenticated')

  // Find existing org for this user
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('created_by', userData.user.id)
    .single()

  if (!org) throw new Error('Organization not found')

  const bankName = formData.get('bankName') as string
  const accountNumber = formData.get('accountNumber') as string

  // In a real implementation, we would call Paystack API here:
  // 1. Resolve Account Number to verify name
  // 2. Create Subaccount with Paystack
  // 3. Receive `subaccount_code` (e.g., 'ACCT_123456789')
  
  // For MVP Scaffolding, we will mock the subaccount code:
  const mockSubaccountCode = `ACCT_MOCK_${accountNumber}`

  // Check if settings exist
  const { data: existingSettings } = await supabase
    .from('organization_payment_settings')
    .select('organization_id')
    .eq('organization_id', org.id)
    .single()

  if (existingSettings) {
    await supabase
      .from('organization_payment_settings')
      .update({
        provider: 'paystack',
        provider_account_id: mockSubaccountCode,
        is_active: true
      })
      .eq('organization_id', org.id)
  } else {
    await supabase
      .from('organization_payment_settings')
      .insert({
        organization_id: org.id,
        provider: 'paystack',
        provider_account_id: mockSubaccountCode,
        is_active: true
      })
  }

  revalidatePath('/dashboard/settings')
}
