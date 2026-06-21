// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../app/api/webhooks/paystack/route'
import crypto from 'crypto'

// Mock the Next.js Request and NextResponse
vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: vi.fn((body, init) => ({ body, init }))
    }
  }
})

// Mock the Termii and Vercel functions
vi.mock('@vercel/functions', () => ({ waitUntil: vi.fn() }))
vi.mock('@/lib/notifications/termii', () => ({ sendWhatsAppMessage: vi.fn() }))
vi.mock('@/lib/notifications/dispatcher', () => ({ notifyBusiness: vi.fn(() => Promise.resolve()) }))

// Mock Supabase
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockUpdate = vi.fn(() => ({ eq: mockEq }))
const mockInsert = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  update: mockUpdate,
  insert: mockInsert
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom
  }))
}))

describe('Paystack B2C Webhook (POST)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.PAYSTACK_SECRET_KEY = 'test_secret'
  })

  it('rejects invalid signatures', async () => {
    const payload = JSON.stringify({ event: 'charge.success', data: { reference: '123' } })
    const req = {
      text: async () => payload,
      headers: new Headers({
        'x-paystack-signature': 'invalid_signature_hash'
      })
    } as any

    const res = await POST(req)
    expect(res.body).toEqual({ error: 'Invalid signature' })
    expect(res.init?.status).toBe(400)
  })

  it('accepts valid signatures and processes charge.success', async () => {
    const payload = JSON.stringify({ event: 'charge.success', data: { reference: 'order_123', amount: 5000 } })
    const hash = crypto.createHmac('sha512', 'test_secret').update(payload).digest('hex')
    
    const req = {
      text: async () => payload,
      headers: new Headers({
        'x-paystack-signature': hash
      })
    } as any

    // Setup Supabase mocks for a successful flow
    // 1. Idempotency Check (returns null)
    mockSingle.mockResolvedValueOnce({ data: null })
    // 2. Fetch Order Check (returns order)
    mockSingle.mockResolvedValueOnce({ 
      data: { 
        id: 'order_123', 
        status: 'pending', 
        total_amount_minor: 5000, 
        location_id: 'loc_123' 
      } 
    })

    mockEq.mockReturnValue({ single: mockSingle })

    const res = await POST(req)
    
    expect(res.body).toEqual({ status: 'success' })
    expect(res.init?.status).toBe(200)
    
    // Verify Supabase was called to insert payment to order_payments
    expect(mockFrom).toHaveBeenCalledWith('webhook_events')
    expect(mockFrom).toHaveBeenCalledWith('orders')
    expect(mockFrom).toHaveBeenCalledWith('order_payments')
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      order_id: 'order_123',
      amount_minor: 5000,
      provider_reference: 'order_123',
    }))
  })

  it('processes partial payments and leaves status handling to DB trigger', async () => {
    const payload = JSON.stringify({ event: 'charge.success', data: { reference: 'order_123', amount: 4000 } })
    const hash = crypto.createHmac('sha512', 'test_secret').update(payload).digest('hex')
    
    const req = {
      text: async () => payload,
      headers: new Headers({
        'x-paystack-signature': hash
      })
    } as any

    // 1. Idempotency Check (returns null)
    mockSingle.mockResolvedValueOnce({ data: null })
    // 2. Fetch Order Check (returns order)
    mockSingle.mockResolvedValueOnce({ 
      data: { 
        id: 'order_123', 
        status: 'pending', 
        total_amount_minor: 5000, 
        location_id: 'loc_123' 
      } 
    })

    mockEq.mockReturnValue({ single: mockSingle })

    const res = await POST(req)
    
    expect(res.body).toEqual({ status: 'success' })
    expect(res.init?.status).toBe(200)
    
    // Inserts the partial payment to the ledger
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      order_id: 'order_123',
      amount_minor: 4000,
      provider_reference: 'order_123',
    }))
  })
})


