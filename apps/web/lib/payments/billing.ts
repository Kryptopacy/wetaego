import { getUsdToNgnRate } from './exchange'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export async function getOrCreateBillingPlan(organizationId: string, orgName: string): Promise<string> {
  // Calculate current NGN equivalent of $39
  const rate = await getUsdToNgnRate()
  const amountMinor = Math.round(39 * rate * 100) // in kobo

  // In a real production scenario, you would check your DB to see if this org already has a plan_code.
  // For this implementation, we will create a dedicated plan for the organization.
  
  const response = await fetch('https://api.paystack.co/plan', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `OurMenu OS Pro - ${orgName}`,
      interval: 'monthly',
      amount: amountMinor,
      currency: 'NGN'
    }),
  })

  const data = await response.json()
  
  if (!data.status) {
    throw new Error(data.message || 'Failed to create Paystack Plan')
  }

  return data.data.plan_code
}

export async function initializeSubscription(email: string, planCode: string, organizationId: string): Promise<string> {
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: 5000, // A tiny initial charge to tokenize the card, or the full amount if required. Paystack requires passing an amount, but if a plan is passed, it overrides it. We pass the plan's amount safely by just passing the plan code.
      plan: planCode,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing/verify`,
      metadata: {
        organization_id: organizationId,
        is_subscription: true
      }
    }),
  })

  const data = await response.json()
  
  if (!data.status) {
    throw new Error(data.message || 'Failed to initialize subscription')
  }

  return data.data.authorization_url
}
