/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createSubaccount } from '@/lib/payments/paystack'

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
  const businessName = formData.get('businessName') as string

  let subaccountCode = ''
  try {
    subaccountCode = await createSubaccount(bankName, accountNumber, businessName)
  } catch (err: any) {
    throw new Error(err.message || 'Failed to connect bank account via Paystack')
  }

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
        provider_account_id: subaccountCode,
        is_active: true
      })
      .eq('organization_id', org.id)
  } else {
    await supabase
      .from('organization_payment_settings')
      .insert({
        organization_id: org.id,
        provider: 'paystack',
        provider_account_id: subaccountCode,
        is_active: true
      })
  }

  revalidatePath('/dashboard/settings')
}
