import { describe, it, expect, vi, beforeEach } from 'vitest'
import { paystackProvider } from './paystack'

// Mock global fetch
global.fetch = vi.fn()

describe('paystackProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_123'
    process.env.PAYSTACK_TEST_SECRET_KEY = 'sk_test_abc'
  })

  it('initiates payment successfully', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          authorization_url: 'https://checkout.paystack.com/123',
          reference: 'test_ref_123'
        }
      })
    })

    const result = await paystackProvider.initiatePayment({
      amountMinor: 500000, // 5000 NGN
      currency: 'NGN',
      customerEmail: 'test@example.com',
      reference: 'test_ref_123',
      callbackUrl: 'https://example.com/callback'
    })

    expect(result.authorizationUrl).toBe('https://checkout.paystack.com/123')
    expect(result.reference).toBe('test_ref_123')
    
    // Verify fetch was called correctly
    expect(fetch).toHaveBeenCalledWith('https://api.paystack.co/transaction/initialize', expect.objectContaining({
      method: 'POST',
      headers: {
        Authorization: 'Bearer sk_test_123',
        'Content-Type': 'application/json',
      }
    }))
  })

  it('uses test keys when useTestKeys is true', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { authorization_url: 'url', reference: 'ref' } })
    })

    await paystackProvider.initiatePayment({
      amountMinor: 500000,
      currency: 'NGN',
      customerEmail: 'test@example.com',
      reference: 'ref',
      callbackUrl: 'https://example.com/callback',
      useTestKeys: true // Crucial param
    })

    // Should use PAYSTACK_TEST_SECRET_KEY
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer sk_test_abc'
      })
    }))
  })

  it('validates webhook signatures correctly', () => {
    process.env.PAYSTACK_SECRET_KEY = 'my_secret'
    
    const payload = JSON.stringify({ event: 'charge.success' })
    // Paystack signature uses HMAC SHA512
    const crypto = require('crypto')
    const validSignature = crypto.createHmac('sha512', 'my_secret').update(payload).digest('hex')

    expect(paystackProvider.validateWebhookSignature(payload, validSignature)).toBe(true)
    expect(paystackProvider.validateWebhookSignature(payload, 'invalid_signature')).toBe(false)
  })
})
