/**
 * Bachs Payment Provider (bachs.io)
 * Implements the PaymentProvider interface for Bachs.
 * Supports Local Cards, Bank Transfers, International Cards, and Crypto/Stablecoins (USDC, USDT, SOL).
 */

import crypto from 'crypto'
import type { PaymentProvider, PaymentParams, PaymentVerification } from './provider'

function getBachsConfig(useTestKeys?: boolean) {
  const apiKey = useTestKeys
    ? process.env.BACHS_TEST_API_KEY
    : (process.env.BACHS_API_KEY || process.env.BACHS_SECRET_KEY)

  if (!apiKey) {
    throw new Error('BACHS_API_KEY is not configured')
  }

  const isSandbox = Boolean(useTestKeys || apiKey.startsWith('sk_sandbox_'))
  const baseUrl =
    process.env.BACHS_BASE_URL ||
    (isSandbox ? 'https://sandbox-api.bachs.io/v1' : 'https://api.bachs.io/v1')

  return { apiKey, baseUrl, isSandbox }
}

export const bachsProvider: PaymentProvider = {
  name: 'bachs',

  async initiatePayment(params: PaymentParams) {
    const { apiKey, baseUrl } = getBachsConfig(params.useTestKeys)

    const amountInUnits = (params.amountMinor / 100).toFixed(2)

    const payload = {
      pricing: {
        amount: amountInUnits,
        currency: params.currency.toUpperCase(),
        ...(params.currencyOptions && params.currencyOptions.length > 0 ? {
          currency_options: params.currencyOptions.map(opt => ({
            currency: opt.currency.toUpperCase(),
            amount: (opt.amountMinor / 100).toFixed(2),
          })),
        } : {}),
        ...(params.chargeType === 'auth' ? { charge_type: 'pre_auth' } : {}),
      },
      billing_currency: params.currency.toUpperCase(),
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

    const res = await fetch(`${baseUrl}/checkout-sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-Bachs-Key': apiKey,
        'Content-Type': 'application/json',
        'Idempotency-Key': `chk_${params.reference}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[bachsProvider] initiatePayment failed:', err)
      if (err?.error_code === 'DEPOSIT_LIMIT_EXCEEDED') {
        const details = err.details || {}
        throw new Error(
          `DEPOSIT_LIMIT_EXCEEDED: Transaction exceeds maximum allowed amount of ${details.currency || ''} ${details.max_allowed_amount || ''}. Requested: ${details.requested_amount || ''}. Please split the payment or contact support.`
        )
      }
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
    const { apiKey, baseUrl } = getBachsConfig(useTestKeys)

    const res = await fetch(`${baseUrl}/checkout-sessions/${encodeURIComponent(reference)}`, {
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
      succeeded: 'success',
      accepted: 'success',
      completed: 'success',
      successful: 'success',
      success: 'success',
      paid: 'success',
      overpaid: 'success',
      underpaid: 'success',
      failed: 'failed',
      cancelled: 'abandoned',
      canceled: 'abandoned',
      abandoned: 'abandoned',
      expired: 'abandoned',
      pending: 'pending',
      processing: 'pending',
      open: 'pending',
      created: 'pending',
      requires_payment_method: 'pending',
    }

    const rawStatus = (tx.payment_status || tx.status || 'pending').toLowerCase()
    const status = statusMap[rawStatus] ?? 'pending'

    const rawAmount = tx.charge?.amount_paid || tx.charge?.amount || tx.amount_paid || tx.amount || 0
    const amountPaid = typeof rawAmount === 'string'
      ? Math.round(parseFloat(rawAmount) * 100)
      : Math.round(Number(rawAmount))

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
    const { apiKey, baseUrl } = getBachsConfig(useTestKeys)

    // Bachs refund expects charge_id and optional decimal amount string (e.g. "29.00")
    const payload: { charge_id: string; reference: string; amount?: string } = {
      charge_id: reference,
      reference: `ref_${reference}_${Date.now()}`.slice(0, 128),
    }
    if (amountMinor) {
      payload.amount = (amountMinor / 100).toFixed(2)
    }

    const res = await fetch(`${baseUrl}/refunds`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-Bachs-Key': apiKey,
        'Content-Type': 'application/json',
        'Idempotency-Key': `refund_${reference}_${Date.now()}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('Bachs refund failed:', err)
      return { success: false, message: err?.detail || err?.message || 'Refund failed at gateway' }
    }

    return { success: true }
  },

  async chargeCardOnFile(token: string, amountMinor: number, email: string, reference: string, useTestKeys?: boolean): Promise<PaymentVerification> {
    const { apiKey, baseUrl } = getBachsConfig(useTestKeys)

    const amountInUnits = (amountMinor / 100).toFixed(2)

    const res = await fetch(`${baseUrl}/charge_authorization`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-Bachs-Key': apiKey,
        'Content-Type': 'application/json',
        'Idempotency-Key': `charge_${reference}`,
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

    const rawAmount = data.amount_paid || data.amount || 0
    const amountPaid = typeof rawAmount === 'string'
      ? Math.round(parseFloat(rawAmount) * 100)
      : Math.round(Number(rawAmount))

    return {
      status: data.status === 'succeeded' ? 'success' : (data.status === 'failed' ? 'failed' : 'pending'),
      amountPaid,
      currency: (data.currency || 'NGN').toUpperCase(),
      reference: data.reference || reference,
      paidAt: data.created_at,
      providerData: data,
    }
  },

  validateWebhookSignature(payload: string, signature: string, timestampHeader?: string | null): boolean {
    const secret =
      process.env.BACHS_WEBHOOK_SECRET ||
      process.env.BACHS_API_KEY ||
      process.env.BACHS_SECRET_KEY ||
      process.env.PAYSTACK_SECRET_KEY
    if (!secret || !signature) return false

    try {
      let message = payload
      if (timestampHeader) {
        const timestamp = parseInt(timestampHeader, 10)
        if (isNaN(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) {
          return false // Replay attack prevention: reject if time drift > 300 seconds
        }
        message = `${timestampHeader}.${payload}`
      }

      const expected = crypto.createHmac('sha256', secret).update(message, 'utf8').digest('hex')
      if (expected.length === signature.length) {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
      }
      return false
    } catch {
      return false
    }
  },
}

export async function createBachsSubaccount(accountNumber: string, bankCode: string, businessName: string): Promise<string> {
  const { apiKey, baseUrl } = getBachsConfig()

  const res = await fetch(`${baseUrl}/subaccounts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `subaccount_${accountNumber}_${bankCode}`,
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

export async function createBachsProduct(params: {
  name: string
  amountMinor: number
  currency: string
  interval?: 'day' | 'week' | 'month' | 'year'
  frequency?: number
  trialDays?: number
  currencyOptions?: { currency: string; amountMinor: number }[]
  useTestKeys?: boolean
}): Promise<{ id: string; name: string }> {
  const { apiKey, baseUrl } = getBachsConfig(params.useTestKeys)

  const res = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `prod_${params.name.toLowerCase().replace(/\s+/g, '_')}_${params.amountMinor}`,
    },
    body: JSON.stringify({
      name: params.name,
      price: {
        price_type: params.amountMinor === 0 ? 'free' : 'fixed',
        ...(params.amountMinor > 0 ? {
          amount: (params.amountMinor / 100).toFixed(2),
          currency: params.currency.toUpperCase(),
        } : {}),
        ...(params.currencyOptions && params.currencyOptions.length > 0 ? {
          currency_options: params.currencyOptions.map(opt => ({
            currency: opt.currency.toUpperCase(),
            amount: (opt.amountMinor / 100).toFixed(2),
          })),
        } : {}),
      },
      ...(params.interval ? {
        billing_cycle: {
          interval: params.interval,
          frequency: params.frequency || 1,
        },
      } : {}),
      ...(params.trialDays ? {
        trial_period: {
          interval: 'day',
          frequency: params.trialDays,
        },
      } : {}),
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Bachs createProduct failed: ${JSON.stringify(err)}`)
  }

  const data = await res.json()
  return {
    id: data?.id || `prod_${Date.now()}`,
    name: data?.name || params.name,
  }
}

export async function updateBachsSubscription(
  subscriptionId: string,
  params: {
    productId?: string
    prorationBehavior?: 'invoice_now' | 'next_cycle' | 'none'
    useTestKeys?: boolean
  }
): Promise<{ id: string; status: string }> {
  const { apiKey, baseUrl } = getBachsConfig(params.useTestKeys)

  const res = await fetch(`${baseUrl}/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...(params.productId ? { product_id: params.productId } : {}),
      ...(params.prorationBehavior ? { proration_behavior: params.prorationBehavior } : {}),
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Bachs updateSubscription failed: ${JSON.stringify(err)}`)
  }

  const data = await res.json()
  return {
    id: data?.id || subscriptionId,
    status: data?.status || 'active',
  }
}

export async function cancelBachsSubscription(
  subscriptionId: string,
  params?: {
    cancelAtPeriodEnd?: boolean
    reason?: string
    useTestKeys?: boolean
  }
): Promise<{ id: string; status: string }> {
  const { apiKey, baseUrl } = getBachsConfig(params?.useTestKeys)

  const res = await fetch(`${baseUrl}/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cancel_at_period_end: params?.cancelAtPeriodEnd ?? true,
      ...(params?.reason ? { reason: params.reason } : {}),
    }),
  })

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Bachs cancelSubscription failed: ${JSON.stringify(err)}`)
  }

  return {
    id: subscriptionId,
    status: params?.cancelAtPeriodEnd ? 'cancel_at_period_end' : 'canceled',
  }
}

