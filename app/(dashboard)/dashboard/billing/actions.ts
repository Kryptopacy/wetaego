'use server'

import { createClient } from '@/lib/supabase/server'
import { getOrCreateBillingPlan, initializeSubscription } from '@/lib/payments/billing'
import { redirect } from 'next/navigation'

import { getPricingSettings } from '@/lib/utils/settings'
import { getUsdToNgnRate } from '@/lib/payments/exchange'
import { authActionClient } from '@/lib/safe-action'
import { requireOrgRole } from '@/lib/auth/org-guard'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { zfd } from 'zod-form-data'

export const subscribeToLite = authActionClient
  .schema(zfd.formData(z.object({
    organization_id: z.string(),
    currency: z.string().optional().default('NGN'),
    billing_cycle: z.enum(['monthly', 'annually']).optional().default('monthly')
  })))
  .action(async ({ parsedInput: { organization_id, currency, billing_cycle }, ctx: { user, supabase } }) => {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    if (cookieStore.get('demo_mode')?.value === '1') {
      throw new Error('Billing is disabled in Demo Mode')
    }

    await requireOrgRole(supabase, user.id, organization_id, 'owner')

    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organization_id)
      .single()

    if (!org) throw new Error('Organization not found')

    const rate = await getUsdToNgnRate()
    const pricing = await getPricingSettings()
    
    const isAnnual = billing_cycle === 'annually'
    const baseNgn = isAnnual 
      ? ((pricing as Record<string, number>).lite_annual_ngn || 191990)
      : (pricing.lite_monthly_ngn || 19999)
    let amountMinor = 0
    if (currency === 'USD') {
      const amountUsd = baseNgn / rate
      amountMinor = Math.round(amountUsd * 100) // cents
    } else {
      amountMinor = baseNgn * 100 // kobo
    }

    const planCode = await getOrCreateBillingPlan(organization_id, org.name, 'lite', amountMinor, currency, billing_cycle)
    const authUrl = await initializeSubscription(user.email!, planCode, organization_id, 'lite', currency, amountMinor)

    redirect(authUrl)
  })

export const subscribeToPro = authActionClient
  .schema(zfd.formData(z.object({
    organization_id: z.string(),
    currency: z.string().optional().default('NGN'),
    billing_cycle: z.enum(['monthly', 'annually']).optional().default('monthly')
  })))
  .action(async ({ parsedInput: { organization_id, currency, billing_cycle }, ctx: { user, supabase } }) => {
    await requireOrgRole(supabase, user.id, organization_id, 'owner')

    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organization_id)
      .single()

    if (!org) throw new Error('Organization not found')

    const rate = await getUsdToNgnRate()
    const pricing = await getPricingSettings()
    
    const baseNgn = billing_cycle === 'annually' 
      ? ((pricing as Record<string, number>).pro_annual_ngn || 662400)
      : (pricing.pro_monthly_ngn || 69000)
    let amountMinor = 0
    if (currency === 'USD') {
      const amountUsd = baseNgn / rate
      amountMinor = Math.round(amountUsd * 100) // cents
    } else {
      amountMinor = baseNgn * 100 // kobo
    }

    const planCode = await getOrCreateBillingPlan(organization_id, org.name, 'pro', amountMinor, currency, billing_cycle)
    const authUrl = await initializeSubscription(user.email!, planCode, organization_id, 'pro', currency, amountMinor)

    redirect(authUrl)
  })

export const cancelSubscription = authActionClient
  .schema(zfd.formData(z.object({
    organization_id: z.string()
  })))
  .action(async ({ parsedInput: { organization_id }, ctx: { user, supabase } }) => {
    await requireOrgRole(supabase, user.id, organization_id, 'owner')

    const { data: org } = await (supabase
      .from('organizations') as any)
      .select('subscription_plan, paystack_subscription_code, subscription_email_token')
      .eq('id', organization_id)
      .single()

    if (!org) throw new Error('Organization not found')

    // Disable the recurring charge at the gateway when we have a subscription
    // reference, so the merchant actually stops being billed.
    const subscriptionCode = (org as any)?.paystack_subscription_code as string | null
    const emailToken = (org as any)?.subscription_email_token as string | null
    if (process.env.PAYSTACK_SECRET_KEY && subscriptionCode && emailToken) {
      try {
        await fetch('https://api.paystack.co/subscription/disable', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: subscriptionCode, email_token: emailToken }),
        })
      } catch (err) {
        console.error('Failed to disable Paystack subscription:', err)
      }
    }

    await supabase
      .from('organizations')
      .update({
        subscription_status: 'canceled',
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
  .action(async ({ parsedInput: { organization_id, credits }, ctx: { user, supabase } }) => {
    if (!organization_id || credits <= 0) throw new Error('Invalid data')

    await requireOrgRole(supabase, user.id, organization_id, 'owner')

    // SECURITY PATCH: Strict validation of credit packages to prevent arbitrary injection
    if (![10, 25, 50].includes(credits)) {
      throw new Error('Invalid credit package selected')
    }

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

export const redeemCoupon = authActionClient
  .schema(zfd.formData(z.object({
    organization_id: z.string(),
    code: z.string().transform(v => v.toUpperCase().trim())
  })))
  .action(async ({ parsedInput: { organization_id, code }, ctx: { user, supabase } }) => {
    await requireOrgRole(supabase, user.id, organization_id, 'owner')

    // Call the atomic RPC to redeem the coupon
    const { data: success, error: rpcError } = await supabase.rpc('redeem_coupon_rpc', {
      p_organization_id: organization_id,
      p_code: code
    })

    if (rpcError) {
      throw new Error(rpcError.message || 'Failed to redeem promo code')
    }

    if (!success) {
      throw new Error('Failed to apply promo code benefits')
    }

    revalidatePath('/dashboard/billing')
    return { success: true, message: 'Promo code redeemed successfully!' }
  })
