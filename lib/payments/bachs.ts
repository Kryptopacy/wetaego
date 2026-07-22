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

    const channels = params.channels || ['card', 'bank_transfer', 'crypto', 'usdc', 'usdt', 'solana']

    const payload = {
      amount: params.amountMinor,
      currency: params.currency.toUpperCase(),
      email: params.customerEmail,
      reference: params.reference,
      redirect_url: params.callbackUrl,
      customer: {
        email: params.customerEmail,
        name: params.customerName || undefined,
        phone: params.customerPhone || undefined,
      },
      payment_options: channels,
      metadata: {
        ...params.metadata,
        provider: 'bachs',
        customer_name: params.customerName,
        customer_phone: params.customerPhone,
        ...(params.subaccountCode ? { subaccount: params.subaccountCode } : {}),
        ...(params.splitCode ? { split_code: params.splitCode } : {}),
      },
    }

    const res = await fetch(`${BACHS_BASE_URL}/checkout/sessions`, {
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
      if (res.status === 404 || res.status === 401) {
        return {
          authorizationUrl: `https://pay.bachs.io/checkout/${encodeURIComponent(params.reference)}?amount=${params.amountMinor}&currency=${params.currency}&email=${encodeURIComponent(params.customerEmail)}`,
          reference: params.reference,
        }
      }
      throw new Error(`Bachs initiate failed: ${JSON.stringify(err)}`)
    }

    const data = await res.json()
    const checkoutUrl = data?.data?.checkout_url || data?.checkout_url || data?.url || `https://pay.bachs.io/checkout/${params.reference}`
    const ref = data?.data?.reference || data?.reference || params.reference

    return {
      authorizationUrl: checkoutUrl as string,
      reference: ref as string,
    }
  },

  async verifyPayment(reference: string, useTestKeys?: boolean): Promise<PaymentVerification> {
    const apiKey = useTestKeys ? process.env.BACHS_TEST_API_KEY : (process.env.BACHS_API_KEY || process.env.BACHS_SECRET_KEY)
    if (!apiKey) throw new Error('BACHS_API_KEY is not configured')

    const res = await fetch(`${BACHS_BASE_URL}/payments/verify/${encodeURIComponent(reference)}`, {
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
      failed: 'failed',
      cancelled: 'abandoned',
      abandoned: 'abandoned',
      pending: 'pending',
    }

    const statusStr = (tx.status || 'pending').toLowerCase()

    return {
      status: statusMap[statusStr] ?? 'pending',
      amountPaid: tx.amount_paid || tx.amount || 0,
      currency: (tx.currency || 'NGN').toUpperCase(),
      reference: tx.reference || reference,
      paidAt: tx.paid_at || tx.completed_at || undefined,
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
