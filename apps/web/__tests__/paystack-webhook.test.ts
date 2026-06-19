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
    // 3. Location Fetch for WhatsApp (returns location)
    mockSingle.mockResolvedValueOnce({ data: { whatsapp_number: '1234567890' } })

    mockEq.mockReturnValue({ single: mockSingle })

    const res = await POST(req)
    
    expect(res.body).toEqual({ status: 'success' })
    expect(res.init?.status).toBe(200)
    
    // Verify Supabase was called to update the order to paid
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'paid' })
    expect(mockEq).toHaveBeenCalledWith('id', 'order_123')
  })

  it('ignores overpayments without calculating as tip (as per Paystack best practice)', async () => {
    const payload = JSON.stringify({ event: 'charge.success', data: { reference: 'order_123', amount: 6000 } })
    const hash = crypto.createHmac('sha512', 'test_secret').update(payload).digest('hex')
    
    const req = {
      text: async () => payload,
      headers: new Headers({
        'x-paystack-signature': hash
      })
    } as any

    mockSingle.mockResolvedValueOnce({ data: null })
    // Fetch Order: Total amount is 5000, user overpaid 6000
    mockSingle.mockResolvedValueOnce({ 
      data: { 
        id: 'order_123', 
        status: 'pending', 
        total_amount_minor: 5000, 
        location_id: 'loc_123' 
      } 
    })
    mockSingle.mockResolvedValueOnce({ data: null })

    mockEq.mockReturnValue({ single: mockSingle })

    const res = await POST(req)
    
    expect(res.body).toEqual({ status: 'success' })
    
    // Verify Supabase update just sets it to paid
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'paid' })
  })

  it('fails the order if underpaid', async () => {
    const payload = JSON.stringify({ event: 'charge.success', data: { reference: 'order_123', amount: 4000 } })
    const hash = crypto.createHmac('sha512', 'test_secret').update(payload).digest('hex')
    
    const req = {
      text: async () => payload,
      headers: new Headers({
        'x-paystack-signature': hash
      })
    } as any

    mockSingle.mockResolvedValueOnce({ data: null })
    // Order was 5000, but they paid 4000
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
    
    expect(res.body).toEqual({ error: 'Amount mismatch' })
    expect(res.init?.status).toBe(400)
    
    // Order marked as failed
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'failed' })
  })
})


