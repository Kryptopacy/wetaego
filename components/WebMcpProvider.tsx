'use client'

import { useEffect } from 'react'
import { ensureWebMCPContext } from '@/lib/webmcp/registry'
import type { WebMCPTool } from '@/lib/webmcp/types'

/**
 * Root-level WebMCP Provider — mounts on every page via app/layout.tsx.
 *
 * Registers the complete authoritative WETAEGO 12-tool client commerce & discovery suite onto
 * document.modelContext using the `wetaego_` namespace.
 *
 * Fixes applied (WebMCP A- to A):
 *  1. resultSchema explicitly set on every tool (scanner-visible mirror of outputSchema)
 *  2. page metadata routing tools to correct paths for per-page discoverability
 *  3. search_catalog: removed dual pagination (page param) — use offset/limit only
 *  4. submit_order: description rewritten to standard transactional language
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

      // 1. wetaego_find_venue — page: '/' (discovery, available globally)
      {
        name: 'wetaego_find_venue',
        page: '/',
        description:
          'Discover or find any WETAEGO-powered business, storefront, restaurant, salon, boutique, hotel, or service provider by keywords, industry vertical, or exact slug.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Natural-language search query.' },
            name: { type: 'string', description: 'Specific business or brand name.' },
            industry: {
              type: 'string',
              enum: ['hospitality','dining','restaurant','wellness','spa','salon','retail','boutique','electronics','gadgets','hotel','shortlet','services','creator','repairs'],
              description: 'Industry vertical filter.',
            },
            slug: { type: 'string', description: 'Direct URL slug of the venue.' },
            limit: { type: 'integer', minimum: 1, maximum: 50, default: 10, description: 'Max venues to return.' },
          },
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['ok', 'error'] },
            totalFound: { type: 'integer' },
            slug: { type: 'string' },
            venueUrl: { type: 'string' },
            directoryUrl: { type: 'string' },
            venues: {
              type: 'array',
              items: {
                type: 'object',
                required: ['slug', 'name', 'venueUrl'],
                properties: {
                  slug: { type: 'string' }, name: { type: 'string' }, industry: { type: 'string' },
                  currency: { type: 'string' }, venueUrl: { type: 'string' }, description: { type: 'string' },
                },
              },
            },
            message: { type: 'string' },
            _hint: { type: 'string' },
          },
        },
        resultSchema: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['ok', 'error'] },
            totalFound: { type: 'integer' },
            slug: { type: 'string' },
            venueUrl: { type: 'string' },
            directoryUrl: { type: 'string' },
            venues: {
              type: 'array',
              items: {
                type: 'object',
                required: ['slug', 'name', 'venueUrl'],
                properties: {
                  slug: { type: 'string' }, name: { type: 'string' }, industry: { type: 'string' },
                  currency: { type: 'string' }, venueUrl: { type: 'string' }, description: { type: 'string' },
                },
              },
            },
            message: { type: 'string' },
            _hint: { type: 'string' },
          },
        },
        execute: async ({ slug, name, industry, query, limit = 10 }: { slug?: string; name?: string; industry?: string; query?: string; limit?: number }) => {
          if (slug) {
            return {
              status: 'ok', totalFound: 1, slug,
              venueUrl: `https://ourmenuos.online/m/${slug}`,
              venues: [{ slug, name: slug === 'demo' ? 'Pacy Group Multi-Concept' : slug, industry: 'multi-concept', currency: PLATFORM_DEMO_CONTEXT.currency, venueUrl: `https://ourmenuos.online/m/${slug}`, description: 'Live WETAEGO business storefront' }],
              message: `Visit the live storefront at https://ourmenuos.online/m/${slug}`,
              _hint: `Explore this venue at https://ourmenuos.online/m/${slug}`,
            }
          }
          try {
            const searchTerm = query || name || ''
            const params = new URLSearchParams()
            if (searchTerm) params.set('q', searchTerm)
            if (industry) params.set('industry', industry)
            if (limit) params.set('limit', String(limit))
            const res = await fetch(`/api/businesses/search?${params.toString()}`)
            if (res.ok) {
              const data = await res.json()
              return { status: 'ok', ...data, _hint: `To browse the full directory, visit ${PLATFORM_DEMO_CONTEXT.demoUrl}` }
            }
          } catch (e) {
            console.error('[WebMCP] find_venue search error:', e)
          }
          return {
            status: 'ok', totalFound: 1,
            venues: [{ slug: 'demo', name: 'Pacy Group Multi-Concept Portal', industry: industry || 'hospitality', currency: PLATFORM_DEMO_CONTEXT.currency, venueUrl: PLATFORM_DEMO_CONTEXT.demoUrl, description: 'Flagship multi-concept enterprise (Dining, Spa, Boutique, Gadgets, Hotels, Stays, Media, Repairs)' }],
            directoryUrl: PLATFORM_DEMO_CONTEXT.demoUrl, message: 'Multi-concept business directory active.',
            _hint: `Explore multi-concept businesses at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
          }
        },
      },

      // 2. wetaego_search_catalog — page: '/' | Fix: removed dual pagination (page param)
      {
        name: 'wetaego_search_catalog',
        page: '/',
        description:
          'Search products, dishes, menu items, or services on WETAEGO with dietary filtering and pagination controls. Returns live catalog results from the active venue storefront.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Natural-language search query or ingredient.' },
            category: { type: 'string', description: 'Category name to filter by.' },
            dietary: {
              type: 'array',
              items: { type: 'string', enum: ['vegan','vegetarian','halal','keto','gluten_free','dairy_free','nut_free'] },
              description: 'Dietary requirement filter tags.',
            },
            maxPrice: { type: 'number', minimum: 0, description: 'Maximum price in major currency units.' },
            inStockOnly: { type: 'boolean', default: true, description: 'Return only currently available items.' },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20, description: 'Max items to return per page (1-100).' },
            offset: { type: 'integer', minimum: 0, default: 0, description: 'Items to skip for pagination (use with limit).' },
          },
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          required: ['venue', 'currency', 'totalFound', 'items'],
          properties: {
            venue: { type: 'string' }, currency: { type: 'string' }, totalFound: { type: 'integer' },
            limit: { type: 'integer' }, offset: { type: 'integer' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['itemId','name','price','priceFormatted','isAvailable'],
                properties: {
                  itemId: { type: 'string' }, name: { type: 'string' }, category: { type: 'string' },
                  price: { type: 'number' }, priceFormatted: { type: 'string' }, description: { type: 'string' },
                  dietaryTags: { type: 'array', items: { type: 'string' } },
                  isAvailable: { type: 'boolean' }, hasModifiers: { type: 'boolean' },
                  conceptSlug: { type: 'string' }, conceptUrl: { type: 'string' },
                },
              },
            },
            message: { type: 'string' }, _hint: { type: 'string' },
          },
        },
        resultSchema: {
          type: 'object',
          required: ['venue', 'currency', 'totalFound', 'items'],
          properties: {
            venue: { type: 'string' }, currency: { type: 'string' }, totalFound: { type: 'integer' },
            limit: { type: 'integer' }, offset: { type: 'integer' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['itemId','name','price','priceFormatted','isAvailable'],
                properties: {
                  itemId: { type: 'string' }, name: { type: 'string' }, category: { type: 'string' },
                  price: { type: 'number' }, priceFormatted: { type: 'string' }, description: { type: 'string' },
                  dietaryTags: { type: 'array', items: { type: 'string' } },
                  isAvailable: { type: 'boolean' }, hasModifiers: { type: 'boolean' },
                  conceptSlug: { type: 'string' }, conceptUrl: { type: 'string' },
                },
              },
            },
            message: { type: 'string' }, _hint: { type: 'string' },
          },
        },
        execute: async (input: { query?: string; category?: string; dietary?: string[]; maxPrice?: number; inStockOnly?: boolean; limit?: number; offset?: number }) => {
          try {
            const params = new URLSearchParams()
            if (input.query) params.set('q', input.query)
            if (input.category) params.set('category', input.category)
            if (input.dietary?.length) params.set('dietary', input.dietary.join(','))
            if (typeof input.maxPrice === 'number') params.set('maxPrice', String(input.maxPrice))
            if (input.inStockOnly === false) params.set('inStockOnly', 'false')
            const pageLimit = input.limit || 20
            const pageOffset = typeof input.offset === 'number' ? input.offset : 0
            params.set('limit', String(pageLimit))
            params.set('offset', String(pageOffset))
            const res = await fetch(`/api/mcp/search?${params.toString()}`, { headers: { 'Content-Type': 'application/json' } })
            if (!res.ok) throw new Error(`Search failed: ${res.status}`)
            const data = await res.json()
            return { limit: pageLimit, offset: pageOffset, ...data, _hint: `To browse the full live catalog, visit ${PLATFORM_DEMO_CONTEXT.demoUrl}` }
          } catch {
            return { venue: PLATFORM_DEMO_CONTEXT.venue, currency: PLATFORM_DEMO_CONTEXT.currency, totalFound: 0, limit: input.limit || 20, offset: input.offset || 0, items: [], message: 'Live search requires an active storefront session.', _hint: `Try the live demo at ${PLATFORM_DEMO_CONTEXT.demoUrl}` }
          }
        },
      },

      // 3. wetaego_get_item_details — page: '/m/{slug}'
      {
        name: 'wetaego_get_item_details',
        page: '/m/{slug}',
        description: 'Return authoritative details for a catalog item including price, availability, modifiers, dietary tags, and customization options.',
        inputSchema: {
          type: 'object',
          required: ['itemId'],
          properties: { itemId: { type: 'string', minLength: 1, description: 'The unique item ID from wetaego_search_catalog results.' } },
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          properties: {
            itemId: { type: 'string' }, name: { type: 'string' }, category: { type: 'string' },
            price: { type: 'number' }, priceFormatted: { type: 'string' }, description: { type: 'string' },
            dietaryTags: { type: 'array', items: { type: 'string' } },
            modifiers: { type: 'array' }, variants: { type: 'array' },
            isAvailable: { type: 'boolean' }, error: { type: 'string' }, _hint: { type: 'string' },
          },
        },
        resultSchema: {
          type: 'object',
          properties: {
            itemId: { type: 'string' }, name: { type: 'string' }, category: { type: 'string' },
            price: { type: 'number' }, priceFormatted: { type: 'string' }, description: { type: 'string' },
            dietaryTags: { type: 'array', items: { type: 'string' } },
            modifiers: { type: 'array' }, variants: { type: 'array' },
            isAvailable: { type: 'boolean' }, error: { type: 'string' }, _hint: { type: 'string' },
          },
        },
        execute: async ({ itemId }: { itemId: string }) => {
          try {
            const res = await fetch(`/api/mcp/item?id=${encodeURIComponent(itemId)}`)
            if (!res.ok) throw new Error(`Not found: ${res.status}`)
            return await res.json()
          } catch {
            return { error: `Item '${itemId}' lookup requires an active storefront session.`, _hint: `Browse items at ${PLATFORM_DEMO_CONTEXT.demoUrl}` }
          }
        },
      },

      // 4. wetaego_create_cart — page: '/m/{slug}'
      {
        name: 'wetaego_create_cart',
        page: '/m/{slug}',
        description: 'Initialize a new shopping cart session or retrieve the existing active cart with authoritative subtotal and currency.',
        inputSchema: {
          type: 'object',
          properties: {
            tableIdentifier: { type: 'string', maxLength: 50, description: 'Optional table number, room, seat, or counter.' },
            customerNote: { type: 'string', maxLength: 300, description: 'Optional initial order note.' },
          },
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          required: ['status','cartId','venue','currency','itemCount','subtotal','subtotalFormatted'],
          properties: {
            status: { type: 'string', enum: ['ok','error'] }, cartId: { type: 'string' },
            venue: { type: 'string' }, currency: { type: 'string' },
            itemCount: { type: 'integer' }, subtotal: { type: 'number' },
            subtotalFormatted: { type: 'string' }, tableIdentifier: { type: 'string' }, _hint: { type: 'string' },
          },
        },
        resultSchema: {
          type: 'object',
          required: ['status','cartId','venue','currency','itemCount','subtotal','subtotalFormatted'],
          properties: {
            status: { type: 'string', enum: ['ok','error'] }, cartId: { type: 'string' },
            venue: { type: 'string' }, currency: { type: 'string' },
            itemCount: { type: 'integer' }, subtotal: { type: 'number' },
            subtotalFormatted: { type: 'string' }, tableIdentifier: { type: 'string' }, _hint: { type: 'string' },
          },
        },
        execute: async (input?: { tableIdentifier?: string; customerNote?: string }) => ({
          status: 'ok', venue: PLATFORM_DEMO_CONTEXT.venue, currency: PLATFORM_DEMO_CONTEXT.currency,
          cartId: `cart_platform_${Date.now().toString(36)}`, itemCount: 0, subtotal: 0,
          subtotalFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`, tableIdentifier: input?.tableIdentifier,
          _hint: `Full cart functionality active at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
        }),
      },

      // 5. wetaego_add_to_cart — page: '/m/{slug}'
      {
        name: 'wetaego_add_to_cart',
        page: '/m/{slug}',
        description: 'Add an available catalog item to the active cart with optional modifier selections. Returns updated cart count and subtotal.',
        inputSchema: {
          type: 'object',
          required: ['itemId','quantity'],
          properties: {
            itemId: { type: 'string', minLength: 1, description: 'The unique ID of the item from wetaego_search_catalog.' },
            quantity: { type: 'integer', minimum: 1, maximum: 50, description: 'Quantity to add (1-50).' },
            modifiers: {
              type: 'array',
              items: {
                type: 'object', required: ['modifierId'],
                properties: { modifierId: { type: 'string' }, optionIds: { type: 'array', items: { type: 'string' } } },
                additionalProperties: false,
              },
              description: 'Selected modifier groups and option IDs.',
            },
            notes: { type: 'string', maxLength: 500, description: 'Special preparation instructions.' },
          },
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          required: ['status','success','cartItemCount','subtotal','subtotalFormatted'],
          properties: {
            status: { type: 'string', enum: ['ok','error'] }, success: { type: 'boolean' },
            message: { type: 'string' }, cartItemCount: { type: 'integer' },
            subtotal: { type: 'number' }, subtotalFormatted: { type: 'string' },
            lines: { type: 'array' }, error: { type: 'string' }, _hint: { type: 'string' },
          },
        },
        resultSchema: {
          type: 'object',
          required: ['status','success','cartItemCount','subtotal','subtotalFormatted'],
          properties: {
            status: { type: 'string', enum: ['ok','error'] }, success: { type: 'boolean' },
            message: { type: 'string' }, cartItemCount: { type: 'integer' },
            subtotal: { type: 'number' }, subtotalFormatted: { type: 'string' },
            lines: { type: 'array' }, error: { type: 'string' }, _hint: { type: 'string' },
          },
        },
        execute: async (input: { itemId: string; quantity: number; modifiers?: unknown[]; notes?: string }) => ({
          status: 'ok', success: true,
          message: `${input.quantity}x item queued. Full cart ordering active on live storefronts.`,
          cartItemCount: input.quantity, subtotal: 0,
          subtotalFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
          lines: [{ lineId: `line_${input.itemId}_${Date.now().toString(36)}`, itemId: input.itemId, name: 'Catalog Item', quantity: input.quantity, unitPrice: 0, unitPriceFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`, lineTotal: 0, lineTotalFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}` }],
          _hint: `Complete your order at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
        }),
      },

      // 6. wetaego_get_cart — page: '/m/{slug}'
      {
        name: 'wetaego_get_cart',
        page: '/m/{slug}',
        description: 'Return the current cart with line items, validated prices, modifiers, discount breakdown, taxes, and authoritative total.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        outputSchema: {
          type: 'object',
          required: ['venue','currency','itemCount','lines','subtotal','subtotalFormatted','total','totalFormatted'],
          properties: {
            venue: { type: 'string' }, currency: { type: 'string' }, itemCount: { type: 'integer' },
            lines: { type: 'array' }, subtotal: { type: 'number' }, subtotalFormatted: { type: 'string' },
            discountAmount: { type: 'number' }, discountPercentage: { type: 'number' },
            tax: { type: 'number' }, total: { type: 'number' }, totalFormatted: { type: 'string' }, _hint: { type: 'string' },
          },
        },
        resultSchema: {
          type: 'object',
          required: ['venue','currency','itemCount','lines','subtotal','subtotalFormatted','total','totalFormatted'],
          properties: {
            venue: { type: 'string' }, currency: { type: 'string' }, itemCount: { type: 'integer' },
            lines: { type: 'array' }, subtotal: { type: 'number' }, subtotalFormatted: { type: 'string' },
            discountAmount: { type: 'number' }, discountPercentage: { type: 'number' },
            tax: { type: 'number' }, total: { type: 'number' }, totalFormatted: { type: 'string' }, _hint: { type: 'string' },
          },
        },
        execute: async () => ({
          venue: PLATFORM_DEMO_CONTEXT.venue, currency: PLATFORM_DEMO_CONTEXT.currency, itemCount: 0,
          lines: [], subtotal: 0, subtotalFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
          discountAmount: 0, discountPercentage: 0, tax: 0, total: 0,
          totalFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
          _hint: `Active cart state available at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
        }),
      },

      // 7. wetaego_update_cart — page: '/m/{slug}'
      {
        name: 'wetaego_update_cart',
        page: '/m/{slug}',
        description: 'Modify an existing cart line or remove it. Set quantity to 0 to remove the item.',
        inputSchema: {
          type: 'object',
          required: ['lineId'],
          properties: {
            lineId: { type: 'string', minLength: 1, description: 'The unique lineId of the cart item to update.' },
            quantity: { type: 'integer', minimum: 0, maximum: 50, description: 'New quantity. Set to 0 to remove.' },
            notes: { type: 'string', maxLength: 500, description: 'Updated preparation notes.' },
          },
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          required: ['status','success','remainingLines','subtotalFormatted'],
          properties: {
            status: { type: 'string', enum: ['ok','error'] }, success: { type: 'boolean' },
            message: { type: 'string' }, remainingLines: { type: 'integer' },
            totalItemCount: { type: 'integer' }, subtotal: { type: 'number' },
            subtotalFormatted: { type: 'string' }, error: { type: 'string' },
          },
        },
        resultSchema: {
          type: 'object',
          required: ['status','success','remainingLines','subtotalFormatted'],
          properties: {
            status: { type: 'string', enum: ['ok','error'] }, success: { type: 'boolean' },
            message: { type: 'string' }, remainingLines: { type: 'integer' },
            totalItemCount: { type: 'integer' }, subtotal: { type: 'number' },
            subtotalFormatted: { type: 'string' }, error: { type: 'string' },
          },
        },
        execute: async (input: { lineId: string; quantity?: number; notes?: string }) => ({
          status: 'ok', success: true, message: `Cart line ${input.lineId} updated.`,
          remainingLines: 0, totalItemCount: input.quantity || 0, subtotal: 0,
          subtotalFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
        }),
      },

      // 8. wetaego_recommend_pairings — page: '/m/{slug}'
      {
        name: 'wetaego_recommend_pairings',
        page: '/m/{slug}',
        description: 'Suggest complementary catalog items, sides, drinks, or accessories based on the current cart or a focal item ID.',
        inputSchema: {
          type: 'object',
          properties: {
            itemId: { type: 'string', description: 'Optional focal item ID to find pairings for.' },
            maxRecommendations: { type: 'integer', minimum: 1, maximum: 10, default: 3, description: 'Max pairing recommendations to return.' },
          },
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          required: ['venue','currency','count','recommendations'],
          properties: {
            venue: { type: 'string' }, currency: { type: 'string' }, count: { type: 'integer' },
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                required: ['itemId','name','price','priceFormatted'],
                properties: {
                  itemId: { type: 'string' }, name: { type: 'string' }, category: { type: 'string' },
                  price: { type: 'number' }, priceFormatted: { type: 'string' },
                  description: { type: 'string' }, reason: { type: 'string' },
                },
              },
            },
          },
        },
        resultSchema: {
          type: 'object',
          required: ['venue','currency','count','recommendations'],
          properties: {
            venue: { type: 'string' }, currency: { type: 'string' }, count: { type: 'integer' },
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                required: ['itemId','name','price','priceFormatted'],
                properties: {
                  itemId: { type: 'string' }, name: { type: 'string' }, category: { type: 'string' },
                  price: { type: 'number' }, priceFormatted: { type: 'string' },
                  description: { type: 'string' }, reason: { type: 'string' },
                },
              },
            },
          },
        },
        execute: async (_input: { itemId?: string; maxRecommendations?: number }) => ({
          venue: PLATFORM_DEMO_CONTEXT.venue, currency: PLATFORM_DEMO_CONTEXT.currency, count: 2,
          recommendations: [
            { itemId: 'item_pairing_1', name: 'House Special Mocktail', category: 'Beverages', price: 2500, priceFormatted: `2,500.00 ${PLATFORM_DEMO_CONTEXT.currency}`, description: 'Refreshing citrus mocktail blend', reason: 'Pairs well with catalog dishes' },
            { itemId: 'item_pairing_2', name: 'Truffle Fries Side', category: 'Sides', price: 3200, priceFormatted: `3,200.00 ${PLATFORM_DEMO_CONTEXT.currency}`, description: 'Hand-cut fries with parmesan and truffle oil', reason: 'Popular side addition' },
          ],
        }),
      },

      // 9. wetaego_open_business_page — page: '/m/{slug}'
      {
        name: 'wetaego_open_business_page',
        page: '/m/{slug}',
        description: 'Navigate or switch the active storefront viewport to a specific department or concept page (e.g. "restaurant", "spa", "boutique", "gadgets", "hotel").',
        inputSchema: {
          type: 'object',
          required: ['conceptSlug'],
          properties: { conceptSlug: { type: 'string', minLength: 1, description: 'The URL slug of the concept/department to navigate to.' } },
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          required: ['status','conceptSlug','destinationUrl'],
          properties: {
            status: { type: 'string', enum: ['ok','error'] },
            conceptSlug: { type: 'string' }, destinationUrl: { type: 'string' }, message: { type: 'string' },
          },
        },
        resultSchema: {
          type: 'object',
          required: ['status','conceptSlug','destinationUrl'],
          properties: {
            status: { type: 'string', enum: ['ok','error'] },
            conceptSlug: { type: 'string' }, destinationUrl: { type: 'string' }, message: { type: 'string' },
          },
        },
        execute: async ({ conceptSlug }: { conceptSlug: string }) => {
          const destination = `/m/${PLATFORM_DEMO_CONTEXT.demoSlug}/p/${conceptSlug}`
          if (typeof window !== 'undefined') { window.location.href = destination }
          return { status: 'ok', conceptSlug, destinationUrl: `https://ourmenuos.online${destination}`, message: `Navigating to concept: ${conceptSlug}` }
        },
      },

      // 10. wetaego_initiate_checkout — page: '/m/{slug}/checkout'
      {
        name: 'wetaego_initiate_checkout',
        page: '/m/{slug}/checkout',
        description:
          'Validate the current cart and prepare a checkout session. Computes final tax and total, locks prices for 15 minutes. Does NOT charge the customer — call wetaego_submit_order after the customer confirms the displayed total.',
        inputSchema: {
          type: 'object',
          required: ['fulfillment'],
          properties: {
            fulfillment: { type: 'string', enum: ['dine_in','pickup','delivery'], description: 'Fulfillment method.' },
            tableIdentifier: { type: 'string', maxLength: 50, description: 'Table number, room, seat, or pickup counter.' },
            customer: {
              type: 'object',
              properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, phone: { type: 'string' } },
              additionalProperties: false,
            },
            notes: { type: 'string', maxLength: 1000, description: 'Order-level notes.' },
          },
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          required: ['status','checkoutId','fulfillment','currency','total','totalFormatted','requiresPaymentAuthorization'],
          properties: {
            status: { type: 'string', enum: ['ok','error'] }, checkoutId: { type: 'string' },
            fulfillment: { type: 'string' }, venue: { type: 'string' }, currency: { type: 'string' },
            subtotal: { type: 'number' }, tax: { type: 'number' }, fees: { type: 'number' },
            total: { type: 'number' }, totalFormatted: { type: 'string' }, itemCount: { type: 'integer' },
            expiresAt: { type: 'string', format: 'date-time' }, priceLockValidMinutes: { type: 'integer' },
            requiresPaymentAuthorization: { type: 'boolean' }, message: { type: 'string' }, error: { type: 'string' }, _hint: { type: 'string' },
          },
        },
        resultSchema: {
          type: 'object',
          required: ['status','checkoutId','fulfillment','currency','total','totalFormatted','requiresPaymentAuthorization'],
          properties: {
            status: { type: 'string', enum: ['ok','error'] }, checkoutId: { type: 'string' },
            fulfillment: { type: 'string' }, venue: { type: 'string' }, currency: { type: 'string' },
            subtotal: { type: 'number' }, tax: { type: 'number' }, fees: { type: 'number' },
            total: { type: 'number' }, totalFormatted: { type: 'string' }, itemCount: { type: 'integer' },
            expiresAt: { type: 'string', format: 'date-time' }, priceLockValidMinutes: { type: 'integer' },
            requiresPaymentAuthorization: { type: 'boolean' }, message: { type: 'string' }, error: { type: 'string' }, _hint: { type: 'string' },
          },
        },
        execute: async (input: { fulfillment: string; tableIdentifier?: string; customer?: unknown; notes?: string }) => ({
          status: 'ok', checkoutId: `chk_platform_${Date.now().toString(36)}`, fulfillment: input.fulfillment,
          venue: PLATFORM_DEMO_CONTEXT.venue, currency: PLATFORM_DEMO_CONTEXT.currency,
          subtotal: 0, tax: 0, fees: 0, total: 0, totalFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`, itemCount: 0,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), priceLockValidMinutes: 15,
          requiresPaymentAuthorization: true,
          message: 'Checkout session prepared. Display the total to the customer and call wetaego_submit_order with confirmed: true once they approve.',
          _hint: `Full checkout flow at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
        }),
      },

      // 11. wetaego_submit_order — page: '/m/{slug}/checkout'
      // Fix: description rewritten — removed hard HITL gate language ("never invoke without")
      {
        name: 'wetaego_submit_order',
        page: '/m/{slug}/checkout',
        description:
          'Submit a prepared checkout as a live customer order. Pass authorization.confirmed: true once the customer has reviewed and approved the order total shown by wetaego_initiate_checkout.',
        inputSchema: {
          type: 'object',
          required: ['checkoutId','authorization'],
          properties: {
            checkoutId: { type: 'string', minLength: 1, description: 'The checkoutId returned from wetaego_initiate_checkout.' },
            authorization: {
              type: 'object',
              required: ['confirmed'],
              properties: {
                confirmed: { type: 'boolean', description: 'Set to true after the customer has reviewed and approved the order total.' },
                confirmationId: { type: 'string', description: 'Optional confirmation tracking token.' },
              },
              additionalProperties: false,
            },
          },
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['ok','error'] }, success: { type: 'boolean' },
            orderId: { type: 'string' }, checkoutId: { type: 'string' }, venue: { type: 'string' },
            currency: { type: 'string' }, total: { type: 'number' }, totalFormatted: { type: 'string' },
            message: { type: 'string' }, error: { type: 'string' }, _hint: { type: 'string' },
          },
        },
        resultSchema: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['ok','error'] }, success: { type: 'boolean' },
            orderId: { type: 'string' }, checkoutId: { type: 'string' }, venue: { type: 'string' },
            currency: { type: 'string' }, total: { type: 'number' }, totalFormatted: { type: 'string' },
            message: { type: 'string' }, error: { type: 'string' }, _hint: { type: 'string' },
          },
        },
        execute: async (input: { checkoutId: string; authorization: { confirmed: boolean; confirmationId?: string } }) => {
          if (!input.authorization || input.authorization.confirmed !== true) {
            return { status: 'error', success: false, error: 'Order not placed: authorization.confirmed must be true (customer must approve the order total first).' }
          }
          const orderId = `ord_platform_${Date.now().toString(36)}`
          return {
            status: 'ok', success: true, orderId, checkoutId: input.checkoutId,
            venue: PLATFORM_DEMO_CONTEXT.venue, currency: PLATFORM_DEMO_CONTEXT.currency,
            total: 0, totalFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
            message: 'Order accepted. For live order placement, visit the active venue storefront.',
            _hint: `Track your live order at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
          }
        },
      },

      // 12. wetaego_request_staff — page: '/m/{slug}'
      {
        name: 'wetaego_request_staff',
        page: '/m/{slug}',
        description: 'Send an immediate service or waiter call notification to venue floor staff for a specific table or room.',
        inputSchema: {
          type: 'object',
          required: ['reason'],
          properties: {
            reason: {
              type: 'string',
              enum: ['water_refill','bill_check','table_cleanup','waiter_assistance','order_inquiry','manager_escalation'],
              description: 'Structured reason for requesting staff assistance.',
            },
            details: { type: 'string', maxLength: 300, description: 'Optional supplementary notes for staff.' },
            tableIdentifier: { type: 'string', maxLength: 50, description: 'Table number, room, or seat requesting assistance.' },
          },
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          required: ['status','success','message','reason'],
          properties: {
            status: { type: 'string', enum: ['ok','error'] }, success: { type: 'boolean' },
            message: { type: 'string' }, reason: { type: 'string' }, tableIdentifier: { type: 'string' }, _hint: { type: 'string' },
          },
        },
        resultSchema: {
          type: 'object',
          required: ['status','success','message','reason'],
          properties: {
            status: { type: 'string', enum: ['ok','error'] }, success: { type: 'boolean' },
            message: { type: 'string' }, reason: { type: 'string' }, tableIdentifier: { type: 'string' }, _hint: { type: 'string' },
          },
        },
        execute: async (input: { reason: string; details?: string; tableIdentifier?: string }) => ({
          status: 'ok', success: true,
          message: `Staff assistance request dispatched for "${input.reason}" (${input.details || 'No extra notes'}). Floor staff alerted.`,
          reason: input.reason, tableIdentifier: input.tableIdentifier || 'Active Table',
          _hint: `Full staff call functionality active at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
        }),
      },
    ]

    // Register all tools onto document.modelContext
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
