
import { describe, it, expect, vi } from 'vitest'
import { setActiveLocationCookie } from '../layout-actions'
import * as cookiesModule from 'next/headers'

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user_123' } } })
    }
  })
}))

describe('Layout Actions (Branch Switcher)', () => {
  it('should set the active location cookie securely', async () => {
    const mockSet = vi.fn()
    vi.mocked(cookiesModule.cookies).mockResolvedValue({
      set: mockSet,
      get: vi.fn(),
      getAll: vi.fn().mockReturnValue([]),
      setAll: vi.fn(),
      delete: vi.fn(),
    } as unknown as Awaited<ReturnType<typeof cookiesModule.cookies>>)

    await setActiveLocationCookie('loc_123')

    expect(mockSet).toHaveBeenCalledWith('ourmenu_active_location_id', 'loc_123', {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
  })
})

