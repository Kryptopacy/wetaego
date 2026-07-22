import { describe, it, expect, vi, beforeEach } from 'vitest'
import { bachsProvider } from './bachs'
import crypto from 'crypto'

// Mock global fetch
global.fetch = vi.fn()

describe('bachsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.BACHS_API_KEY = 'bachs_live_key_123'
    process.env.BACHS_TEST_API_KEY = 'bachs_test_key_abc'
    process.env.BACHS_WEBHOOK_SECRET = 'bachs_secret_xyz'
  })

  it('initiates payment successfully with checkout session URL', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          checkout_url: 'https://pay.bachs.io/checkout/session_123',
          reference: 'bachs_ref_123'
        }
      })
    })

    const result = await bachsProvider.initiatePayment({
      amountMinor: 250000, // 2500 NGN
      currency: 'NGN',
      customerEmail: 'customer@example.com',
      reference: 'bachs_ref_123',
      callbackUrl: 'https://ourmenuos.online/m/demo/callback',
      channels: ['card', 'bank_transfer', 'crypto']
    })

    expect(result.authorizationUrl).toBe('https://pay.bachs.io/checkout/session_123')
    expect(result.reference).toBe('bachs_ref_123')

    expect(fetch).toHaveBeenCalledWith('https://api.bachs.io/v1/checkout/sessions', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer bachs_live_key_123',
        'X-Bachs-Key': 'bachs_live_key_123',
        'Content-Type': 'application/json'
      })
    }))
  })

  it('uses test keys when useTestKeys is true', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { checkout_url: 'https://sandbox.bachs.io/pay', reference: 'test_ref' } })
    })

    await bachsProvider.initiatePayment({
      amountMinor: 10000,
      currency: 'USD',
      customerEmail: 'test@example.com',
      reference: 'test_ref',
      callbackUrl: 'https://example.com/callback',
      useTestKeys: true
    })

    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer bachs_test_key_abc'
      })
    }))
  })

  it('verifies payment status correctly', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          status: 'completed',
          amount_paid: 50000,
          currency: 'NGN',
          reference: 'ref_verify_999'
        }
      })
    })

    const verification = await bachsProvider.verifyPayment('ref_verify_999')
    expect(verification.status).toBe('success')
    expect(verification.amountPaid).toBe(50000)
    expect(verification.currency).toBe('NGN')
  })

  it('validates HMAC SHA256 webhook signatures correctly', () => {
    const payload = JSON.stringify({ event: 'payment.completed', reference: 'ref_123' })
    const validSignature = crypto.createHmac('sha256', 'bachs_secret_xyz').update(payload).digest('hex')

    expect(bachsProvider.validateWebhookSignature(payload, validSignature)).toBe(true)
    expect(bachsProvider.validateWebhookSignature(payload, 'invalid_sig')).toBe(false)
  })
})
