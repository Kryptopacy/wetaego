'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { authActionClient } from '@/lib/safe-action'
import { createSubaccount } from '@/lib/payments/paystack'

export const savePaymentSettings = authActionClient
  .schema(zfd.formData({
    bankName: zfd.text(),
    accountNumber: zfd.text(),
    businessName: zfd.text(),
  }))
  .action(async ({ parsedInput: { bankName, accountNumber, businessName }, ctx: { supabase, user } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      return { success: true }
    }

    // Find existing org for this user
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .single()

    if (!org) throw new Error('Organization not found')

    let subaccountCode = ''
    try {
      const { getPlatformFees } = await import('@/lib/utils/settings')
      const platformFees = await getPlatformFees() as { business_subaccount: number }
      subaccountCode = await createSubaccount(bankName, accountNumber, businessName, platformFees.business_subaccount ?? 5)
    } catch {
      throw new Error('Failed to create subaccount')
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
    return { success: true }
  })

export const saveManualPaymentSettings = authActionClient
  .schema(zfd.formData({
    locationId: zfd.text(z.string().uuid()),
    manualPaymentEnabled: zfd.checkbox(),
    manualBankName: zfd.text(z.string().optional()),
    manualAccountNumber: zfd.text(z.string().optional()),
    manualAccountName: zfd.text(z.string().optional()),
    manualInstructions: zfd.text(z.string().optional()),
  }))
  .action(async ({ parsedInput: { locationId, manualPaymentEnabled, manualBankName, manualAccountNumber, manualAccountName, manualInstructions }, ctx: { supabase, user } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      return { success: true }
    }

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
      .eq('user_id', user.id)
      .single()

    let isAuthorized = member?.role === 'owner' || member?.role === 'manager'
    if (!member) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', loc.organization_id)
        .eq('created_by', user.id)
        .single()
      isAuthorized = !!org
    }

    if (!isAuthorized) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('locations')
      .update({
        manual_payment_enabled: manualPaymentEnabled,
        manual_payment_bank_name: manualBankName || null,
        manual_payment_account_number: manualAccountNumber || null,
        manual_payment_account_name: manualAccountName || null,
        manual_payment_instructions: manualInstructions || null
      })
      .eq('id', locationId)

    if (error) throw new Error('Failed to update manual payment settings')

    revalidatePath('/dashboard/settings')
    return { success: true }
  })
