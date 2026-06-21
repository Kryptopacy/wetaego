import { getUsdToNgnRate } from './exchange'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export async function getOrCreateBillingPlan(organizationId: string, orgName: string, planType: string, amountMinor: number, currency: string = 'NGN'): Promise<string> {
  const planDisplayName = planType === 'lite' ? 'OurMenu OS Lite' : 'OurMenu OS Pro'

  // In a real production scenario, you would check your DB to see if this org already has a plan_code.
  // For this implementation, we will create a dedicated plan for the organization.
  
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

  return data.data.plan_code
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
