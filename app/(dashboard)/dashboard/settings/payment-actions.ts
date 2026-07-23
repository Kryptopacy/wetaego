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
      .select('id, is_demo')
      .eq('created_by', user.id)
      .single()

    if (!org) throw new Error('Organization not found')
    if (org.is_demo) {
      throw new Error('Bank details cannot be modified in demo workspaces to protect end customers.')
    }

    const activeGateway = process.env.NEXT_PUBLIC_DEFAULT_PAYMENT_GATEWAY || 'paystack'

    let subaccountCode = ''
    try {
      const { getPlatformFees } = await import('@/lib/utils/settings')
      const platformFees = await getPlatformFees() as { business_subaccount: number }
      
      if (activeGateway === 'bachs') {
        const { createBachsSubaccount } = await import('@/lib/payments/bachs')
        subaccountCode = await createBachsSubaccount(accountNumber, bankName, businessName)
      } else {
        const { createSubaccount } = await import('@/lib/payments/paystack')
        subaccountCode = await createSubaccount(bankName, accountNumber, businessName, platformFees.business_subaccount ?? 5)
      }
    } catch (err) {
      console.error('Failed to create subaccount:', err)
      throw new Error('Failed to create payment subaccount. Please verify bank details.')
    }

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('organization_payment_settings')
      .select('organization_id')
      .limit(1)
      .maybeSingle()

    if (existingSettings) {
      await supabase
        .from('organization_payment_settings')
        .update({
          provider: activeGateway,
          provider_account_id: subaccountCode,
          is_active: true
        })
        .eq('organization_id', org.id)
    } else {
      await supabase
        .from('organization_payment_settings')
        .insert({
          organization_id: org.id,
          provider: activeGateway,
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
    pageId: zfd.text(z.string().uuid().optional()),
    manualPaymentEnabled: zfd.checkbox(),
    manualBankName: zfd.text(z.string().optional()),
    manualAccountNumber: zfd.text(z.string().optional()),
    manualAccountName: zfd.text(z.string().optional()),
    manualInstructions: zfd.text(z.string().optional()),
  }))
  .action(async ({ parsedInput: { locationId, pageId, manualPaymentEnabled, manualBankName, manualAccountNumber, manualAccountName, manualInstructions }, ctx: { supabase, user } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      return { success: true }
    }

    let activeLocationId = locationId
    
    if (pageId) {
      const { data: page } = await supabase
        .from('location_pages')
        .select('location_id')
        .eq('id', pageId)
        .single()
      if (!page) throw new Error('Page not found')
      activeLocationId = page.location_id
    }

    const { data: loc } = await supabase
      .from('locations')
      .select('organization_id')
      .eq('id', activeLocationId)
      .single()

    if (!loc) throw new Error('Location not found')

    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', loc.organization_id)
      .eq('user_id', user.id)
      .single()

    let isAuthorized = member?.role === 'owner' || member?.role === 'manager'
    let isDemo = false

    const { data: org } = await supabase
      .from('organizations')
      .select('id, is_demo, created_by')
      .eq('id', loc.organization_id)
      .single()

    if (org) {
      isDemo = !!org.is_demo
      if (!member && org.created_by === user.id) {
        isAuthorized = true
      }
    }

    if (!isAuthorized) throw new Error('Unauthorized')
    if (isDemo) {
      throw new Error('Manual payment details cannot be modified in demo workspaces to protect end customers.')
    }

    if (pageId) {
      const { error } = await supabase
        .from('location_pages')
        .update({
          manual_payment_enabled: manualPaymentEnabled,
          manual_payment_bank_name: manualBankName || null,
          manual_payment_account_number: manualAccountNumber || null,
          manual_payment_account_name: manualAccountName || null,
          manual_payment_instructions: manualInstructions || null
        })
        .eq('id', pageId)
      if (error) throw new Error('Failed to update page manual payment settings')
    } else {
      const { error } = await supabase
        .from('locations')
        .update({
          manual_payment_enabled: manualPaymentEnabled,
          manual_payment_bank_name: manualBankName || null,
          manual_payment_account_number: manualAccountNumber || null,
          manual_payment_account_name: manualAccountName || null,
          manual_payment_instructions: manualInstructions || null
        })
        .eq('id', activeLocationId)
      if (error) throw new Error('Failed to update manual payment settings')
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
  })
