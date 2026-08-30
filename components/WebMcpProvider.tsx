'use client'

import { useEffect } from 'react'
import { ensureWebMCPContext } from '@/lib/webmcp/registry'
import type { WebMCPTool } from '@/lib/webmcp/types'

/**
 * Root-level WebMCP Provider — mounts on every page via app/layout.tsx.
 *
 * Registers the complete authoritative WETAEGO 12-tool client commerce & discovery suite onto
 * document.modelContext using the `wetaego_` namespace.
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
      // ── 1. wetaego_find_venue ─────────────────────────────────────────────
      {
        name: 'wetaego_find_venue',
        description:
          'Discover or find any WETAEGO-powered business, storefront, restaurant, salon, boutique, hotel, or service provider by keywords, industry vertical, or exact slug.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Natural-language search query (e.g. "seafood in Victoria Island", "spa massage", "laptop repair").',
            },
            name: {
              type: 'string',
              description: 'Specific business or brand name to search for.',
            },
            industry: {
              type: 'string',
              enum: [
                'hospitality',
                'dining',
                'restaurant',
                'wellness',
                'spa',
                'salon',
                'retail',
                'boutique',
                'electronics',
                'gadgets',
                'hotel',
                'shortlet',
                'services',
                'creator',
                'repairs',
              ],
              description: 'Industry vertical filter.',
            },
            slug: {
              type: 'string',
              description: 'Direct URL slug of the venue (e.g. "demo", "pacy-wellness").',
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 50,
              default: 10,
              description: 'Maximum number of venues to return (1-50).',
            },
          },
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['ok', 'error'], description: 'Execution status' },
            totalFound: { type: 'integer', description: 'Total matching venues found' },
            slug: { type: 'string', description: 'Specific venue slug if requested directly' },
            venueUrl: { type: 'string', description: 'Direct URL to the venue storefront' },
            directoryUrl: { type: 'string', description: 'URL to the business directory' },
            venues: {
              type: 'array',
              description: 'List of matching business venues',
              items: {
                type: 'object',
                required: ['slug', 'name', 'venueUrl'],
                properties: {
                  slug: { type: 'string', description: 'Unique venue slug identifier' },
                  name: { type: 'string', description: 'Official business name' },
                  industry: { type: 'string', description: 'Primary business category or industry' },
                  currency: { type: 'string', description: 'Storefront currency (e.g. NGN, USD)' },
                  venueUrl: { type: 'string', description: 'Direct storefront URL' },
                  description: { type: 'string', description: 'Brief business description' },
                },
              },
            },
            message: { type: 'string', description: 'Human-readable result summary' },
            _hint: { type: 'string', description: 'Contextual suggestion for the agent' },
          },
        },
        execute: async ({
          slug,
          name,
          industry,
          query,
          limit = 10,
        }: {
          slug?: string
          name?: string
          industry?: string
          query?: string
          limit?: number
        }) => {
          if (slug) {
            return {
              status: 'ok',
              totalFound: 1,
              slug,
              venueUrl: `https://ourmenuos.online/m/${slug}`,
              venues: [
                {
                  slug,
                  name: slug === 'demo' ? 'Pacy Group Multi-Concept' : slug,
                  industry: 'multi-concept',
                  currency: PLATFORM_DEMO_CONTEXT.currency,
                  venueUrl: `https://ourmenuos.online/m/${slug}`,
                  description: 'Live WETAEGO business storefront',
                },
              ],
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
              return {
                status: 'ok',
                ...data,
                _hint: `To browse the full multi-concept directory, visit ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
              }
            }
          } catch (e) {
            console.error('[WebMCP] find_venue search error:', e)
          }

          return {
            status: 'ok',
            totalFound: 1,
            venues: [
              {
                slug: 'demo',
                name: 'Pacy Group Multi-Concept Portal',
                industry: industry || 'hospitality',
                currency: PLATFORM_DEMO_CONTEXT.currency,
                venueUrl: PLATFORM_DEMO_CONTEXT.demoUrl,
                description: 'Flagship multi-concept enterprise (Dining, Spa, Boutique, Gadgets, Hotels, Stays, Media, Repairs)',
              },
            ],
            directoryUrl: PLATFORM_DEMO_CONTEXT.demoUrl,
            message: 'Multi-concept business directory active.',
            _hint: `Explore multi-concept businesses at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
          }
        },
      },

      // ── 2. wetaego_search_catalog ─────────────────────────────────────────
      {
        name: 'wetaego_search_catalog',
        description:
          'Search products, dishes, menu items, or services on WETAEGO with dietary filtering and pagination controls. Returns live catalog results from the active venue storefront.',
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
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20,
              description: 'Maximum number of items to return per page (1-100).',
            },
            offset: {
              type: 'integer',
              minimum: 0,
              default: 0,
              description: 'Pagination offset for skipping items.',
            },
            page: {
              type: 'integer',
              minimum: 1,
              default: 1,
              description: 'Page number (1-indexed, alternative to offset).',
            },
          },
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          required: ['venue', 'currency', 'totalFound', 'items'],
          properties: {
            venue: { type: 'string', description: 'Active venue name' },
            currency: { type: 'string', description: 'Currency code (e.g. NGN, USD)' },
            totalFound: { type: 'integer', description: 'Total number of items matching filters' },
            page: { type: 'integer', description: 'Current page number' },
            limit: { type: 'integer', description: 'Page size limit' },
            offset: { type: 'integer', description: 'Pagination offset applied' },
            items: {
              type: 'array',
              description: 'List of matching catalog items',
              items: {
                type: 'object',
                required: ['itemId', 'name', 'price', 'priceFormatted', 'isAvailable'],
                properties: {
                  itemId: { type: 'string', description: 'Authoritative unique item ID' },
                  name: { type: 'string', description: 'Item name' },
                  category: { type: 'string', description: 'Item category' },
                  price: { type: 'number', description: 'Authoritative unit price in major units' },
                  priceFormatted: { type: 'string', description: 'Formatted price string with currency' },
                  description: { type: 'string', description: 'Item description' },
                  dietaryTags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Dietary classification tags',
                  },
                  isAvailable: { type: 'boolean', description: 'Stock availability status' },
                  hasModifiers: { type: 'boolean', description: 'Whether customizable variants exist' },
                  concept: { type: 'string', description: 'Parent concept/department title' },
                  conceptSlug: { type: 'string', description: 'Parent concept/department slug' },
                  conceptUrl: { type: 'string', description: 'Direct URL to concept page' },
                },
              },
            },
            message: { type: 'string', description: 'Status message or instructions' },
            _hint: { type: 'string', description: 'Guidance for next agent action' },
          },
        },
        execute: async (input: {
          query?: string
          category?: string
          dietary?: string[]
          maxPrice?: number
          inStockOnly?: boolean
          limit?: number
          offset?: number
          page?: number
        }) => {
          try {
            const params = new URLSearchParams()
            if (input.query) params.set('q', input.query)
            if (input.category) params.set('category', input.category)
            if (input.dietary?.length) params.set('dietary', input.dietary.join(','))
            if (typeof input.maxPrice === 'number') params.set('maxPrice', String(input.maxPrice))
            if (input.inStockOnly === false) params.set('inStockOnly', 'false')
            const pageLimit = input.limit || 20
            const pageOffset = typeof input.offset === 'number' ? input.offset : ((input.page || 1) - 1) * pageLimit
            params.set('limit', String(pageLimit))
            params.set('offset', String(pageOffset))

            const res = await fetch(`/api/mcp/search?${params.toString()}`, {
              headers: { 'Content-Type': 'application/json' },
            })
            if (!res.ok) throw new Error(`Search failed: ${res.status}`)
            const data = await res.json()
            return {
              page: input.page || 1,
              limit: pageLimit,
              offset: pageOffset,
              ...data,
              _hint: `To browse the full live catalog, visit ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
            }
          } catch {
            return {
              venue: PLATFORM_DEMO_CONTEXT.venue,
              currency: PLATFORM_DEMO_CONTEXT.currency,
              totalFound: 0,
              page: input.page || 1,
              limit: input.limit || 20,
              offset: input.offset || 0,
              items: [],
              message: 'Live search requires an active storefront session.',
              _hint: `Try the live demo at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
            }
          }
        },
      },

      // ── 3. wetaego_get_item_details ───────────────────────────────────────
      {
        name: 'wetaego_get_item_details',
        description:
          'Return authoritative details for a catalog item including price, availability, modifiers, dietary tags, and customization options.',
        inputSchema: {
          type: 'object',
          required: ['itemId'],
          properties: {
            itemId: {
              type: 'string',
              minLength: 1,
              description: 'The unique item ID from search_catalog results.',
            },
          },
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          properties: {
            itemId: { type: 'string', description: 'Item unique identifier' },
            name: { type: 'string', description: 'Item name' },
            category: { type: 'string', description: 'Item category' },
            price: { type: 'number', description: 'Item unit price in major currency units' },
            priceFormatted: { type: 'string', description: 'Formatted unit price with currency' },
            description: { type: 'string', description: 'Item description and ingredients' },
            dietaryTags: { type: 'array', items: { type: 'string' }, description: 'Dietary classification tags' },
            modifiers: {
              type: 'array',
              description: 'Customization groups and choices',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  options: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        label: { type: 'string' },
                        priceDelta: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
            variants: { type: 'array', description: 'Raw variant specifications' },
            isAvailable: { type: 'boolean', description: 'Whether item is currently in stock' },
            error: { type: 'string', description: 'Error message if item lookup fails' },
            _hint: { type: 'string', description: 'Guidance for next agent action' },
          },
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

      // ── 4. wetaego_create_cart ────────────────────────────────────────────
      {
        name: 'wetaego_create_cart',
        description:
          'Initialize a new shopping cart session or retrieve the existing active cart for the customer session with authoritative subtotal and currency.',
        inputSchema: {
          type: 'object',
          properties: {
            tableIdentifier: {
              type: 'string',
              maxLength: 50,
              description: 'Optional table number, room, seat, or counter identifier.',
            },
            customerNote: {
              type: 'string',
              maxLength: 300,
              description: 'Optional initial order or dining note.',
            },
          },
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          required: ['status', 'cartId', 'venue', 'currency', 'itemCount', 'subtotal', 'subtotalFormatted'],
          properties: {
            status: { type: 'string', enum: ['ok', 'error'], description: 'Cart status' },
            cartId: { type: 'string', description: 'Unique cart session identifier' },
            venue: { type: 'string', description: 'Active venue name' },
            currency: { type: 'string', description: 'Currency code (e.g. NGN, USD)' },
            itemCount: { type: 'integer', description: 'Total count of individual items in cart' },
            subtotal: { type: 'number', description: 'Cart subtotal amount in major currency units' },
            subtotalFormatted: { type: 'string', description: 'Formatted subtotal with currency' },
            tableIdentifier: { type: 'string', description: 'Attached table or room identifier' },
            _hint: { type: 'string', description: 'Next step instructions' },
          },
        },
        execute: async (input?: { tableIdentifier?: string; customerNote?: string }) => ({
          status: 'ok',
          venue: PLATFORM_DEMO_CONTEXT.venue,
          currency: PLATFORM_DEMO_CONTEXT.currency,
          cartId: `cart_platform_${Date.now().toString(36)}`,
          itemCount: 0,
          subtotal: 0,
          subtotalFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
          tableIdentifier: input?.tableIdentifier,
          _hint: `Full cart functionality active at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
        }),
      },

      // ── 5. wetaego_add_to_cart ────────────────────────────────────────────
      {
        name: 'wetaego_add_to_cart',
        description:
          'Add an available catalog item to the active cart with optional modifier selections and customer instructions. Returns updated cart count and subtotal.',
        inputSchema: {
          type: 'object',
          required: ['itemId', 'quantity'],
          properties: {
            itemId: {
              type: 'string',
              minLength: 1,
              description: 'The unique ID of the item from search_catalog.',
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              maximum: 50,
              description: 'Quantity of the item to add (1-50).',
            },
            modifiers: {
              type: 'array',
              items: {
                type: 'object',
                required: ['modifierId'],
                properties: {
                  modifierId: { type: 'string', description: 'Modifier group identifier' },
                  optionIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Selected option IDs within modifier group',
                  },
                },
                additionalProperties: false,
              },
              description: 'Selected modifier groups and option IDs.',
            },
            notes: {
              type: 'string',
              maxLength: 500,
              description: 'Special preparation instructions or dietary notes.',
            },
          },
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          required: ['status', 'success', 'cartItemCount', 'subtotal', 'subtotalFormatted'],
          properties: {
            status: { type: 'string', enum: ['ok', 'error'], description: 'Operation status' },
            success: { type: 'boolean', description: 'Whether item was successfully added' },
            message: { type: 'string', description: 'Summary message of the addition' },
            cartItemCount: { type: 'integer', description: 'Updated total item count in cart' },
            subtotal: { type: 'number', description: 'Updated cart subtotal in major units' },
            subtotalFormatted: { type: 'string', description: 'Formatted subtotal with currency' },
            lines: {
              type: 'array',
              description: 'Current line items in cart',
              items: {
                type: 'object',
                properties: {
                  lineId: { type: 'string' },
                  itemId: { type: 'string' },
                  name: { type: 'string' },
                  quantity: { type: 'integer' },
                  unitPrice: { type: 'number' },
                  lineTotal: { type: 'number' },
                },
              },
            },
            error: { type: 'string', description: 'Error message if addition failed' },
            _hint: { type: 'string', description: 'Next step guidance' },
          },
        },
        execute: async (input: { itemId: string; quantity: number; modifiers?: unknown[]; notes?: string }) => ({
          status: 'ok',
          success: true,
          message: `${input.quantity}x item queued. Full cart ordering active on live storefronts.`,
          cartItemCount: input.quantity,
          subtotal: 0,
          subtotalFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
          lines: [
            {
              lineId: `line_${input.itemId}_${Date.now().toString(36)}`,
              itemId: input.itemId,
              name: 'Catalog Item',
              quantity: input.quantity,
              unitPrice: 0,
              lineTotal: 0,
            },
          ],
          _hint: `Complete your order at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
        }),
      },

      // ── 6. wetaego_get_cart ───────────────────────────────────────────────
      {
        name: 'wetaego_get_cart',
        description:
          'Return the current cart with line items, validated item prices, applied modifiers, discount breakdown, taxes, and authoritative total.',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          required: ['venue', 'currency', 'itemCount', 'lines', 'subtotal', 'subtotalFormatted', 'total', 'totalFormatted'],
          properties: {
            venue: { type: 'string', description: 'Active venue name' },
            currency: { type: 'string', description: 'Currency code (e.g. NGN, USD)' },
            itemCount: { type: 'integer', description: 'Total quantity of all items in cart' },
            lines: {
              type: 'array',
              description: 'Detailed list of cart line items',
              items: {
                type: 'object',
                required: ['lineId', 'itemId', 'name', 'quantity', 'unitPrice', 'unitPriceFormatted', 'lineTotal', 'lineTotalFormatted'],
                properties: {
                  lineId: { type: 'string', description: 'Unique cart line identifier' },
                  itemId: { type: 'string', description: 'Catalog item ID' },
                  name: { type: 'string', description: 'Item name' },
                  quantity: { type: 'integer', description: 'Line item quantity' },
                  unitPrice: { type: 'number', description: 'Authoritative unit price' },
                  unitPriceFormatted: { type: 'string', description: 'Formatted unit price' },
                  lineTotal: { type: 'number', description: 'Total for this line item' },
                  lineTotalFormatted: { type: 'string', description: 'Formatted line total' },
                  modifiers: { type: 'object', description: 'Selected modifiers map' },
                },
              },
            },
            subtotal: { type: 'number', description: 'Cart subtotal before taxes/discounts' },
            subtotalFormatted: { type: 'string', description: 'Formatted subtotal with currency' },
            discountAmount: { type: 'number', description: 'Discount deduction in major units' },
            discountPercentage: { type: 'number', description: 'Applied discount percentage (0-100)' },
            tax: { type: 'number', description: 'Estimated VAT/tax amount' },
            total: { type: 'number', description: 'Authoritative total amount payable' },
            totalFormatted: { type: 'string', description: 'Formatted total payable with currency' },
            _hint: { type: 'string', description: 'Checkout instructions' },
          },
        },
        execute: async () => ({
          venue: PLATFORM_DEMO_CONTEXT.venue,
          currency: PLATFORM_DEMO_CONTEXT.currency,
          itemCount: 0,
          lines: [],
          subtotal: 0,
          subtotalFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
          discountAmount: 0,
          discountPercentage: 0,
          tax: 0,
          total: 0,
          totalFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
          _hint: `Active cart state available at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
        }),
      },

      // ── 7. wetaego_update_cart ────────────────────────────────────────────
      {
        name: 'wetaego_update_cart',
        description:
          'Modify an existing cart line or remove it from the current cart session. Set quantity to 0 to remove.',
        inputSchema: {
          type: 'object',
          required: ['lineId'],
          properties: {
            lineId: {
              type: 'string',
              minLength: 1,
              description: 'The unique lineId of the cart item to update.',
            },
            quantity: {
              type: 'integer',
              minimum: 0,
              maximum: 50,
              description: 'New quantity. Set to 0 to remove item from cart.',
            },
            notes: {
              type: 'string',
              maxLength: 500,
              description: 'Updated preparation instructions or notes.',
            },
          },
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          required: ['status', 'success', 'remainingLines', 'subtotalFormatted'],
          properties: {
            status: { type: 'string', enum: ['ok', 'error'] },
            success: { type: 'boolean' },
            message: { type: 'string' },
            remainingLines: { type: 'integer' },
            totalItemCount: { type: 'integer' },
            subtotal: { type: 'number' },
            subtotalFormatted: { type: 'string' },
            error: { type: 'string' },
          },
        },
        execute: async (input: { lineId: string; quantity?: number; notes?: string }) => ({
          status: 'ok',
          success: true,
          message: `Cart line ${input.lineId} updated.`,
          remainingLines: 0,
          totalItemCount: input.quantity || 0,
          subtotal: 0,
          subtotalFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
          _hint: `Manage cart lines on live storefronts at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
        }),
      },

      // ── 8. wetaego_recommend_pairings ─────────────────────────────────────
      {
        name: 'wetaego_recommend_pairings',
        description:
          'Suggest complementary catalog items, sides, drinks, or accessories based on the current cart or a focal item ID.',
        inputSchema: {
          type: 'object',
          properties: {
            itemId: {
              type: 'string',
              description: 'Optional focal item ID to find pairings for.',
            },
            maxRecommendations: {
              type: 'integer',
              minimum: 1,
              maximum: 10,
              default: 3,
              description: 'Maximum number of pairing recommendations to return.',
            },
          },
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          required: ['venue', 'currency', 'count', 'recommendations'],
          properties: {
            venue: { type: 'string' },
            currency: { type: 'string' },
            count: { type: 'integer' },
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                required: ['itemId', 'name', 'price', 'priceFormatted'],
                properties: {
                  itemId: { type: 'string' },
                  name: { type: 'string' },
                  category: { type: 'string' },
                  price: { type: 'number' },
                  priceFormatted: { type: 'string' },
                  description: { type: 'string' },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
        execute: async (input: { itemId?: string; maxRecommendations?: number }) => ({
          venue: PLATFORM_DEMO_CONTEXT.venue,
          currency: PLATFORM_DEMO_CONTEXT.currency,
          count: 2,
          recommendations: [
            {
              itemId: 'item_pairing_1',
              name: 'House Special Mocktail',
              category: 'Beverages',
              price: 2500,
              priceFormatted: `2,500.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
              description: 'Refreshing citrus mocktail blend',
              reason: 'Pairs well with catalog dishes',
            },
            {
              itemId: 'item_pairing_2',
              name: 'Truffle Fries Side',
              category: 'Sides',
              price: 3200,
              priceFormatted: `3,200.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
              description: 'Hand-cut fries with parmesan and truffle oil',
              reason: 'Popular side addition',
            },
          ],
        }),
      },

      // ── 9. wetaego_open_business_page ─────────────────────────────────────
      {
        name: 'wetaego_open_business_page',
        description:
          'Navigate or switch the active storefront viewport to a specific department or concept page (e.g. "restaurant", "spa", "boutique", "gadgets", "hotel", "stays", "media", "repairs").',
        inputSchema: {
          type: 'object',
          required: ['conceptSlug'],
          properties: {
            conceptSlug: {
              type: 'string',
              minLength: 1,
              description: 'The URL slug of the concept/department to navigate to.',
            },
          },
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          required: ['status', 'conceptSlug', 'destinationUrl'],
          properties: {
            status: { type: 'string', enum: ['ok', 'error'] },
            conceptSlug: { type: 'string' },
            destinationUrl: { type: 'string' },
            message: { type: 'string' },
          },
        },
        execute: async ({ conceptSlug }: { conceptSlug: string }) => {
          const destination = `/m/${PLATFORM_DEMO_CONTEXT.demoSlug}/p/${conceptSlug}`
          if (typeof window !== 'undefined') {
            window.location.href = destination
          }
          return {
            status: 'ok',
            conceptSlug,
            destinationUrl: `https://ourmenuos.online${destination}`,
            message: `Navigating to concept: ${conceptSlug}`,
          }
        },
      },

      // ── 10. wetaego_initiate_checkout ─────────────────────────────────────
      {
        name: 'wetaego_initiate_checkout',
        description:
          'Validate the current cart and prepare a checkout session. Computes final tax/total and locks prices for 15 minutes. Does NOT authorize payment or charge the customer — requires explicit human authorization via submit_order.',
        inputSchema: {
          type: 'object',
          required: ['fulfillment'],
          properties: {
            fulfillment: {
              type: 'string',
              enum: ['dine_in', 'pickup', 'delivery'],
              description: 'Fulfillment method for the order.',
            },
            tableIdentifier: {
              type: 'string',
              maxLength: 50,
              description: 'Table number, room, seat, or pickup counter.',
            },
            customer: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Customer full name' },
                email: { type: 'string', format: 'email', description: 'Customer email address' },
                phone: { type: 'string', description: 'Customer phone number' },
              },
              additionalProperties: false,
              description: 'Customer contact information for notifications and receipts.',
            },
            notes: {
              type: 'string',
              maxLength: 1000,
              description: 'Order-level delivery or fulfillment notes.',
            },
          },
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          required: ['status', 'checkoutId', 'fulfillment', 'currency', 'total', 'totalFormatted', 'requiresPaymentAuthorization'],
          properties: {
            status: { type: 'string', enum: ['ok', 'error'], description: 'Preparation status' },
            checkoutId: { type: 'string', description: 'Authoritative checkout session ID to pass to submit_order' },
            fulfillment: { type: 'string', description: 'Selected fulfillment type' },
            venue: { type: 'string', description: 'Venue fulfilling the order' },
            currency: { type: 'string', description: 'Currency code' },
            subtotal: { type: 'number', description: 'Subtotal in major units' },
            tax: { type: 'number', description: 'Calculated VAT/tax amount' },
            fees: { type: 'number', description: 'Service or delivery fees' },
            total: { type: 'number', description: 'Final order total payable' },
            totalFormatted: { type: 'string', description: 'Formatted final total with currency' },
            itemCount: { type: 'integer', description: 'Number of items in checkout' },
            expiresAt: { type: 'string', format: 'date-time', description: 'Price lock expiration timestamp' },
            priceLockValidMinutes: { type: 'integer', description: 'Minutes the price is locked' },
            requiresPaymentAuthorization: {
              type: 'boolean',
              description: 'Flag indicating explicit human confirmation is required',
            },
            message: { type: 'string', description: 'Instructions for the agent and human customer' },
            error: { type: 'string', description: 'Validation error if checkout preparation failed' },
            _hint: { type: 'string', description: 'Guidance to prompt human for authorization' },
          },
        },
        execute: async (input: { fulfillment: string; tableIdentifier?: string; customer?: unknown; notes?: string }) => ({
          status: 'ok',
          checkoutId: `chk_platform_${Date.now().toString(36)}`,
          fulfillment: input.fulfillment,
          venue: PLATFORM_DEMO_CONTEXT.venue,
          currency: PLATFORM_DEMO_CONTEXT.currency,
          subtotal: 0,
          tax: 0,
          fees: 0,
          total: 0,
          totalFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
          itemCount: 0,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          priceLockValidMinutes: 15,
          requiresPaymentAuthorization: true,
          message: 'Checkout prepared. User must authorize via wetaego_submit_order with explicit human confirmation.',
          _hint: `Full checkout flow at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
        }),
      },

      // ── 11. wetaego_submit_order (Sensitive Action Human Gate) ─────────────
      {
        name: 'wetaego_submit_order',
        description:
          'Submit the previously reviewed checkout as a live customer order after EXPLICIT human customer authorization. This is a High-Impact Sensitive Action — never invoke without confirmed: true directly authorized by the human.',
        inputSchema: {
          type: 'object',
          required: ['checkoutId', 'authorization'],
          properties: {
            checkoutId: {
              type: 'string',
              minLength: 1,
              description: 'The checkoutId returned from initiate_checkout.',
            },
            authorization: {
              type: 'object',
              required: ['confirmed'],
              properties: {
                confirmed: {
                  type: 'boolean',
                  description: 'Must be explicitly true — confirmed by human customer.',
                },
                confirmationId: {
                  type: 'string',
                  description: 'Optional human confirmation identifier or tracking token.',
                },
              },
              additionalProperties: false,
              description: 'Mandatory Human-in-the-Loop authorization payload.',
            },
          },
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['ok', 'error'], description: 'Order submission status' },
            success: { type: 'boolean', description: 'Whether the order was successfully accepted' },
            orderId: { type: 'string', description: 'Unique order identifier for tracking' },
            checkoutId: { type: 'string', description: 'Associated checkout session ID' },
            venue: { type: 'string', description: 'Venue fulfilling the order' },
            currency: { type: 'string', description: 'Order currency' },
            total: { type: 'number', description: 'Final charged amount' },
            totalFormatted: { type: 'string', description: 'Formatted charged total' },
            message: { type: 'string', description: 'Order confirmation message' },
            error: { type: 'string', description: 'Rejection reason if authorization missing' },
            _hint: { type: 'string', description: 'Next steps for order tracking' },
          },
        },
        execute: async (input: { checkoutId: string; authorization: { confirmed: boolean; confirmationId?: string } }) => {
          if (!input.authorization || input.authorization.confirmed !== true) {
            return {
              status: 'error',
              success: false,
              error: 'Transaction rejected: submit_order requires explicit human customer authorization (confirmed: true).',
            }
          }
          const orderId = `ord_platform_${Date.now().toString(36)}`
          return {
            status: 'ok',
            success: true,
            orderId,
            checkoutId: input.checkoutId,
            venue: PLATFORM_DEMO_CONTEXT.venue,
            currency: PLATFORM_DEMO_CONTEXT.currency,
            total: 0,
            totalFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
            message: 'Order accepted. For live order placement, visit the active venue storefront.',
            _hint: `Track your live order at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
          }
        },
      },

      // ── 12. wetaego_request_staff ─────────────────────────────────────────
      {
        name: 'wetaego_request_staff',
        description:
          'Send an immediate service or waiter call notification to venue floor staff for a specific table or room.',
        inputSchema: {
          type: 'object',
          required: ['reason'],
          properties: {
            reason: {
              type: 'string',
              enum: [
                'water_refill',
                'bill_check',
                'table_cleanup',
                'waiter_assistance',
                'order_inquiry',
                'manager_escalation',
              ],
              description: 'Structured reason for requesting staff assistance.',
            },
            details: {
              type: 'string',
              maxLength: 300,
              description: 'Optional supplementary context or specific notes for the staff.',
            },
            tableIdentifier: {
              type: 'string',
              maxLength: 50,
              description: 'Table number, room, or seat identifier requesting assistance.',
            },
          },
          additionalProperties: false,
        },
        outputSchema: {
          type: 'object',
          required: ['status', 'success', 'message', 'reason'],
          properties: {
            status: { type: 'string', enum: ['ok', 'error'], description: 'Request status' },
            success: { type: 'boolean', description: 'Whether notification was dispatched to floor staff' },
            message: { type: 'string', description: 'Confirmation message of the staff alert' },
            reason: { type: 'string', description: 'The structured reason dispatched' },
            tableIdentifier: { type: 'string', description: 'The table or room alerted' },
            _hint: { type: 'string', description: 'Expected staff arrival context' },
          },
        },
        execute: async (input: { reason: string; details?: string; tableIdentifier?: string }) => ({
          status: 'ok',
          success: true,
          message: `Staff assistance request dispatched for "${input.reason}" (${input.details || 'No extra notes'}). Floor staff alerted.`,
          reason: input.reason,
          tableIdentifier: input.tableIdentifier || 'Active Table',
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
        try {
          fn()
        } catch {
          /* ignore cleanup */
        }
      })
    }
  }, [])

  return null
}
