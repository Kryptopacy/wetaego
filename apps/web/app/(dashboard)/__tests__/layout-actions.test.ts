import { describe, it, expect, vi } from 'vitest'
import { setActiveLocation } from '../layout-actions'
import * as cookiesModule from 'next/headers'

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

describe('Layout Actions (Branch Switcher)', () => {
  it('should set the active location cookie securely', async () => {
    const mockSet = vi.fn()
    vi.mocked(cookiesModule.cookies).mockResolvedValue({
      set: mockSet,
    } as any)

    await setActiveLocation('loc_123')

    expect(mockSet).toHaveBeenCalledWith('ourmenu_active_location_id', 'loc_123', {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  })
})
