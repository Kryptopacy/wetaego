import { describe, it, expect, vi } from 'vitest'
import { POST } from '../route'
import * as ai from 'ai'
import * as cookiesModule from 'next/headers'
import * as supabaseServer from '@/lib/supabase/server'

vi.mock('ai', () => ({
  streamText: vi.fn(),
  tool: vi.fn(),
  stepCountIs: vi.fn(),
}))

vi.mock('@ai-sdk/google', () => ({
  google: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('Chat API', () => {
  it('returns 400 if locationId is missing', async () => {
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [] }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid payload')
  })

  it('enforces session rate limits', async () => {
    // Mock cookies to simulate 20 queries already
    vi.mocked(cookiesModule.cookies).mockResolvedValue({
      get: () => ({ value: '20' }),
      set: vi.fn(),
    } as any)

    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [], locationId: '123e4567-e89b-12d3-a456-426614174000' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(429)
    expect(await res.text()).toContain('maximum limit of 20')
  })

  it('rejects if AI is disabled for location', async () => {
    vi.mocked(cookiesModule.cookies).mockResolvedValue({
      get: () => ({ value: '5' }),
      set: vi.fn(),
    } as any)

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ai_enabled: false },
          error: null
        })
      })
    }
    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabase as any)

    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [], locationId: '123e4567-e89b-12d3-a456-426614174000' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(await res.text()).toBe('AI Assistant is disabled for this location')
  })
})
