import { describe, it, expect, vi } from 'vitest'
import { POST } from '../route'
import * as ai from 'ai'
  
import { NextResponse } from 'next/server'

vi.mock('ai', () => ({
  generateText: vi.fn(),
}))

vi.mock('@ai-sdk/google', () => ({
  google: vi.fn(),
}))

describe('Generate Content API', () => {
  it('returns 400 if title is missing', async () => {
    const req = new Request('http://localhost/api/ai/generate-content', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    
    const data = await res.json()
    expect(data.error).toBe('Invalid payload')
  })

  it('calls generateText with correct parameters', async () => {

    vi.mocked(ai.generateText).mockResolvedValueOnce({ text: 'A premium description.' } as any)

    const req = new Request('http://localhost/api/ai/generate-content', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Truffle Fries',
        businessTypePreset: 'restaurant',
        templateType: 'catalog'
      }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(data.text).toBe('A premium description.')
    expect(ai.generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining('The business is a restaurant'),
        prompt: 'Item Title: Truffle Fries',
      })
    )
  })
})
