import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import crypto from 'crypto'
import { bachsProvider, createBachsProduct } from '../bachs'

// Mock fetch globally
global.fetch = vi.fn()

describe('Bachs Payment Provider', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.BACHS_API_KEY = 'sk_live_test_key_123'
    process.env.BACHS_TEST_API_KEY = 'sk_sandbox_test_key_456'
    process.env.BACHS_WEBHOOK_SECRET = 'whsec_test_secret_789'
    delete process.env.BACHS_BASE_URL
  })

  it('initiatePayment should route to sandbox when useTestKeys is true and include Idempotency-Key', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        checkout_url: 'https://checkout.bachs.io/c/tok_sandbox_123',
        reference: 'test_ref_123',
      }),
    }

    ;(global.fetch as Mock).mockResolvedValueOnce(mockResponse)

    const result = await bachsProvider.initiatePayment({
      amountMinor: 50000, // NGN 500.00
      currency: 'NGN',
      customerEmail: 'customer@example.com',
      reference: 'test_ref_123',
      callbackUrl: 'https://ourmenuos.online/callback',
      useTestKeys: true,
    })

    expect(global.fetch).toHaveBeenCalledWith(
      'https://sandbox-api.bachs.io/v1/checkout-sessions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk_sandbox_test_key_456',
          'Idempotency-Key': 'chk_test_ref_123',
          'Content-Type': 'application/json',
        }),
        body: expect.stringContaining('"amount":"500.00"'),
      })
    )

    expect(result.authorizationUrl).toBe('https://checkout.bachs.io/c/tok_sandbox_123')
    expect(result.reference).toBe('test_ref_123')
  })

  it('verifyPayment should parse string decimal amounts and map statuses correctly', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        data: {
          status: 'accepted',
          amount_paid: '29.50',
          currency: 'USD',
          reference: 'test_ref_123',
          completed_at: '2026-08-02T12:00:00Z',
        },
      }),
    }

    ;(global.fetch as Mock).mockResolvedValueOnce(mockResponse)

    const result = await bachsProvider.verifyPayment('test_ref_123')

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.bachs.io/v1/checkout-sessions/test_ref_123',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer sk_live_test_key_123',
        }),
      })
    )

    expect(result.status).toBe('success')
    expect(result.amountPaid).toBe(2950) // $29.50 formatted to 2950 minor units
    expect(result.currency).toBe('USD')
  })

  it('refundPayment should format amount as 2-decimal string and send charge_id', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        id: 'ref_123',
        status: 'succeeded',
      }),
    }

    ;(global.fetch as Mock).mockResolvedValueOnce(mockResponse)

    const result = await bachsProvider.refundPayment!('chr_1a2b3c', 2900)

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.bachs.io/v1/refunds',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk_live_test_key_123',
          'Idempotency-Key': expect.stringMatching(/^refund_chr_1a2b3c_/),
        }),
        body: expect.stringContaining('"charge_id":"chr_1a2b3c"'),
      })
    )

    // Ensure amount was sent as decimal string "29.00"
    const callArgs = (global.fetch as Mock).mock.calls[0][1]
    const body = JSON.parse(callArgs.body)
    expect(body.amount).toBe('29.00')
    expect(result.success).toBe(true)
  })

  it('validateWebhookSignature should verify HMAC with timestamp and reject replayed timestamps', () => {
    const secret = 'whsec_test_secret_789'
    const rawBody = JSON.stringify({ event: 'collection.succeeded', data: { reference: 'test_ref' } })
    const validTimestamp = String(Math.floor(Date.now() / 1000))
    const message = `${validTimestamp}.${rawBody}`
    const validSignature = crypto.createHmac('sha256', secret).update(message, 'utf8').digest('hex')

    // Valid signature with timestamp within tolerance
    expect(bachsProvider.validateWebhookSignature(rawBody, validSignature, validTimestamp)).toBe(true)

    // Replay attack prevention: timestamp older than 300 seconds
    const expiredTimestamp = String(Math.floor(Date.now() / 1000) - 600) // 10 mins old
    const expiredMessage = `${expiredTimestamp}.${rawBody}`
    const expiredSignature = crypto.createHmac('sha256', secret).update(expiredMessage, 'utf8').digest('hex')

    expect(bachsProvider.validateWebhookSignature(rawBody, expiredSignature, expiredTimestamp)).toBe(false)
  })

  it('initiatePayment should format currency_options for multi-market local pricing', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        checkout_url: 'https://checkout.bachs.io/c/tok_local_123',
        reference: 'test_local_ref',
      }),
    }

    ;(global.fetch as Mock).mockResolvedValueOnce(mockResponse)

    await bachsProvider.initiatePayment({
      amountMinor: 1000, // $10.00 USD
      currency: 'USD',
      customerEmail: 'customer@example.com',
      reference: 'test_local_ref',
      callbackUrl: 'https://ourmenuos.online/callback',
      currencyOptions: [
        { currency: 'GHS', amountMinor: 15000 },
        { currency: 'KES', amountMinor: 130000 },
      ],
    })

    const callArgs = (global.fetch as Mock).mock.calls[0][1]
    const body = JSON.parse(callArgs.body)
    expect(body.pricing.currency_options).toEqual([
      { currency: 'GHS', amount: '150.00' },
      { currency: 'KES', amount: '1300.00' },
    ])
  })

  it('initiatePayment should throw DEPOSIT_LIMIT_EXCEEDED with structured message when limit is exceeded', async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      json: async () => ({
        error_code: 'DEPOSIT_LIMIT_EXCEEDED',
        details: {
          requested_amount: '2000.00',
          max_allowed_amount: '1000.00',
          currency: 'USD',
        },
      }),
    }

    ;(global.fetch as Mock).mockResolvedValueOnce(mockResponse)

    await expect(
      bachsProvider.initiatePayment({
        amountMinor: 200000,
        currency: 'USD',
        customerEmail: 'customer@example.com',
        reference: 'test_limit_ref',
        callbackUrl: 'https://ourmenuos.online/callback',
      })
    ).rejects.toThrow('DEPOSIT_LIMIT_EXCEEDED')
  })

  it('createBachsProduct should correctly format billing_cycle and trial_period', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        id: 'prod_123',
        name: 'Pro plan',
      }),
    }

    ;(global.fetch as Mock).mockResolvedValueOnce(mockResponse)

    const result = await createBachsProduct({
      name: 'Pro plan',
      amountMinor: 1000,
      currency: 'USD',
      interval: 'month',
      frequency: 1,
      trialDays: 14,
    })

    const callArgs = (global.fetch as Mock).mock.calls[0][1]
    const body = JSON.parse(callArgs.body)
    expect(body.billing_cycle).toEqual({ interval: 'month', frequency: 1 })
    expect(body.trial_period).toEqual({ interval: 'day', frequency: 14 })
    expect(result.id).toBe('prod_123')
  })
})

