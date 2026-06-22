import { describe, expect, it, vi, beforeEach } from 'vitest'
import { updateBookingStatus } from '../app/(dashboard)/dashboard/bookings/actions'
import { createClient } from '../lib/supabase/server'

// Mock dependencies
vi.mock('../lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Booking Flow (updateBookingStatus)', () => {
  const mockUpdate = vi.fn()
  const mockFrom = vi.fn()
  const mockSelect = vi.fn()
  const mockEq = vi.fn()
  const mockSingle = vi.fn()
  const mockAuthGetUser = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    mockEq.mockReturnThis()
    mockUpdate.mockReturnThis()

    mockFrom.mockImplementation((table) => {
      if (table === 'page_bookings') {
        return { select: mockSelect.mockReturnThis(), eq: mockEq, single: mockSingle, update: mockUpdate }
      }
      if (table === 'organization_members') {
        return { select: mockSelect.mockReturnThis(), eq: mockEq, single: mockSingle }
      }
      if (table === 'organizations') {
        return { select: mockSelect.mockReturnThis(), eq: mockEq, single: mockSingle }
      }
    })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(createClient as unknown as any).mockResolvedValue({
      from: mockFrom,
      auth: { getUser: mockAuthGetUser }
    })
  })

  it('fails if not authenticated', async () => {
    mockAuthGetUser.mockResolvedValueOnce({ data: null, error: new Error('Not logged in') })

    await expect(updateBookingStatus('booking-123', 'mark_paid')).rejects.toThrow('Not authenticated')
  })

  it('updates booking to paid successfully', async () => {
    mockAuthGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    
    // Mock finding the booking
    mockSingle.mockResolvedValueOnce({
      data: { location_pages: { locations: { organization_id: 'org-1' } } }
    })
    
    // Mock authorization (is owner)
    mockSingle.mockResolvedValueOnce({
      data: { role: 'owner' }
    })

    await updateBookingStatus('booking-123', 'mark_paid')

    expect(mockUpdate).toHaveBeenCalledWith({ payment_status: 'paid', status: 'confirmed' })
    expect(mockEq).toHaveBeenCalledWith('id', 'booking-123')
  })

  it('cancels booking successfully', async () => {
    mockAuthGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    
    // Mock finding the booking
    mockSingle.mockResolvedValueOnce({
      data: { location_pages: { locations: { organization_id: 'org-1' } } }
    })
    
    // Mock authorization (is owner)
    mockSingle.mockResolvedValueOnce({
      data: { role: 'owner' }
    })

    await updateBookingStatus('booking-123', 'cancel')

    expect(mockUpdate).toHaveBeenCalledWith({ status: 'cancelled' })
    expect(mockEq).toHaveBeenCalledWith('id', 'booking-123')
  })
})
