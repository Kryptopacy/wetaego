/**
 * Bachs Payment Provider (bachs.io)
 * Implements the PaymentProvider interface for Bachs.
 * Supports Local Cards, Bank Transfers, International Cards, and Crypto/Stablecoins (USDC, USDT, SOL).
 */

import crypto from 'crypto'
import type { PaymentProvider, PaymentParams, PaymentVerification } from './provider'

const BACHS_BASE_URL = process.env.BACHS_BASE_URL || 'https://api.bachs.io/v1'

export const bachsProvider: PaymentProvider = {
  name: 'bachs',

  async initiatePayment(params: PaymentParams) {
    const apiKey = params.useTestKeys ? process.env.BACHS_TEST_API_KEY : (process.env.BACHS_API_KEY || process.env.BACHS_SECRET_KEY)
    if (!apiKey) throw new Error('BACHS_API_KEY is not configured')

    const amountInUnits = (params.amountMinor / 100).toFixed(2)

    const payload = {
      pricing: {
        amount: amountInUnits,
        currency: params.currency.toUpperCase(),
        ...(params.chargeType === 'auth' ? { charge_type: 'pre_auth' } : {}),
      },
      customer: {
        email: params.customerEmail,
        name: params.customerName || undefined,
        phone: params.customerPhone || undefined,
      },
      reference: params.reference,
      success_url: params.callbackUrl,
      cancel_url: params.callbackUrl,
      metadata: {
        ...params.metadata,
        provider: 'bachs',
        customer_name: params.customerName,
        customer_phone: params.customerPhone,
        ...(params.subaccountCode ? { subaccount: params.subaccountCode } : {}),
        ...(params.splitCode ? { split_code: params.splitCode } : {}),
      },
    }

    const res = await fetch(`${BACHS_BASE_URL}/checkout-sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-Bachs-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[bachsProvider] initiatePayment failed:', err)
      throw new Error(`Bachs initiate failed: ${err?.detail || err?.message || JSON.stringify(err)}`)
    }

    const data = await res.json()
    const checkoutUrl = data?.checkout_url || data?.data?.checkout_url || data?.url
    const ref = data?.reference || data?.data?.reference || params.reference

    if (!checkoutUrl) {
      throw new Error('Bachs API did not return a valid checkout_url')
    }

    return {
      authorizationUrl: checkoutUrl as string,
      reference: ref as string,
    }
  },

  async verifyPayment(reference: string, useTestKeys?: boolean): Promise<PaymentVerification> {
    const apiKey = useTestKeys ? process.env.BACHS_TEST_API_KEY : (process.env.BACHS_API_KEY || process.env.BACHS_SECRET_KEY)
    if (!apiKey) throw new Error('BACHS_API_KEY is not configured')

    const res = await fetch(`${BACHS_BASE_URL}/checkout-sessions/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-Bachs-Key': apiKey,
      },
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      if (res.status === 404) {
        return { status: 'pending', amountPaid: 0, currency: 'NGN', reference }
      }
      throw new Error(`Bachs verify failed: ${res.status}`)
    }

    const data = await res.json()
    const tx = data?.data || data

    const statusMap: Record<string, PaymentVerification['status']> = {
      completed: 'success',
      successful: 'success',
      success: 'success',
      paid: 'success',
      failed: 'failed',
      cancelled: 'abandoned',
      abandoned: 'abandoned',
      expired: 'abandoned',
      pending: 'pending',
      open: 'pending',
      requires_payment_method: 'pending'
    }

    const rawStatus = (tx.payment_status || tx.status || 'pending').toLowerCase()
    const status = statusMap[rawStatus] ?? 'pending'

    const rawAmount = tx.charge?.amount_paid || tx.charge?.amount || tx.amount || 0
    const amountPaid = typeof rawAmount === 'string' ? Math.round(parseFloat(rawAmount) * 100) : rawAmount

    return {
      status,
      amountPaid,
      currency: (tx.currency || tx.billing_currency || 'NGN').toUpperCase(),
      reference: tx.reference || reference,
      paidAt: tx.charge?.completed_at || tx.completed_at || undefined,
      providerData: tx,
    }
  },

  async refundPayment(reference: string, amountMinor?: number, useTestKeys?: boolean) {
    const apiKey = useTestKeys ? process.env.BACHS_TEST_API_KEY : (process.env.BACHS_API_KEY || process.env.BACHS_SECRET_KEY)
    if (!apiKey) throw new Error('BACHS_API_KEY is not configured')

    const payload: { reference: string; amount?: number } = { reference }
    if (amountMinor) payload.amount = amountMinor

    const res = await fetch(`${BACHS_BASE_URL}/refunds`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-Bachs-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('Bachs refund failed:', err)
      return { success: false, message: err?.message || 'Refund failed at gateway' }
    }

    return { success: true }
  },

  async chargeCardOnFile(token: string, amountMinor: number, email: string, reference: string, useTestKeys?: boolean): Promise<PaymentVerification> {
    const apiKey = useTestKeys ? process.env.BACHS_TEST_API_KEY : (process.env.BACHS_API_KEY || process.env.BACHS_SECRET_KEY)
    if (!apiKey) throw new Error('BACHS_API_KEY is not configured')

    const amountInUnits = (amountMinor / 100).toFixed(2)

    const res = await fetch(`${BACHS_BASE_URL}/charge_authorization`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-Bachs-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authorization_code: token,
        email,
        amount: amountInUnits,
        reference,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[bachsProvider] chargeCardOnFile failed:', err)
      throw new Error(`Bachs charge card on file failed: ${err?.detail || err?.message || JSON.stringify(err)}`)
    }

    const data = await res.json()
    
    return {
      status: data.status === 'succeeded' ? 'success' : (data.status === 'failed' ? 'failed' : 'pending'),
      amountPaid: Math.round(parseFloat(data.amount) * 100),
      currency: data.currency,
      reference: data.reference,
      paidAt: data.created_at,
      providerData: data,
    }
  },

  validateWebhookSignature(payload: string, signature: string): boolean {
    const secret = process.env.BACHS_WEBHOOK_SECRET || process.env.BACHS_API_KEY || process.env.PAYSTACK_SECRET_KEY
    if (!secret || !signature) return false

    const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    if (hash.length === signature.length) {
      return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))
    }
    return false
  },
}

export async function createBachsSubaccount(accountNumber: string, bankCode: string, businessName: string): Promise<string> {
  const apiKey = process.env.BACHS_API_KEY || process.env.BACHS_SECRET_KEY
  if (!apiKey) throw new Error('BACHS_API_KEY is not configured')

  const res = await fetch(`${BACHS_BASE_URL}/subaccounts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      business_name: businessName,
      account_number: accountNumber,
      bank_code: bankCode,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Bachs subaccount creation failed: ${JSON.stringify(err)}`)
  }

  const data = await res.json()
  return data?.data?.subaccount_code || data?.id || `bachs_sub_${Date.now()}`
}
