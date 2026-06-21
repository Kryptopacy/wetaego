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
  } catch (err) {
    throw new Error((err as Error).message || 'Failed to connect bank account via Paystack')
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

export async function saveManualPaymentSettings(formData: FormData) {
  const supabase = await createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) throw new Error('Not authenticated')

  const locationId = formData.get('locationId') as string
  if (!locationId) throw new Error('Location ID required')

  const { data: loc } = await supabase
    .from('locations')
    .select('organization_id')
    .eq('id', locationId)
    .single()

  if (!loc) throw new Error('Location not found')

  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', loc.organization_id)
    .eq('user_id', userData.user.id)
    .single()

  let isAuthorized = member?.role === 'owner' || member?.role === 'manager'
  if (!member) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', loc.organization_id)
      .eq('created_by', userData.user.id)
      .single()
    isAuthorized = !!org
  }

  if (!isAuthorized) throw new Error('Unauthorized')

  const manualPaymentEnabled = formData.get('manualPaymentEnabled') === 'true'
  const manualBankName = formData.get('manualBankName') as string || null
  const manualAccountNumber = formData.get('manualAccountNumber') as string || null
  const manualAccountName = formData.get('manualAccountName') as string || null
  const manualInstructions = formData.get('manualInstructions') as string || null

  const { error } = await supabase
    .from('locations')
    .update({
      manual_payment_enabled: manualPaymentEnabled,
      manual_payment_bank_name: manualBankName,
      manual_payment_account_number: manualAccountNumber,
      manual_payment_account_name: manualAccountName,
      manual_payment_instructions: manualInstructions
    })
    .eq('id', locationId)

  if (error) throw new Error((error as Error).message)

  revalidatePath('/dashboard/settings')
}


