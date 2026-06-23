/* eslint-disable @typescript-eslint/no-unused-vars */
// TODO: Developer bypassed types/rules. Requires refactoring for true perfection.
import { getUsdToNgnRate } from './exchange'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

import { createClient } from '@/lib/supabase/server'

export async function getOrCreateBillingPlan(organizationId: string, orgName: string, planType: string, amountMinor: number, currency: string = 'NGN'): Promise<string> {
  const planDisplayName = planType === 'lite' ? 'OurMenu OS Lite' : 'OurMenu OS Pro'
  const supabase = await createClient()

  // Check DB to see if this org already has a plan_code.
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('billing_plan_code')
    .eq('id', organizationId)
    .single()

  if (orgError) {
    throw new Error(`Failed to fetch organization: ${orgError.message}`)
  }

  if (org.billing_plan_code) {
    return org.billing_plan_code
  }

  // Create a dedicated plan for the organization on Paystack.
  const response = await fetch('https://api.paystack.co/plan', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `${planDisplayName} - ${orgName} (${currency})`,
      interval: 'monthly',
      amount: amountMinor,
      currency: currency
    }),
  })

  const data = await response.json()
  
  if (!data.status) {
    throw new Error(data.message || 'Failed to create Paystack Plan')
  }

  const newPlanCode = data.data.plan_code

  // Save the new plan code back to the DB
  const { error: updateError } = await supabase
    .from('organizations')
    .update({ billing_plan_code: newPlanCode })
    .eq('id', organizationId)

  if (updateError) {
    console.error('Failed to save billing_plan_code to DB:', updateError)
    // We still return the plan code so the checkout can proceed
  }

  return newPlanCode
}

export async function initializeSubscription(email: string, planCode: string, organizationId: string, planType: string, currency: string = 'NGN'): Promise<string> {
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: currency === 'USD' ? 500 : 5000, // A tiny initial charge to tokenize the card, or the full amount if required.
      plan: planCode,
      currency: currency,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing/verify`,
      metadata: {
        organization_id: organizationId,
        is_subscription: true,
        plan_type: planType
      }
    }),
  })

  const data = await response.json()
  
  if (!data.status) {
    throw new Error(data.message || 'Failed to initialize subscription')
  }

  return data.data.authorization_url
}
