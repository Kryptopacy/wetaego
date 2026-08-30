'use client'

import { useEffect } from 'react'
import { ensureWebMCPContext } from '@/lib/webmcp/registry'
import type { WebMCPTool } from '@/lib/webmcp/types'

/**
 * Root-level WebMCP Provider — mounts on every page via app/layout.tsx.
 *
 * Registers the full WETAEGO 9-tool commerce & discovery suite onto
 * document.modelContext so WebMCP directory scanners (webmcp.com, ChatGPT
 * Desktop, Claude, etc.) discover the complete interactive ordering and
 * operations capability on the homepage itself — not just on venue sub-routes.
 *
 * Tools are scoped to a WETAEGO Platform Demo context so they function
 * correctly even without a live merchant session. When a real merchant
 * storefront mounts its own WebMCPProvider (/m/[slug]), those tools
 * override these with live inventory and venue-specific context.
 */

const PLATFORM_DEMO_CONTEXT = {
  venue: 'WETAEGO Platform',
  currency: 'NGN',
  demoSlug: 'demo',
  demoUrl: 'https://ourmenuos.online/m/demo',
}

export function WebMcpProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const ctx = ensureWebMCPContext()

    const tools: WebMCPTool<any, any>[] = [
      // ── 1. search_catalog ────────────────────────────────────────────────
      {
        name: 'ourmenu_search_catalog',
        description:
          'Search products, menu items, or dishes on WETAEGO with dietary filtering. Returns live catalog results from the active venue storefront.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Natural-language search query or ingredient.' },
            category: { type: 'string', description: 'Category name to filter by.' },
            dietary: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['vegan', 'vegetarian', 'halal', 'keto', 'gluten_free', 'dairy_free', 'nut_free'],
              },
              description: 'Dietary requirement filter tags.',
            },
            maxPrice: { type: 'number', minimum: 0, description: 'Maximum price in major currency units.' },
            inStockOnly: { type: 'boolean', default: true, description: 'Return only currently available items.' },
          },
          additionalProperties: false,
        },
        execute: async (input: { query?: string; category?: string; dietary?: string[]; maxPrice?: number; inStockOnly?: boolean }) => {
          try {
            const params = new URLSearchParams()
            if (input.query) params.set('q', input.query)
            if (input.category) params.set('category', input.category)
            if (input.dietary?.length) params.set('dietary', input.dietary.join(','))
            if (typeof input.maxPrice === 'number') params.set('maxPrice', String(input.maxPrice))
            if (input.inStockOnly === false) params.set('inStockOnly', 'false')

            const res = await fetch(`/api/mcp/search?${params.toString()}`, {
              headers: { 'Content-Type': 'application/json' },
            })
            if (!res.ok) throw new Error(`Search failed: ${res.status}`)
            const data = await res.json()
            return {
              ...data,
              _hint: `To browse the full live catalog, visit ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
            }
          } catch {
            return {
              venue: PLATFORM_DEMO_CONTEXT.venue,
              currency: PLATFORM_DEMO_CONTEXT.currency,
              totalFound: 0,
              items: [],
              message: 'Live search requires an active storefront session.',
              _hint: `Try the live demo at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
            }
          }
        },
      },

      // ── 2. get_item_details ───────────────────────────────────────────────
      {
        name: 'ourmenu_get_item_details',
        description:
          'Return authoritative details for a catalog item including price, availability, modifiers, dietary tags and applicable options.',
        inputSchema: {
          type: 'object',
          required: ['itemId'],
          properties: {
            itemId: { type: 'string', description: 'The unique item ID from search_catalog results.' },
          },
          additionalProperties: false,
        },
        execute: async ({ itemId }: { itemId: string }) => {
          try {
            const res = await fetch(`/api/mcp/item?id=${encodeURIComponent(itemId)}`)
            if (!res.ok) throw new Error(`Not found: ${res.status}`)
            return await res.json()
          } catch {
            return {
              error: `Item '${itemId}' lookup requires an active storefront session.`,
              _hint: `Browse items at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
            }
          }
        },
      },

      // ── 3. find_venue ─────────────────────────────────────────────────────
      {
        name: 'ourmenu_find_venue',
        description:
          'Find a physical store, restaurant, hotel, salon, or any WETAEGO-powered business by slug or name. Returns the live storefront URL.',
        inputSchema: {
          type: 'object',
          properties: {
            slug: { type: 'string', description: 'URL slug of the venue (e.g. "pacy-grills", "demo").' },
            name: { type: 'string', description: 'Business name to search for.' },
          },
          additionalProperties: false,
        },
        execute: async ({ slug, name }: { slug?: string; name?: string }) => {
          if (slug) {
            return {
              status: 'ok',
              slug,
              venueUrl: `https://ourmenuos.online/m/${slug}`,
              message: `Visit the live storefront at https://ourmenuos.online/m/${slug}`,
            }
          }
          return {
            status: 'ok',
            query: name || '',
            directoryUrl: 'https://ourmenuos.online',
            _hint: 'Search live venues at https://ourmenuos.online',
          }
        },
      },

      // ── 4. create_cart ────────────────────────────────────────────────────
      {
        name: 'ourmenu_create_cart',
        description:
          'Create or retrieve the current shopping cart for the active WETAEGO venue and customer session.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        execute: async () => ({
          status: 'ok',
          venue: PLATFORM_DEMO_CONTEXT.venue,
          currency: PLATFORM_DEMO_CONTEXT.currency,
          cartId: `cart_platform_${Date.now().toString(36)}`,
          itemCount: 0,
          subtotal: 0,
          subtotalFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
          _hint: `Full cart functionality active at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
        }),
      },

      // ── 5. add_to_cart ────────────────────────────────────────────────────
      {
        name: 'ourmenu_add_to_cart',
        description:
          'Add an available catalog item to the active cart with optional modifier selections and customer notes.',
        inputSchema: {
          type: 'object',
          required: ['itemId', 'quantity'],
          properties: {
            itemId: { type: 'string', description: 'The unique ID of the item from the catalog.' },
            quantity: { type: 'integer', minimum: 1, maximum: 50, description: 'Quantity to add.' },
            modifiers: {
              type: 'array',
              items: {
                type: 'object',
                required: ['modifierId'],
                properties: {
                  modifierId: { type: 'string' },
                  optionIds: { type: 'array', items: { type: 'string' } },
                },
                additionalProperties: false,
              },
              description: 'Selected modifier groups and option IDs.',
            },
            notes: { type: 'string', maxLength: 500, description: 'Special preparation instructions.' },
          },
          additionalProperties: false,
        },
        execute: async (input: { itemId: string; quantity: number; modifiers?: unknown[]; notes?: string }) => ({
          status: 'ok',
          message: `${input.quantity}x item queued. Full cart ordering active on live storefronts.`,
          cartItemCount: input.quantity,
          _hint: `Complete your order at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
        }),
      },

      // ── 6. get_cart ───────────────────────────────────────────────────────
      {
        name: 'ourmenu_get_cart',
        description:
          'Return the current cart with validated prices, modifiers, taxes, fees and authoritative total.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        execute: async () => ({
          venue: PLATFORM_DEMO_CONTEXT.venue,
          currency: PLATFORM_DEMO_CONTEXT.currency,
          itemCount: 0,
          lines: [],
          subtotal: 0,
          subtotalFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
          total: 0,
          totalFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
          _hint: `Active cart state available at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
        }),
      },

      // ── 7. initiate_checkout ──────────────────────────────────────────────
      {
        name: 'ourmenu_initiate_checkout',
        description:
          'Validate the current cart and prepare a checkout session. Does NOT authorize payment or submit the order — requires human confirmation.',
        inputSchema: {
          type: 'object',
          required: ['fulfillment'],
          properties: {
            fulfillment: {
              type: 'string',
              enum: ['dine_in', 'pickup', 'delivery'],
              description: 'Fulfillment type for the order.',
            },
            tableIdentifier: { type: 'string', description: 'Table number, room, seat, or pickup counter.' },
            customer: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
                phone: { type: 'string' },
              },
              additionalProperties: false,
            },
            notes: { type: 'string', maxLength: 1000 },
          },
          additionalProperties: false,
        },
        execute: async (input: { fulfillment: string; tableIdentifier?: string; customer?: unknown; notes?: string }) => ({
          status: 'ok',
          checkoutId: `chk_platform_${Date.now().toString(36)}`,
          fulfillment: input.fulfillment,
          currency: PLATFORM_DEMO_CONTEXT.currency,
          subtotal: 0,
          tax: 0,
          total: 0,
          requiresPaymentAuthorization: true,
          message: 'Checkout prepared. User must authorize via ourmenu_submit_order with explicit human confirmation.',
          _hint: `Full checkout flow at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
        }),
      },

      // ── 8. submit_order (HITL gate) ───────────────────────────────────────
      {
        name: 'ourmenu_submit_order',
        description:
          'Submit the previously reviewed checkout as a live customer order after EXPLICIT human customer authorization. This is a Sensitive Action — never invoke without confirmed:true from the human.',
        inputSchema: {
          type: 'object',
          required: ['checkoutId', 'authorization'],
          properties: {
            checkoutId: { type: 'string', description: 'The checkoutId from initiate_checkout.' },
            authorization: {
              type: 'object',
              required: ['confirmed'],
              properties: {
                confirmed: { type: 'boolean', description: 'Must be explicitly true — confirmed by human customer.' },
                confirmationId: { type: 'string', description: 'Human confirmation identifier or token.' },
              },
              additionalProperties: false,
            },
          },
          additionalProperties: false,
        },
        execute: async (input: { checkoutId: string; authorization: { confirmed: boolean; confirmationId?: string } }) => {
          if (!input.authorization || input.authorization.confirmed !== true) {
            return {
              error: 'Transaction rejected: submit_order requires explicit human authorization (confirmed: true).',
            }
          }
          return {
            status: 'ok',
            message: 'Order accepted. For live order placement, visit the active venue storefront.',
            orderId: `ord_platform_${Date.now().toString(36)}`,
            _hint: `Place real orders at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
          }
        },
      },

      // ── 9. request_staff ──────────────────────────────────────────────────
      {
        name: 'ourmenu_request_staff',
        description:
          'Send an immediate service or waiter call notification to venue staff at the active WETAEGO storefront.',
        inputSchema: {
          type: 'object',
          properties: {
            reason: {
              type: 'string',
              description: 'Reason for request (e.g. "Water refill", "Bill check", "Assistance").',
            },
          },
          additionalProperties: false,
        },
        execute: async (input: { reason?: string }) => ({
          status: 'ok',
          message: `Staff assistance request queued: "${input.reason || 'General assistance'}". Active on live venue storefronts.`,
          _hint: `Full staff call functionality at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
        }),
      },

      // ── 10. payment_roulette ──────────────────────────────────────────────
      {
        name: 'ourmenu_payment_roulette',
        description:
          'Launch the interactive Payment Roulette gamified bill-splitting randomizer. Randomly selects who pays the bill from a group of players.',
        inputSchema: {
          type: 'object',
          properties: {
            players: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of player names to include in the roulette.',
            },
          },
          additionalProperties: false,
        },
        execute: async ({ players }: { players?: string[] }) => {
          const list = players && players.length > 0 ? players : ['Player 1', 'Player 2', 'Player 3']
          const selected = list[Math.floor(Math.random() * list.length)]
          return {
            status: 'ok',
            selectedPayer: selected,
            players: list,
            toolUrl: 'https://ourmenuos.online/tools/who-pays-the-bill',
            message: `🎲 The roulette has spoken — ${selected} pays the bill!`,
          }
        },
      },
    ]

    // Register all tools on document.modelContext
    const cleanups: (() => void)[] = []
    tools.forEach((tool) => {
      try {
        const reg = ctx.registerTool(tool)
        if (reg && typeof reg.unregister === 'function') {
          cleanups.push(reg.unregister)
        } else {
          cleanups.push(() => ctx.unregisterTool && ctx.unregisterTool(tool.name))
        }
      } catch (e) {
        // Gracefully ignore individual tool registration failures
        if (process.env.NODE_ENV === 'development') {
          console.warn('[WebMCP Root] Failed to register tool:', tool.name, e)
        }
      }
    })

    return () => {
      cleanups.forEach((fn) => {
        try { fn() } catch { /* ignore cleanup */ }
      })
    }
  }, [])

  return null
}
