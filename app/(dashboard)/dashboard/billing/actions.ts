'use server'

import { createClient } from '@/lib/supabase/server'
import { getOrCreateBillingPlan, initializeSubscription } from '@/lib/payments/billing'
import { redirect } from 'next/navigation'

import { getPricingSettings } from '@/lib/utils/settings'
import { getUsdToNgnRate } from '@/lib/payments/exchange'
import { authActionClient } from '@/lib/safe-action'
import { z } from 'zod'
import { zfd } from 'zod-form-data'

export const subscribeToLite = authActionClient
  .schema(zfd.formData(z.object({
    organization_id: z.string(),
    currency: z.string().optional().default('NGN')
  })))
  .action(async ({ parsedInput: { organization_id, currency }, ctx: { user } }) => {
    const supabase = await createClient()
    
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    if (cookieStore.get('demo_mode')?.value === '1') {
      throw new Error('Billing is disabled in Demo Mode')
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organization_id)
      .single()

    if (!org) throw new Error('Organization not found')

    const rate = await getUsdToNgnRate()
    const pricing = await getPricingSettings()
    
    const baseNgn = pricing.lite_monthly_ngn || 14999
    let amountMinor = 0
    if (currency === 'USD') {
      const amountUsd = baseNgn / rate
      amountMinor = Math.round(amountUsd * 100) // cents
    } else {
      amountMinor = baseNgn * 100 // kobo
    }

    const planCode = await getOrCreateBillingPlan(organization_id, org.name, 'lite', amountMinor, currency)
    const authUrl = await initializeSubscription(user.email!, planCode, organization_id, 'lite', currency)

    redirect(authUrl)
  })

export const subscribeToPro = authActionClient
  .schema(zfd.formData(z.object({
    organization_id: z.string(),
    currency: z.string().optional().default('NGN')
  })))
  .action(async ({ parsedInput: { organization_id, currency }, ctx: { user } }) => {
    const supabase = await createClient()

    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organization_id)
      .single()

    if (!org) throw new Error('Organization not found')

    const rate = await getUsdToNgnRate()
    const pricing = await getPricingSettings()
    
    const baseNgn = pricing.pro_monthly_ngn || 49999
    let amountMinor = 0
    if (currency === 'USD') {
      const amountUsd = baseNgn / rate
      amountMinor = Math.round(amountUsd * 100) // cents
    } else {
      amountMinor = baseNgn * 100 // kobo
    }

    const planCode = await getOrCreateBillingPlan(organization_id, org.name, 'pro', amountMinor, currency)
    const authUrl = await initializeSubscription(user.email!, planCode, organization_id, 'pro', currency)

    redirect(authUrl)
  })

export const cancelSubscription = authActionClient
  .schema(zfd.formData(z.object({
    organization_id: z.string()
  })))
  .action(async ({ parsedInput: { organization_id }, ctx: { user } }) => {
    const supabase = await createClient()

    await supabase
      .from('organizations')
      .update({ 
        subscription_status: 'inactive',
        subscription_plan: 'free'
      })
      .eq('id', organization_id)

    redirect('/dashboard/billing')
  })

export const buyCredits = authActionClient
  .schema(zfd.formData(z.object({
    organization_id: z.string(),
    credits: z.string().transform(v => parseInt(v, 10))
  })))
  .action(async ({ parsedInput: { organization_id, credits }, ctx: { user } }) => {
    const supabase = await createClient()

    if (!organization_id || credits <= 0) throw new Error('Invalid data')

    const { data: org } = await supabase
      .from('organizations')
      .select('name, purchased_credits')
      .eq('id', organization_id)
      .single()

    if (!org) throw new Error('Org not found')

    // 3. Initialize Paystack payment for credits
    const amountMinor = credits === 10 ? 600000 : credits === 25 ? 1200000 : 2000000; // NGN 6k, 12k, 20k

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email!,
        amount: amountMinor,
        currency: 'NGN',
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing/verify`,
        metadata: {
          organization_id: organization_id,
          is_credit_pack: true,
          credits: credits
        }
      }),
    })

    const data = await response.json()
    
    if (!data.status) {
      throw new Error(data.message || 'Failed to initialize payment')
    }

    redirect(data.data.authorization_url)
  })
