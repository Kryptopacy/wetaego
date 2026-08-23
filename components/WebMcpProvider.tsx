'use client'

import { useEffect } from 'react'

declare global {
  interface Navigator {
    modelContext?: {
      provideContext: (context: {
        tools?: Array<{
          name: string
          description: string
          inputSchema: Record<string, unknown>
          execute: (args: Record<string, unknown>) => Promise<unknown> | unknown
        }>
      }) => void
    }
  }
}

export function WebMcpProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Safely check for WebMCP API availability in browser
    if (typeof navigator !== 'undefined' && navigator.modelContext && typeof navigator.modelContext.provideContext === 'function') {
      try {
        navigator.modelContext.provideContext({
          tools: [
            {
              name: 'ourmenu_search_catalog',
              description: 'Search products, menu items, or dishes on OurMenu OS with dietary filtering.',
              inputSchema: {
                type: 'object',
                properties: {
                  query: { type: 'string', description: 'Search term or ingredient' },
                  dietary: { type: 'string', enum: ['vegan', 'halal', 'gluten_free', 'nut_free', 'keto'] }
                },
                required: ['query']
              },
              execute: async ({ query, dietary }) => {
                try {
                  const res = await fetch(`/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      messages: [{ role: 'user', content: `Find items matching: ${query} (dietary: ${dietary || 'any'})` }]
                    })
                  })
                  return { status: 'ok', query, response: await res.text() }
                } catch (err: unknown) {
                  return { status: 'error', message: err instanceof Error ? err.message : 'Lookup failed' }
                }
              }
            },
            {
              name: 'ourmenu_find_venue',
              description: 'Find physical store or restaurant by slug or location.',
              inputSchema: {
                type: 'object',
                properties: {
                  slug: { type: 'string', description: 'Venue URL slug' }
                },
                required: ['slug']
              },
              execute: async ({ slug }) => {
                return {
                  status: 'ok',
                  venueUrl: `https://ourmenuos.online/m/${slug}`
                }
              }
            },
            {
              name: 'ourmenu_payment_roulette',
              description: 'Launch or get status of interactive Payment Roulette bill splitting game.',
              inputSchema: {
                type: 'object',
                properties: {
                  players: { type: 'array', items: { type: 'string' } }
                }
              },
              execute: async ({ players }) => {
                const list = (players as string[]) || ['Player 1', 'Player 2']
                const selected = list[Math.floor(Math.random() * list.length)]
                return {
                  status: 'ok',
                  toolUrl: 'https://ourmenuos.online/tools/who-pays-the-bill',
                  selectedPayer: selected
                }
              }
            }
          ]
        })
      } catch (err) {
        console.debug('WebMCP provideContext initialization notice:', err)
      }
    }
  }, [])

  return null
}
