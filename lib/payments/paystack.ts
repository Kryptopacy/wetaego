/**
 * Paystack Payment Provider
 * Implements the PaymentProvider interface for Paystack.
 * To switch to Flutterwave: create lib/payments/flutterwave.ts with the same interface.
 */

import crypto from 'crypto'
import type { PaymentProvider, PaymentParams, PaymentVerification } from './provider'

const PAYSTACK_BASE = 'https://api.paystack.co'

export const paystackProvider: PaymentProvider = {
  name: 'paystack',

  async initiatePayment(params: PaymentParams) {
    const secretKey = params.useTestKeys ? process.env.PAYSTACK_TEST_SECRET_KEY : process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not configured')

    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: params.amountMinor,
        currency: params.currency,
        email: params.customerEmail,
        reference: params.reference,
        callback_url: params.callbackUrl,
        ...(params.subaccountCode ? { subaccount: params.subaccountCode, bearer: 'subaccount' } : {}),
        ...(params.splitCode ? { split_code: params.splitCode, bearer: 'subaccount' } : {}),
        ...(params.transactionChargeMinor ? { transaction_charge: params.transactionChargeMinor } : {}),
        ...(params.channels ? { channels: params.channels } : {}),
        metadata: {
          ...params.metadata,
          customer_name: params.customerName,
          customer_phone: params.customerPhone,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`Paystack initiate failed: ${JSON.stringify(err)}`)
    }

    const data = await res.json()
    return {
      authorizationUrl: data.data.authorization_url as string,
      reference: data.data.reference as string,
    }
  },

  async verifyPayment(reference: string, useTestKeys?: boolean): Promise<PaymentVerification> {
    const secretKey = useTestKeys ? process.env.PAYSTACK_TEST_SECRET_KEY : process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not configured')

    const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      if (res.status === 404) return { status: 'pending', amountPaid: 0, currency: 'NGN', reference }
      throw new Error(`Paystack verify failed: ${res.status}`)
    }

    const data = await res.json()
    const tx = data.data

    const statusMap: Record<string, PaymentVerification['status']> = {
      success: 'success',
      failed: 'failed',
      abandoned: 'abandoned',
    }

    return {
      status: statusMap[tx.status as string] ?? 'pending',
      amountPaid: tx.amount as number,
      currency: tx.currency as string,
      reference: tx.reference as string,
      paidAt: tx.paid_at as string | undefined,
      providerData: tx,
    }
  },

  async refundPayment(reference: string, amountMinor?: number, useTestKeys?: boolean) {
    const secretKey = useTestKeys ? process.env.PAYSTACK_TEST_SECRET_KEY : process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not configured')

    const payload: { transaction: string; amount?: number } = { transaction: reference }
    if (amountMinor) payload.amount = amountMinor

    const res = await fetch(`${PAYSTACK_BASE}/refund`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('Paystack refund failed:', err)
      return { success: false, message: err.message || 'Refund failed at gateway' }
    }

    return { success: true }
  },

  validateWebhookSignature(payload: string, signature: string): boolean {
    const liveKey = process.env.PAYSTACK_SECRET_KEY
    const testKey = process.env.PAYSTACK_TEST_SECRET_KEY

    let liveValid = false
    if (liveKey) {
      const hash = crypto.createHmac('sha512', liveKey).update(payload).digest('hex')
      if (hash.length === signature.length) {
        liveValid = crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))
      }
    }

    let testValid = false
    if (testKey) {
      const hash = crypto.createHmac('sha512', testKey).update(payload).digest('hex')
      if (hash.length === signature.length) {
        testValid = crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))
      }
    }

    return liveValid || testValid
  },
}

/**
 * Active payment provider — switch this one export to change providers globally.
 * e.g. import { flutterwaveProvider } from './flutterwave'
 *      export const paymentProvider = flutterwaveProvider
 */
export const paymentProvider: PaymentProvider = paystackProvider

export async function createSubaccount(bankCode: string, accountNumber: string, businessName: string, percentageCharge: number = 0): Promise<string> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not configured')

  const res = await fetch(`${PAYSTACK_BASE}/subaccount`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      business_name: businessName,
      settlement_bank: bankCode,
      account_number: accountNumber,
      percentage_charge: percentageCharge
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Paystack createSubaccount failed: ${JSON.stringify(err)}`)
  }

  const data = await res.json()
  return data.data.subaccount_code as string
}

export async function createTransferRecipient(name: string, accountNumber: string, bankCode: string): Promise<string> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not configured')

  const res = await fetch(`${PAYSTACK_BASE}/transferrecipient`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: "nuban",
      name: name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN"
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Paystack createTransferRecipient failed: ${JSON.stringify(err)}`)
  }

  const data = await res.json()
  return data.data.recipient_code as string
}

export async function initiateTransfer(amountMinor: number, recipientCode: string, reason: string): Promise<boolean> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not configured')

  const res = await fetch(`${PAYSTACK_BASE}/transfer`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: "balance",
      amount: amountMinor,
      recipient: recipientCode,
      reason: reason
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Paystack initiateTransfer failed: ${JSON.stringify(err)}`)
  }

  return true
}
