'use server'

import { createClient } from '@/lib/supabase/server'
import { getOrCreateBillingPlan, initializeSubscription } from '@/lib/payments/billing'
import { redirect } from 'next/navigation'

import { getPricingSettings } from '@/lib/utils/settings'
import { getUsdToNgnRate } from '@/lib/payments/exchange'

export async function subscribeToLite(formData: FormData) {
  const supabase = await createClient()
  
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  if (cookieStore.get('demo_mode')?.value === '1') {
    throw new Error('Billing is disabled in Demo Mode')
  }

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Not authenticated')

  const orgId = formData.get('organization_id') as string
  const currency = (formData.get('currency') as string) || 'NGN'
  
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
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

  const planCode = await getOrCreateBillingPlan(orgId, org.name, 'lite', amountMinor, currency)
  const authUrl = await initializeSubscription(userData.user.email!, planCode, orgId, 'lite', currency)

  redirect(authUrl)
}

export async function subscribeToPro(formData: FormData) {
  const supabase = await createClient()
  
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Not authenticated')

  const orgId = formData.get('organization_id') as string
  const currency = (formData.get('currency') as string) || 'NGN'
  
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
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

  const planCode = await getOrCreateBillingPlan(orgId, org.name, 'pro', amountMinor, currency)
  const authUrl = await initializeSubscription(userData.user.email!, planCode, orgId, 'pro', currency)

  redirect(authUrl)
}

import { Resend } from 'resend'
import InvoiceEmail from '../../../../emails/invoice-email'
import { waitUntil } from '@vercel/functions'

export async function cancelSubscription(formData: FormData) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Not authenticated')

  const orgId = formData.get('organization_id') as string

  await supabase
    .from('organizations')
    .update({ 
      subscription_status: 'inactive',
      subscription_plan: 'free'
    })
    .eq('id', orgId)

  redirect('/dashboard/billing')
}

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy')

export async function buyCredits(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Not authenticated')

  const orgId = formData.get('organization_id') as string
  const credits = parseInt(formData.get('credits') as string || '0', 10)

  if (!orgId || credits <= 0) throw new Error('Invalid data')

  const { data: org } = await supabase
    .from('organizations')
    .select('name, purchased_credits')
    .eq('id', orgId)
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
      email: userData.user.email!,
      amount: amountMinor,
      currency: 'NGN',
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing/verify`,
      metadata: {
        organization_id: orgId,
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
}
