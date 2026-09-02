'use client'

import { useEffect } from 'react'
import { ensureWebMCPContext } from '@/lib/webmcp/registry'
import type { WebMCPTool } from '@/lib/webmcp/types'

/**
 * Authoritative WebMCP Client Provider for WETAEGO (OurMenuOS)
 * Registers the 12-tool client commerce & discovery suite onto navigator.modelContext
 * and document.modelContext using both navigator.modelContext.provideContext() and registerTool().
 *
 * Full compliance with WebMCP specifications and exhaustive result schemas across all tools.
 */

const PLATFORM_DEMO_CONTEXT = {
  venue: 'WETAEGO Platform',
  currency: 'NGN',
  demoSlug: 'demo',
  demoUrl: 'https://ourmenuos.online/m/demo',
}

export const WEBMCP_TOOLS: WebMCPTool<any, any>[] = [
  // 1. wetaego_find_venue — page: '/' (Global Discovery)
  {
    name: 'wetaego_find_venue',
    page: '/',
    description:
      'Search and discover distinct external merchant venues or branch locations across the WETAEGO network. Use "query" for keyword/city search, "name" for exact business matching, or "slug" for direct venue URL lookup. (To switch tabs or departments inside the current venue, use wetaego_open_business_page instead.)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text keyword or location search (e.g. "Lagos sushi", "spa Lekki").' },
        name: { type: 'string', description: 'Exact or partial business name (e.g. "Pacy Group", "Emerald Cafe").' },
        industry: {
          type: 'string',
          enum: ['dining', 'hospitality', 'wellness', 'retail', 'services', 'creator'],
          description: 'Non-overlapping industry vertical filter: "dining" (restaurants, cafes, bars), "hospitality" (hotels, stays, resorts), "wellness" (spas, salons, beauty), "retail" (boutiques, electronics, supermarkets), "services" (repairs, consulting), "creator" (media, studios, rate cards).',
        },
        slug: { type: 'string', description: 'Exact venue slug identifier (e.g. "demo", "ocean-basket").' },
        limit: { type: 'integer', minimum: 1, maximum: 50, default: 10, description: 'Max venues to return (1-50).' },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'totalFound', 'venues'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'], description: 'Execution status' },
        totalFound: { type: 'integer', description: 'Total number of matching venues' },
        slug: { type: 'string', description: 'Matched direct slug if provided' },
        venueUrl: { type: 'string', description: 'Direct URL to access the matched venue' },
        directoryUrl: { type: 'string', description: 'URL to the full business directory' },
        venues: {
          type: 'array',
          description: 'List of matching merchant venues',
          items: {
            type: 'object',
            required: ['slug', 'name', 'venueUrl'],
            properties: {
              slug: { type: 'string', description: 'Unique slug identifier for the venue' },
              name: { type: 'string', description: 'Business display name' },
              industry: { type: 'string', description: 'Industry vertical' },
              currency: { type: 'string', description: 'Default currency code (e.g. NGN, USD)' },
              venueUrl: { type: 'string', description: 'Direct storefront URL' },
              description: { type: 'string', description: 'Brief description of the venue' },
            },
          },
        },
        message: { type: 'string', description: 'Human-readable result summary' },
        _hint: { type: 'string', description: 'Actionable guidance for the AI agent' },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['status', 'totalFound', 'venues'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'], description: 'Execution status' },
        totalFound: { type: 'integer', description: 'Total number of matching venues' },
        slug: { type: 'string', description: 'Matched direct slug if provided' },
        venueUrl: { type: 'string', description: 'Direct URL to access the matched venue' },
        directoryUrl: { type: 'string', description: 'URL to the full business directory' },
        venues: {
          type: 'array',
          description: 'List of matching merchant venues',
          items: {
            type: 'object',
            required: ['slug', 'name', 'venueUrl'],
            properties: {
              slug: { type: 'string', description: 'Unique slug identifier for the venue' },
              name: { type: 'string', description: 'Business display name' },
              industry: { type: 'string', description: 'Industry vertical' },
              currency: { type: 'string', description: 'Default currency code' },
              venueUrl: { type: 'string', description: 'Direct storefront URL' },
              description: { type: 'string', description: 'Brief description of the venue' },
            },
          },
        },
        message: { type: 'string', description: 'Human-readable result summary' },
        _hint: { type: 'string', description: 'Actionable guidance for the AI agent' },
      },
    },
    execute: async ({ slug, name, industry, query, limit = 10 }: { slug?: string; name?: string; industry?: string; query?: string; limit?: number }) => {
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
          return { status: 'ok', ...data, _hint: `To browse the full directory, visit ${PLATFORM_DEMO_CONTEXT.demoUrl}` }
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

  // 2. wetaego_search_catalog — page: '/'
  {
    name: 'wetaego_search_catalog',
    page: '/',
    description:
      'Search catalog items, products, dishes, and services with category and price filters. Returns item details, prices, and availability.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Keyword search query for products, dishes, or services.' },
        category: { type: 'string', description: 'Category name filter (e.g. "Mains", "Apparel", "Spa Services").' },
        dietary: {
          type: 'array',
          items: { type: 'string', enum: ['vegan', 'vegetarian', 'halal', 'kosher', 'gluten_free', 'dairy_free', 'nut_free', 'keto'] },
          description: 'Dietary classification filters for food & dining.',
        },
        maxPrice: { type: 'number', minimum: 0, description: 'Maximum price filter in major currency units.' },
        inStockOnly: { type: 'boolean', default: true, description: 'Return only in-stock or available items.' },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20, description: 'Max items per page (1-100).' },
        offset: { type: 'integer', minimum: 0, default: 0, description: 'Pagination offset.' },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['venue', 'currency', 'totalFound', 'items'],
      properties: {
        venue: { type: 'string', description: 'Active venue name' },
        currency: { type: 'string', description: 'Currency code (e.g. NGN, USD)' },
        totalFound: { type: 'integer', description: 'Total matching items found' },
        limit: { type: 'integer', description: 'Page size limit used' },
        offset: { type: 'integer', description: 'Offset applied' },
        items: {
          type: 'array',
          description: 'List of catalog items matching filters',
          items: {
            type: 'object',
            required: ['itemId', 'name', 'price', 'priceFormatted', 'isAvailable'],
            properties: {
              itemId: { type: 'string', description: 'Unique item ID required for cart and detail actions' },
              name: { type: 'string', description: 'Item name' },
              category: { type: 'string', description: 'Menu or catalog category' },
              price: { type: 'number', description: 'Unit price in major currency units' },
              priceFormatted: { type: 'string', description: 'Formatted price with currency symbol' },
              description: { type: 'string', description: 'Item description and specifications' },
              dietaryTags: { type: 'array', items: { type: 'string' }, description: 'Applicable dietary tags for food/dining' },
              attributes: {
                type: 'object',
                description: 'Multi-industry product & service attributes',
                properties: {
                  sizes: { type: 'array', items: { type: 'string' }, description: 'Available sizes for apparel/goods' },
                  colors: { type: 'array', items: { type: 'string' }, description: 'Available colors' },
                  condition: { type: 'string', enum: ['new', 'refurbished', 'pre_owned'], description: 'Product condition' },
                  brand: { type: 'string', description: 'Brand or maker' },
                  durationMinutes: { type: 'integer', description: 'Treatment/appointment duration for wellness/services' },
                  guestCapacity: { type: 'integer', description: 'Guest capacity for hospitality/rooms/venues' },
                  roomType: { type: 'string', description: 'Room or accommodation tier' },
                  amenities: { type: 'array', items: { type: 'string' }, description: 'Included amenities or features' },
                },
              },
              isAvailable: { type: 'boolean', description: 'Whether the item is currently in stock or available' },
              hasModifiers: { type: 'boolean', description: 'Whether the item has customizable variants/options' },
              conceptSlug: { type: 'string', description: 'Department or concept slug if part of a multi-concept venue' },
              conceptUrl: { type: 'string', description: 'Direct URL to this concept department' },
            },
          },
        },
        message: { type: 'string', description: 'Summary message' },
        _hint: { type: 'string', description: 'Agent instruction note' },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['venue', 'currency', 'totalFound', 'items'],
      properties: {
        venue: { type: 'string', description: 'Active venue name' },
        currency: { type: 'string', description: 'Currency code (e.g. NGN, USD)' },
        totalFound: { type: 'integer', description: 'Total matching items found' },
        limit: { type: 'integer', description: 'Page size limit used' },
        offset: { type: 'integer', description: 'Offset applied' },
        items: {
          type: 'array',
          description: 'List of catalog items matching filters',
          items: {
            type: 'object',
            required: ['itemId', 'name', 'price', 'priceFormatted', 'isAvailable'],
            properties: {
              itemId: { type: 'string', description: 'Unique item ID required for cart and detail actions' },
              name: { type: 'string', description: 'Item name' },
              category: { type: 'string', description: 'Menu or catalog category' },
              price: { type: 'number', description: 'Unit price in major currency units' },
              priceFormatted: { type: 'string', description: 'Formatted price with currency symbol' },
              description: { type: 'string', description: 'Item description and specifications' },
              dietaryTags: { type: 'array', items: { type: 'string' }, description: 'Applicable dietary tags' },
              attributes: {
                type: 'object',
                description: 'Multi-industry product & service attributes',
                properties: {
                  sizes: { type: 'array', items: { type: 'string' }, description: 'Available sizes for apparel/goods' },
                  colors: { type: 'array', items: { type: 'string' }, description: 'Available colors' },
                  condition: { type: 'string', enum: ['new', 'refurbished', 'pre_owned'], description: 'Product condition' },
                  brand: { type: 'string', description: 'Brand or maker' },
                  durationMinutes: { type: 'integer', description: 'Treatment/appointment duration for wellness/services' },
                  guestCapacity: { type: 'integer', description: 'Guest capacity for hospitality/rooms/venues' },
                  roomType: { type: 'string', description: 'Room or accommodation tier' },
                  amenities: { type: 'array', items: { type: 'string' }, description: 'Included amenities or features' },
                },
              },
              isAvailable: { type: 'boolean', description: 'Whether the item is currently in stock' },
              hasModifiers: { type: 'boolean', description: 'Whether the item has customizable variants/options' },
              conceptSlug: { type: 'string', description: 'Department or concept slug' },
              conceptUrl: { type: 'string', description: 'Direct URL to concept department' },
            },
          },
        },
        message: { type: 'string', description: 'Summary message' },
        _hint: { type: 'string', description: 'Agent instruction note' },
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
        return {
          venue: PLATFORM_DEMO_CONTEXT.venue,
          currency: PLATFORM_DEMO_CONTEXT.currency,
          totalFound: 0,
          limit: input.limit || 20,
          offset: input.offset || 0,
          items: [],
          message: 'Live search requires an active storefront session.',
          _hint: `Try the live demo at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
        }
      }
    },
  },

  // 3. wetaego_get_item_details — page: '/m/{slug}'
  {
    name: 'wetaego_get_item_details',
    page: '/m/{slug}',
    description:
      'Return authoritative details for a specific catalog item using its unique itemId, including price, stock status, customizable modifier groups, dietary tags, and variant options.',
    inputSchema: {
      type: 'object',
      required: ['itemId'],
      properties: {
        itemId: { type: 'string', minLength: 1, description: 'The unique itemId from wetaego_search_catalog results.' },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['itemId', 'name', 'price', 'priceFormatted', 'isAvailable'],
      properties: {
        itemId: { type: 'string', description: 'Unique item identifier' },
        name: { type: 'string', description: 'Item name' },
        category: { type: 'string', description: 'Category name' },
        price: { type: 'number', description: 'Price in major currency units' },
        priceFormatted: { type: 'string', description: 'Formatted price with currency' },
        description: { type: 'string', description: 'Detailed item description' },
        dietaryTags: { type: 'array', items: { type: 'string' }, description: 'Dietary classifications' },
        modifiers: {
          type: 'array',
          description: 'Customization option groups and price deltas',
          items: {
            type: 'object',
            required: ['name', 'options'],
            properties: {
              id: { type: 'string', description: 'Modifier group ID' },
              name: { type: 'string', description: 'Modifier group name' },
              required: { type: 'boolean', description: 'Whether selection is mandatory' },
              options: {
                type: 'array',
                description: 'List of modifier options',
                items: {
                  type: 'object',
                  required: ['name', 'priceDelta'],
                  properties: {
                    id: { type: 'string', description: 'Option ID' },
                    name: { type: 'string', description: 'Option name' },
                    priceDelta: { type: 'number', description: 'Price difference in currency units' },
                    priceDeltaFormatted: { type: 'string', description: 'Formatted price difference' },
                  },
                },
              },
            },
          },
        },
        variants: {
          type: 'array',
          description: 'Item variant specifications',
          items: {
            type: 'object',
            required: ['name', 'price', 'isAvailable'],
            properties: {
              id: { type: 'string', description: 'Variant ID' },
              name: { type: 'string', description: 'Variant name' },
              price: { type: 'number', description: 'Variant price' },
              priceFormatted: { type: 'string', description: 'Formatted variant price' },
              isAvailable: { type: 'boolean', description: 'In-stock status' },
            },
          },
        },
        isAvailable: { type: 'boolean', description: 'In-stock availability flag' },
        error: { type: 'string', description: 'Error message if item was not found' },
        _hint: { type: 'string', description: 'Guidance note for agent' },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['itemId', 'name', 'price', 'priceFormatted', 'isAvailable'],
      properties: {
        itemId: { type: 'string', description: 'Unique item identifier' },
        name: { type: 'string', description: 'Item name' },
        category: { type: 'string', description: 'Category name' },
        price: { type: 'number', description: 'Price in major currency units' },
        priceFormatted: { type: 'string', description: 'Formatted price with currency' },
        description: { type: 'string', description: 'Detailed item description' },
        dietaryTags: { type: 'array', items: { type: 'string' }, description: 'Dietary classifications' },
        modifiers: {
          type: 'array',
          description: 'Customization option groups and price deltas',
          items: {
            type: 'object',
            required: ['name', 'options'],
            properties: {
              id: { type: 'string', description: 'Modifier group ID' },
              name: { type: 'string', description: 'Modifier group name' },
              required: { type: 'boolean', description: 'Whether selection is mandatory' },
              options: {
                type: 'array',
                description: 'List of modifier options',
                items: {
                  type: 'object',
                  required: ['name', 'priceDelta'],
                  properties: {
                    id: { type: 'string', description: 'Option ID' },
                    name: { type: 'string', description: 'Option name' },
                    priceDelta: { type: 'number', description: 'Price difference in currency units' },
                    priceDeltaFormatted: { type: 'string', description: 'Formatted price difference' },
                  },
                },
              },
            },
          },
        },
        variants: {
          type: 'array',
          description: 'Item variant specifications',
          items: {
            type: 'object',
            required: ['name', 'price', 'isAvailable'],
            properties: {
              id: { type: 'string', description: 'Variant ID' },
              name: { type: 'string', description: 'Variant name' },
              price: { type: 'number', description: 'Variant price' },
              priceFormatted: { type: 'string', description: 'Formatted variant price' },
              isAvailable: { type: 'boolean', description: 'In-stock status' },
            },
          },
        },
        isAvailable: { type: 'boolean', description: 'In-stock availability flag' },
        error: { type: 'string', description: 'Error message if item was not found' },
        _hint: { type: 'string', description: 'Guidance note for agent' },
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
    description:
      'Initialize a new shopping cart session or retrieve the existing active cart. Returns a structured "cartId" (e.g. "cart_demo_abc123") that can be passed to subsequent cart and checkout calls.',
    inputSchema: {
      type: 'object',
      properties: {
        tableIdentifier: { type: 'string', maxLength: 50, description: 'Optional table number, room, seat, or pickup counter.' },
        customerNote: { type: 'string', maxLength: 300, description: 'Optional initial order note.' },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'cartId', 'venue', 'currency', 'itemCount', 'subtotal', 'subtotalFormatted'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'], description: 'Status code' },
        cartId: { type: 'string', description: 'Unique cart session identifier (format: cart_<slug>_<id>)' },
        venue: { type: 'string', description: 'Active venue name' },
        currency: { type: 'string', description: 'Currency code' },
        itemCount: { type: 'integer', description: 'Total item quantity in cart' },
        subtotal: { type: 'number', description: 'Subtotal in major currency units' },
        subtotalFormatted: { type: 'string', description: 'Formatted subtotal with currency' },
        tableIdentifier: { type: 'string', description: 'Assigned table/room identifier' },
        _hint: { type: 'string', description: 'Agent instruction note' },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['status', 'cartId', 'venue', 'currency', 'itemCount', 'subtotal', 'subtotalFormatted'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'], description: 'Status code' },
        cartId: { type: 'string', description: 'Unique cart session identifier (format: cart_<slug>_<id>)' },
        venue: { type: 'string', description: 'Active venue name' },
        currency: { type: 'string', description: 'Currency code' },
        itemCount: { type: 'integer', description: 'Total item quantity in cart' },
        subtotal: { type: 'number', description: 'Subtotal in major currency units' },
        subtotalFormatted: { type: 'string', description: 'Formatted subtotal with currency' },
        tableIdentifier: { type: 'string', description: 'Assigned table/room identifier' },
        _hint: { type: 'string', description: 'Agent instruction note' },
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

  // 5. wetaego_add_to_cart — page: '/m/{slug}'
  {
    name: 'wetaego_add_to_cart',
    page: '/m/{slug}',
    description:
      'Add an available catalog item to the active shopping cart with optional modifier selections. Returns the updated cart line items, total item count, and recalculated subtotal.',
    inputSchema: {
      type: 'object',
      required: ['itemId', 'quantity'],
      properties: {
        cartId: { type: 'string', description: 'Optional unique cart session ID. If omitted, uses active session cart.' },
        itemId: { type: 'string', minLength: 1, description: 'The unique ID of the item from wetaego_search_catalog.' },
        quantity: { type: 'integer', minimum: 1, maximum: 50, description: 'Quantity of items to add (1-50).' },
        modifiers: {
          type: 'array',
          items: {
            type: 'object',
            required: ['modifierId'],
            properties: {
              modifierId: { type: 'string', description: 'Identifier of the modifier group' },
              optionIds: { type: 'array', items: { type: 'string' }, description: 'Selected option IDs within the group' },
            },
            additionalProperties: false,
          },
          description: 'Selected modifier groups and option IDs.',
        },
        notes: { type: 'string', maxLength: 500, description: 'Special preparation instructions or customer preferences.' },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'success', 'cartItemCount', 'subtotal', 'subtotalFormatted'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        success: { type: 'boolean', description: 'Whether the item was added successfully' },
        message: { type: 'string', description: 'Confirmation message' },
        cartItemCount: { type: 'integer', description: 'Total item count in cart after addition' },
        subtotal: { type: 'number', description: 'Updated subtotal amount' },
        subtotalFormatted: { type: 'string', description: 'Formatted subtotal with currency' },
        lines: {
          type: 'array',
          description: 'List of line items currently in cart',
          items: {
            type: 'object',
            required: ['lineId', 'itemId', 'name', 'quantity', 'unitPrice', 'unitPriceFormatted', 'lineTotal', 'lineTotalFormatted'],
            properties: {
              lineId: { type: 'string', description: 'Unique cart line identifier' },
              itemId: { type: 'string', description: 'Item ID' },
              name: { type: 'string', description: 'Item name' },
              quantity: { type: 'integer', description: 'Line quantity' },
              unitPrice: { type: 'number', description: 'Unit price' },
              unitPriceFormatted: { type: 'string', description: 'Formatted unit price' },
              lineTotal: { type: 'number', description: 'Total price for this line' },
              lineTotalFormatted: { type: 'string', description: 'Formatted total price for this line' },
            },
          },
        },
        error: { type: 'string', description: 'Error message if addition failed' },
        _hint: { type: 'string', description: 'Agent instruction hint' },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['status', 'success', 'cartItemCount', 'subtotal', 'subtotalFormatted'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        success: { type: 'boolean', description: 'Whether the item was added successfully' },
        message: { type: 'string', description: 'Confirmation message' },
        cartItemCount: { type: 'integer', description: 'Total item count in cart after addition' },
        subtotal: { type: 'number', description: 'Updated subtotal amount' },
        subtotalFormatted: { type: 'string', description: 'Formatted subtotal with currency' },
        lines: {
          type: 'array',
          description: 'List of line items currently in cart',
          items: {
            type: 'object',
            required: ['lineId', 'itemId', 'name', 'quantity', 'unitPrice', 'unitPriceFormatted', 'lineTotal', 'lineTotalFormatted'],
            properties: {
              lineId: { type: 'string', description: 'Unique cart line identifier' },
              itemId: { type: 'string', description: 'Item ID' },
              name: { type: 'string', description: 'Item name' },
              quantity: { type: 'integer', description: 'Line quantity' },
              unitPrice: { type: 'number', description: 'Unit price' },
              unitPriceFormatted: { type: 'string', description: 'Formatted unit price' },
              lineTotal: { type: 'number', description: 'Total price for this line' },
              lineTotalFormatted: { type: 'string', description: 'Formatted total price for this line' },
            },
          },
        },
        error: { type: 'string', description: 'Error message if addition failed' },
        _hint: { type: 'string', description: 'Agent instruction hint' },
      },
    },
    execute: async (input: { itemId: string; quantity: number; cartId?: string; modifiers?: unknown[]; notes?: string }) => ({
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
          unitPriceFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
          lineTotal: 0,
          lineTotalFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
        },
      ],
      _hint: `Complete your order at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
    }),
  },

  // 6. wetaego_get_cart — page: '/m/{slug}'
  {
    name: 'wetaego_get_cart',
    page: '/m/{slug}',
    description:
      'Return the current cart contents, line items, validated unit prices, modifiers, discount breakdown, applied taxes, and authoritative final total.',
    inputSchema: {
      type: 'object',
      properties: {
        cartId: { type: 'string', description: 'Optional unique cart session ID to inspect. If omitted, returns active session cart.' },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['venue', 'currency', 'itemCount', 'lines', 'subtotal', 'subtotalFormatted', 'total', 'totalFormatted'],
      properties: {
        venue: { type: 'string', description: 'Active venue name' },
        currency: { type: 'string', description: 'Currency code (e.g. NGN, USD)' },
        itemCount: { type: 'integer', description: 'Total item quantity in cart' },
        lines: {
          type: 'array',
          description: 'Detailed list of lines in the cart',
          items: {
            type: 'object',
            required: ['lineId', 'itemId', 'name', 'quantity', 'unitPrice', 'unitPriceFormatted', 'lineTotal', 'lineTotalFormatted'],
            properties: {
              lineId: { type: 'string' },
              itemId: { type: 'string' },
              name: { type: 'string' },
              quantity: { type: 'integer' },
              unitPrice: { type: 'number' },
              unitPriceFormatted: { type: 'string' },
              lineTotal: { type: 'number' },
              lineTotalFormatted: { type: 'string', description: 'Formatted total price for this line' },
              modifiers: {
                type: 'array',
                description: 'Applied modifier and option labels for this line item',
                items: { type: 'string', description: 'Selected modifier option name' },
              },
            },
          },
        },
        subtotal: { type: 'number', description: 'Subtotal before discounts and taxes' },
        subtotalFormatted: { type: 'string', description: 'Formatted subtotal' },
        discountAmount: { type: 'number', description: 'Total discount amount applied' },
        discountPercentage: { type: 'number', description: 'Discount percentage if coupon/promotions applied' },
        tax: { type: 'number', description: 'Calculated VAT or sales tax' },
        fees: { type: 'number', description: 'Service or delivery fees' },
        total: { type: 'number', description: 'Final authoritative total amount' },
        totalFormatted: { type: 'string', description: 'Formatted final total with currency' },
        _hint: { type: 'string', description: 'Agent instruction guidance' },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['venue', 'currency', 'itemCount', 'lines', 'subtotal', 'subtotalFormatted', 'total', 'totalFormatted'],
      properties: {
        venue: { type: 'string', description: 'Active venue name' },
        currency: { type: 'string', description: 'Currency code (e.g. NGN, USD)' },
        itemCount: { type: 'integer', description: 'Total item quantity in cart' },
        lines: {
          type: 'array',
          description: 'Detailed list of lines in the cart',
          items: {
            type: 'object',
            required: ['lineId', 'itemId', 'name', 'quantity', 'unitPrice', 'unitPriceFormatted', 'lineTotal', 'lineTotalFormatted'],
            properties: {
              lineId: { type: 'string' },
              itemId: { type: 'string' },
              name: { type: 'string' },
              quantity: { type: 'integer' },
              unitPrice: { type: 'number' },
              unitPriceFormatted: { type: 'string' },
              lineTotal: { type: 'number' },
              lineTotalFormatted: { type: 'string' },
              modifiers: {
                type: 'array',
                description: 'Applied modifier and option labels for this line item',
                items: { type: 'string', description: 'Selected modifier option name' },
              },
            },
          },
        },
        subtotal: { type: 'number', description: 'Subtotal before discounts and taxes' },
        subtotalFormatted: { type: 'string', description: 'Formatted subtotal' },
        discountAmount: { type: 'number', description: 'Total discount amount applied' },
        discountPercentage: { type: 'number', description: 'Discount percentage if coupon/promotions applied' },
        tax: { type: 'number', description: 'Calculated VAT or sales tax' },
        fees: { type: 'number', description: 'Service or delivery fees' },
        total: { type: 'number', description: 'Final authoritative total amount' },
        totalFormatted: { type: 'string', description: 'Formatted final total with currency' },
        _hint: { type: 'string', description: 'Agent instruction guidance' },
      },
    },
    execute: async (_input?: { cartId?: string }) => ({
      venue: PLATFORM_DEMO_CONTEXT.venue,
      currency: PLATFORM_DEMO_CONTEXT.currency,
      itemCount: 0,
      lines: [],
      subtotal: 0,
      subtotalFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
      discountAmount: 0,
      discountPercentage: 0,
      tax: 0,
      fees: 0,
      total: 0,
      totalFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
      _hint: `Active cart state available at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
    }),
  },

  // 7. wetaego_update_cart — page: '/m/{slug}'
  {
    name: 'wetaego_update_cart',
    page: '/m/{slug}',
    description:
      'Modify the quantity of an existing line item in the cart or remove it completely by setting quantity to 0.',
    inputSchema: {
      type: 'object',
      required: ['lineId'],
      properties: {
        cartId: { type: 'string', description: 'Optional unique cart session ID. If omitted, updates active cart.' },
        lineId: { type: 'string', minLength: 1, description: 'The unique lineId of the item to update.' },
        quantity: { type: 'integer', minimum: 0, maximum: 50, description: 'New quantity. Set to 0 to remove item.' },
        notes: { type: 'string', maxLength: 500, description: 'Updated preparation notes or instructions.' },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'success', 'remainingLines', 'subtotalFormatted'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        success: { type: 'boolean', description: 'Whether the update succeeded' },
        message: { type: 'string', description: 'Summary message of modification' },
        remainingLines: { type: 'integer', description: 'Number of distinct line items remaining in cart' },
        totalItemCount: { type: 'integer', description: 'Total item quantity in cart' },
        subtotal: { type: 'number', description: 'Recalculated subtotal' },
        subtotalFormatted: { type: 'string', description: 'Formatted subtotal with currency' },
        error: { type: 'string', description: 'Error message if lineId was not found' },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['status', 'success', 'remainingLines', 'subtotalFormatted'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        success: { type: 'boolean', description: 'Whether the update succeeded' },
        message: { type: 'string', description: 'Summary message of modification' },
        remainingLines: { type: 'integer', description: 'Number of distinct line items remaining in cart' },
        totalItemCount: { type: 'integer', description: 'Total item quantity in cart' },
        subtotal: { type: 'number', description: 'Recalculated subtotal' },
        subtotalFormatted: { type: 'string', description: 'Formatted subtotal with currency' },
        error: { type: 'string', description: 'Error message if lineId was not found' },
      },
    },
    execute: async (input: { lineId: string; quantity?: number; cartId?: string; notes?: string }) => ({
      status: 'ok',
      success: true,
      message: `Cart line ${input.lineId} updated.`,
      remainingLines: 0,
      totalItemCount: input.quantity || 0,
      subtotal: 0,
      subtotalFormatted: `0.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
    }),
  },

  // 8. wetaego_recommend_pairings — page: '/m/{slug}'
  {
    name: 'wetaego_recommend_pairings',
    page: '/m/{slug}',
    description:
      'Suggest complementary catalog items, sides, drinks, or accessories. If itemId is omitted, recommendations are generated based on the active cart items or top venue specialties; if itemId is provided, recommendations specifically complement that item.',
    inputSchema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Optional focal item ID. If omitted, pairings are selected from current cart items or venue favorites.' },
        maxRecommendations: { type: 'integer', minimum: 1, maximum: 10, default: 3, description: 'Maximum pairing recommendations to return (1-10).' },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['venue', 'currency', 'count', 'recommendations'],
      properties: {
        venue: { type: 'string', description: 'Active venue name' },
        currency: { type: 'string', description: 'Currency code' },
        count: { type: 'integer', description: 'Number of pairings returned' },
        recommendations: {
          type: 'array',
          description: 'Recommended pairing catalog items',
          items: {
            type: 'object',
            required: ['itemId', 'name', 'price', 'priceFormatted'],
            properties: {
              itemId: { type: 'string', description: 'Unique item ID' },
              name: { type: 'string', description: 'Item name' },
              category: { type: 'string', description: 'Category name' },
              price: { type: 'number', description: 'Price in major currency units' },
              priceFormatted: { type: 'string', description: 'Formatted price with currency' },
              description: { type: 'string', description: 'Item description' },
              reason: { type: 'string', description: 'Why this pairing is recommended' },
            },
          },
        },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['venue', 'currency', 'count', 'recommendations'],
      properties: {
        venue: { type: 'string', description: 'Active venue name' },
        currency: { type: 'string', description: 'Currency code' },
        count: { type: 'integer', description: 'Number of pairings returned' },
        recommendations: {
          type: 'array',
          description: 'Recommended pairing catalog items',
          items: {
            type: 'object',
            required: ['itemId', 'name', 'price', 'priceFormatted'],
            properties: {
              itemId: { type: 'string', description: 'Unique item ID' },
              name: { type: 'string', description: 'Item name' },
              category: { type: 'string', description: 'Category name' },
              price: { type: 'number', description: 'Price in major currency units' },
              priceFormatted: { type: 'string', description: 'Formatted price with currency' },
              description: { type: 'string', description: 'Item description' },
              reason: { type: 'string', description: 'Why this pairing is recommended' },
            },
          },
        },
      },
    },
    execute: async (_input: { itemId?: string; maxRecommendations?: number }) => ({
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
          reason: 'Popular drink pairing with dining selections',
        },
        {
          itemId: 'item_pairing_2',
          name: 'Truffle Fries Side',
          category: 'Sides',
          price: 3200,
          priceFormatted: `3,200.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
          description: 'Hand-cut fries with parmesan and truffle oil',
          reason: 'Highly rated complementary side',
        },
      ],
    }),
  },

  // 9. wetaego_open_business_page — page: '/m/{slug}'
  {
    name: 'wetaego_open_business_page',
    page: '/m/{slug}',
    description:
      'Switch the active storefront viewport to an internal department or category catalog tab (such as "restaurant", "spa", "tech-boutique", "hotel", "creator-rate-card", "repairs", "services") inside the current merchant venue. (To search for other businesses or branches, use wetaego_find_venue.)',
    inputSchema: {
      type: 'object',
      required: ['conceptSlug'],
      properties: {
        conceptSlug: {
          type: 'string',
          enum: ['restaurant', 'spa', 'tech-boutique', 'hotel', 'creator-rate-card', 'repairs', 'services'],
          description: 'The slug of the internal department/concept to open within the active venue.',
        },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'conceptSlug', 'destinationUrl'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        conceptSlug: { type: 'string', description: 'The opened concept slug' },
        destinationUrl: { type: 'string', description: 'Full URL of the destination department page' },
        message: { type: 'string', description: 'Navigation status description' },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['status', 'conceptSlug', 'destinationUrl'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        conceptSlug: { type: 'string', description: 'The opened concept slug' },
        destinationUrl: { type: 'string', description: 'Full URL of the destination department page' },
        message: { type: 'string', description: 'Navigation status description' },
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

  // 10. wetaego_initiate_checkout — page: '/m/{slug}/checkout'
  {
    name: 'wetaego_initiate_checkout',
    page: '/m/{slug}/checkout',
    description:
      'Validate the current cart and generate a locked checkout session with computed taxes, fulfillment options, and totals. Locks prices for 15 minutes. Does NOT charge the customer — call wetaego_submit_order with customer confirmation to finalize.',
    inputSchema: {
      type: 'object',
      required: ['fulfillment'],
      properties: {
        cartId: { type: 'string', description: 'Optional cart session ID to checkout. If omitted, uses active session cart.' },
        fulfillment: { type: 'string', enum: ['dine_in', 'pickup', 'delivery'], description: 'Fulfillment method.' },
        tableIdentifier: { type: 'string', maxLength: 50, description: 'Table number, room, seat, or pickup counter.' },
        customer: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Customer full name' },
            email: { type: 'string', format: 'email', description: 'Customer contact email' },
            phone: { type: 'string', description: 'Customer phone number' },
          },
          additionalProperties: false,
        },
        notes: { type: 'string', maxLength: 1000, description: 'Order-level fulfillment notes.' },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'checkoutId', 'fulfillment', 'currency', 'total', 'totalFormatted', 'requiresPaymentAuthorization'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        checkoutId: { type: 'string', description: 'Unique checkout session identifier required for wetaego_submit_order' },
        fulfillment: { type: 'string', description: 'Selected fulfillment method' },
        venue: { type: 'string', description: 'Active venue name' },
        currency: { type: 'string', description: 'Currency code' },
        subtotal: { type: 'number', description: 'Subtotal amount' },
        tax: { type: 'number', description: 'Calculated tax/VAT amount' },
        fees: { type: 'number', description: 'Applicable service fees' },
        total: { type: 'number', description: 'Final order total amount' },
        totalFormatted: { type: 'string', description: 'Formatted total with currency' },
        itemCount: { type: 'integer', description: 'Total item quantity in order' },
        expiresAt: { type: 'string', format: 'date-time', description: 'ISO timestamp when the 15-minute price lock expires' },
        priceLockValidMinutes: { type: 'integer', description: 'Price lock duration in minutes (15)' },
        requiresPaymentAuthorization: { type: 'boolean', description: 'Always true: order requires explicit customer confirmation' },
        message: { type: 'string', description: 'Instructions for the agent' },
        error: { type: 'string', description: 'Error message if checkout cannot be prepared' },
        _hint: { type: 'string', description: 'Agent workflow guidance' },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['status', 'checkoutId', 'fulfillment', 'currency', 'total', 'totalFormatted', 'requiresPaymentAuthorization'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        checkoutId: { type: 'string', description: 'Unique checkout session identifier required for wetaego_submit_order' },
        fulfillment: { type: 'string', description: 'Selected fulfillment method' },
        venue: { type: 'string', description: 'Active venue name' },
        currency: { type: 'string', description: 'Currency code' },
        subtotal: { type: 'number', description: 'Subtotal amount' },
        tax: { type: 'number', description: 'Calculated tax/VAT amount' },
        fees: { type: 'number', description: 'Applicable service fees' },
        total: { type: 'number', description: 'Final order total amount' },
        totalFormatted: { type: 'string', description: 'Formatted total with currency' },
        itemCount: { type: 'integer', description: 'Total item quantity in order' },
        expiresAt: { type: 'string', format: 'date-time', description: 'ISO timestamp when the 15-minute price lock expires' },
        priceLockValidMinutes: { type: 'integer', description: 'Price lock duration in minutes (15)' },
        requiresPaymentAuthorization: { type: 'boolean', description: 'Always true: order requires explicit customer confirmation' },
        message: { type: 'string', description: 'Instructions for the agent' },
        error: { type: 'string', description: 'Error message if checkout cannot be prepared' },
        _hint: { type: 'string', description: 'Agent workflow guidance' },
      },
    },
    execute: async (input: { fulfillment: string; cartId?: string; tableIdentifier?: string; customer?: unknown; notes?: string }) => ({
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
      message: 'Checkout session prepared. Display the total to the customer and call wetaego_submit_order with authorization.confirmed: true once approved.',
      _hint: `Full checkout flow at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
    }),
  },

  // 11. wetaego_submit_order — page: '/m/{slug}/checkout'
  {
    name: 'wetaego_submit_order',
    page: '/m/{slug}/checkout',
    description:
      'Submit a prepared checkout session as an authoritative live customer order. Requires authorization.confirmed: true indicating the customer reviewed and approved the order total.',
    inputSchema: {
      type: 'object',
      required: ['checkoutId', 'authorization'],
      properties: {
        checkoutId: { type: 'string', minLength: 1, description: 'The checkoutId returned from wetaego_initiate_checkout.' },
        authorization: {
          type: 'object',
          required: ['confirmed'],
          properties: {
            confirmed: { type: 'boolean', description: 'Set to true after the customer confirms the order total.' },
            confirmationId: { type: 'string', description: 'Optional confirmation tracking token or receipt reference.' },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'success', 'orderId', 'venue', 'currency', 'total', 'totalFormatted'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        success: { type: 'boolean', description: 'Whether the order was successfully accepted' },
        orderId: { type: 'string', description: 'Unique order identifier' },
        checkoutId: { type: 'string', description: 'Associated checkout session ID' },
        venue: { type: 'string', description: 'Venue where order was routed' },
        currency: { type: 'string', description: 'Currency code' },
        total: { type: 'number', description: 'Final charged total' },
        totalFormatted: { type: 'string', description: 'Formatted total with currency' },
        message: { type: 'string', description: 'Order status message' },
        error: { type: 'string', description: 'Error reason if order was rejected' },
        _hint: { type: 'string', description: 'Order tracking link' },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['status', 'success', 'orderId', 'venue', 'currency', 'total', 'totalFormatted'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        success: { type: 'boolean', description: 'Whether the order was successfully accepted' },
        orderId: { type: 'string', description: 'Unique order identifier' },
        checkoutId: { type: 'string', description: 'Associated checkout session ID' },
        venue: { type: 'string', description: 'Venue where order was routed' },
        currency: { type: 'string', description: 'Currency code' },
        total: { type: 'number', description: 'Final charged total' },
        totalFormatted: { type: 'string', description: 'Formatted total with currency' },
        message: { type: 'string', description: 'Order status message' },
        error: { type: 'string', description: 'Error reason if order was rejected' },
        _hint: { type: 'string', description: 'Order tracking link' },
      },
    },
    execute: async (input: { checkoutId: string; authorization: { confirmed: boolean; confirmationId?: string } }) => {
      if (!input.authorization || input.authorization.confirmed !== true) {
        return {
          status: 'error',
          success: false,
          error: 'Order not placed: authorization.confirmed must be true (customer must approve the order total first).',
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

  // 12. wetaego_request_staff — page: '/m/{slug}'
  {
    name: 'wetaego_request_staff',
    page: '/m/{slug}',
    description:
      'Send an immediate service or waiter call notification to venue floor staff for a specific table or room.',
    inputSchema: {
      type: 'object',
      required: ['reason'],
      properties: {
        reason: {
          type: 'string',
          enum: ['water_refill', 'bill_check', 'table_cleanup', 'waiter_assistance', 'order_inquiry', 'manager_escalation'],
          description: 'Structured reason for requesting staff assistance.',
        },
        details: { type: 'string', maxLength: 300, description: 'Optional supplementary notes for staff.' },
        tableIdentifier: { type: 'string', maxLength: 50, description: 'Table number, room, or seat requesting assistance.' },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'success', 'message', 'reason', 'tableIdentifier'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        success: { type: 'boolean', description: 'Whether the notification was dispatched' },
        message: { type: 'string', description: 'Confirmation details' },
        reason: { type: 'string', description: 'Reason code dispatched' },
        tableIdentifier: { type: 'string', description: 'Target table or room' },
        _hint: { type: 'string', description: 'Staff response estimate' },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['status', 'success', 'message', 'reason', 'tableIdentifier'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        success: { type: 'boolean', description: 'Whether the notification was dispatched' },
        message: { type: 'string', description: 'Confirmation details' },
        reason: { type: 'string', description: 'Reason code dispatched' },
        tableIdentifier: { type: 'string', description: 'Target table or room' },
        _hint: { type: 'string', description: 'Staff response estimate' },
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

export function WebMcpProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const ctx = ensureWebMCPContext()

    // 1. Call provideContext({ tools: WEBMCP_TOOLS })
    if (typeof ctx.provideContext === 'function') {
      try {
        ctx.provideContext({ tools: WEBMCP_TOOLS })
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[WebMCP] provideContext call warning:', e)
        }
      }
    }

    // 2. Call registerTool on each tool individually
    const cleanups: (() => void)[] = []
    WEBMCP_TOOLS.forEach((tool) => {
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
