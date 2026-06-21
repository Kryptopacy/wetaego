/* eslint-disable @typescript-eslint/no-explicit-any */
// FIXME: Developer bypassed types/rules. Requires refactoring for true perfection.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { paystackProvider } from '../paystack'

// Mock fetch globally
global.fetch = vi.fn()

describe('Payment Provider Abstraction', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.PAYSTACK_SECRET_KEY = 'test_secret_key'
  })

  it('paystackProvider should format initiate payload correctly', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        data: {
          authorization_url: 'https://checkout.paystack.com/test',
          reference: 'test_ref_123',
        },
      }),
    }
    
    ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

    const result = await paystackProvider.initiatePayment({
      amountMinor: 50000, // NGN 500.00
      currency: 'NGN',
      customerEmail: 'test@ourmenu.com',
      reference: 'test_ref_123',
      callbackUrl: 'https://ourmenu.com/callback',
      metadata: { custom_field: 'value' }
    })

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.paystack.co/transaction/initialize',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer test_secret_key',
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"amount":50000'),
      })
    )

    expect(result.authorizationUrl).toBe('https://checkout.paystack.com/test')
    expect(result.reference).toBe('test_ref_123')
  })

  it('paystackProvider should handle verification payload correctly', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        data: {
          status: 'success',
          amount: 50000,
          currency: 'NGN',
          reference: 'test_ref_123',
          paid_at: '2026-06-17T12:00:00Z'
        },
      }),
    }
    
    ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

    const result = await paystackProvider.verifyPayment('test_ref_123')

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.paystack.co/transaction/verify/test_ref_123',
      expect.objectContaining({
        headers: { Authorization: 'Bearer test_secret_key' },
      })
    )

    expect(result.status).toBe('success')
    expect(result.amountPaid).toBe(50000)
    expect(result.paidAt).toBe('2026-06-17T12:00:00Z')
  })
})
