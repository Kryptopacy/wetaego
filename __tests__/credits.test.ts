import { describe, expect, it, vi, beforeEach } from 'vitest'
import { chargeCredits, refundCredits } from '../lib/payments/credits'
import { createAdminClient } from '../lib/supabase/server'
import { getPlanLimits } from '../lib/utils/settings'

// Mock dependencies
vi.mock('../lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('../lib/utils/settings', () => ({
  getPlanLimits: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

describe('Credit System', () => {
  const mockRpc = vi.fn()
  const mockFrom = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup Supabase mock
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(createAdminClient as unknown as any).mockResolvedValue({
      rpc: mockRpc,
      from: mockFrom,
    })
    
    // Setup plan limits mock
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(getPlanLimits as unknown as any).mockResolvedValue({
      lite: { credits: 0, pages: 1 },
      pro: { credits: 50, pages: 5 },
      enterprise: { credits: 200, pages: 20 },
    })
  })

  describe('chargeCredits (Atomic RPC)', () => {
    it('successfully charges credits via RPC', async () => {
      mockRpc.mockResolvedValueOnce({
        data: { success: true, remaining: 45 },
        error: null
      })

      const result = await chargeCredits('org-123', 5, 'Booking confirmation')
      
      expect(mockRpc).toHaveBeenCalledWith('charge_credits_atomic', {
        p_organization_id: 'org-123',
        p_cost: 5,
        p_reason: 'Booking confirmation',
        p_user_id: null,
      })
      expect(result).toEqual({ success: true, remaining: 45 })
    })

    it('handles RPC errors properly', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: new Error('Insufficient credits')
      })

      const result = await chargeCredits('org-123', 500, 'Expensive action')
      
      expect(result).toEqual({ 
        success: false, 
        error: 'Insufficient credits' 
      })
    })
    
    it('falls back to non-atomic update if RPC is missing', async () => {
      // 1. RPC fails with function does not exist
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'function charge_credits_atomic does not exist' }
      })
      
      // 2. Fallback fetch org state
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValueOnce({
        data: {
          subscription_tier: 'pro',
          purchased_credits: 10,
          monthly_free_credits_used: 48 // 2 free left (50 - 48)
        },
        error: null
      })
      
      const mockUpdate = vi.fn().mockReturnThis()
      const mockInsert = vi.fn().mockResolvedValueOnce({ error: null })
      
      mockFrom.mockImplementation((table) => {
        if (table === 'organizations') {
          return { select: mockSelect, eq: mockEq, single: mockSingle, update: mockUpdate }
        }
        if (table === 'credit_transactions') {
          return { insert: mockInsert }
        }
      })
      
      // Charge 5 credits (should use 2 free, 3 purchased)
      const result = await chargeCredits('org-123', 5, 'Fallback charge')
      
      expect(mockUpdate).toHaveBeenCalledWith({
        monthly_free_credits_used: 50,
        purchased_credits: 7 // 10 - 3
      })
      
      expect(mockInsert).toHaveBeenCalledWith({
        organization_id: 'org-123',
        amount: -5,
        reason: 'Fallback charge',
        created_by: undefined
      })
      
      expect(result).toEqual({ success: true, remaining: 7 })
    })
  })

  describe('refundCredits', () => {
    it('refunds credits successfully', async () => {
      // Mock get org
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValueOnce({
        data: { purchased_credits: 50, monthly_free_credits_used: 15 },
        error: null
      })
      
      // Mock update
      const mockUpdate = vi.fn().mockReturnThis()
      
      // Mock insert
      const mockInsert = vi.fn().mockResolvedValueOnce({ error: null })
      
      mockFrom.mockImplementation((table) => {
        if (table === 'organizations') {
          return { select: mockSelect, eq: mockEq, single: mockSingle, update: mockUpdate }
        }
        if (table === 'credit_transactions') {
          return { insert: mockInsert }
        }
      })

      const result = await refundCredits('org-123', 10, 'Refund for failed booking')
      
      expect(mockUpdate).toHaveBeenCalledWith({
        monthly_free_credits_used: 5,
        purchased_credits: 50
      })
      
      expect(result).toEqual({ success: true })
    })
  })
})
