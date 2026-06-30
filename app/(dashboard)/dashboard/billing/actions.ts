'use server'

import { createClient } from '@/lib/supabase/server'
import { getOrCreateBillingPlan, initializeSubscription } from '@/lib/payments/billing'
import { redirect } from 'next/navigation'

import { getPricingSettings } from '@/lib/utils/settings'
import { getUsdToNgnRate } from '@/lib/payments/exchange'
import { authActionClient } from '@/lib/safe-action'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
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

export const redeemCoupon = authActionClient
  .schema(zfd.formData(z.object({
    organization_id: z.string(),
    code: z.string().transform(v => v.toUpperCase().trim())
  })))
  .action(async ({ parsedInput: { organization_id, code }, ctx: { user } }) => {
    const supabase = await createClient()

    // 1. Get coupon
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (couponError || !coupon) {
      throw new Error('Invalid or inactive promo code')
    }

    // 2. Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      throw new Error('Promo code has expired')
    }

    // 3. Check max redemptions
    if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions) {
      throw new Error('Promo code redemption limit reached')
    }

    // 4. Check if already redeemed
    const { data: existingRedemption } = await supabase
      .from('coupon_redemptions')
      .select('id')
      .eq('coupon_id', coupon.id)
      .eq('organization_id', organization_id)
      .single()

    if (existingRedemption) {
      throw new Error('You have already redeemed this promo code')
    }

    // 5. Get current org state
    const { data: org } = await supabase
      .from('organizations')
      .select('trial_ends_at, purchased_credits, subscription_plan, subscription_status')
      .eq('id', organization_id)
      .single()

    if (!org) throw new Error('Organization not found')

    // 6. Apply discount
    let updates: any = {}
    
    if (coupon.discount_type === 'free_credits') {
      updates.purchased_credits = (org.purchased_credits || 0) + coupon.discount_value
    } else if (coupon.discount_type === 'free_plan' || coupon.discount_type === 'plan_extension' || coupon.discount_type === 'trial_extension') {
      const currentTrialEnd = org.trial_ends_at ? new Date(org.trial_ends_at) : new Date()
      const baseDate = currentTrialEnd > new Date() ? currentTrialEnd : new Date()
      
      const newTrialEnd = new Date(baseDate.getTime() + (coupon.discount_value * 24 * 60 * 60 * 1000))
      updates.trial_ends_at = newTrialEnd.toISOString()

      if (coupon.discount_type === 'free_plan' && coupon.plan_tier) {
        updates.subscription_plan = coupon.plan_tier
        updates.subscription_status = 'active'
      }
    }

    const { error: updateError } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', organization_id)

    if (updateError) throw new Error('Failed to apply promo code benefits')

    const { createClient: createSupabaseAdmin } = await import('@supabase/supabase-js')
    const adminClient = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await adminClient.from('coupon_redemptions').insert({
      coupon_id: coupon.id,
      organization_id: organization_id,
      redeemed_by: user.id
    })

    await adminClient.from('coupons').update({
      times_redeemed: coupon.times_redeemed + 1
    }).eq('id', coupon.id)

    revalidatePath('/dashboard/billing')
    return { success: true, message: 'Promo code redeemed successfully!' }
  })
