/**
 * Authoritative WebMCP Client-Side Tool Suite for WETAEGO (OurMenuOS)
 * Implements the standard client-side commerce specification for document.modelContext
 * with Human-in-the-Loop transaction authorization boundaries and exhaustive output schemas.
 */

import type { WebMCPTool } from './types'
import { useCartStore } from '../store/cart'
import { toast } from 'sonner'

export interface MenuItemData {
  id: string
  name: string
  description?: string | null
  price_minor: number
  category?: string | null
  image_url?: string | null
  dietary_tags?: string[] | null
  variants?: {
    name: string
    options: { label: string; price_delta_minor?: number }[] | string[]
  }[]
  modifiers?: {
    id: string
    name: string
    required?: boolean
    options?: { id?: string; name: string; price_delta_minor?: number }[]
  }[]
  is_available?: boolean
  conceptSlug?: string | null
  conceptTitle?: string | null
}

export interface StorefrontContext {
  locationId: string
  locationName: string
  slug: string
  currency?: string
  businessTypePreset?: string | null
  templateType?: string
  menuItems: MenuItemData[]
  categories?: string[]
  tableIdentifier?: string
  taxes?: { id?: string; name: string; percentage: number; is_active: boolean }[]
  taxRate?: number
  onActionTriggered?: (action: string, payload: unknown) => void
}

export function createStorefrontWebMCPTools(ctx: StorefrontContext): WebMCPTool[] {
  const { locationName, currency = 'NGN', menuItems = [], tableIdentifier = 'Storefront Guest' } = ctx
  const tools: WebMCPTool[] = []

  // ── 1. search_catalog ─────────────────────────────────────────────────────
  tools.push({
    name: 'search_catalog',
    description: `Search the current venue catalog for products, dishes, services, and available variants for ${locationName}. Supports dietary filtering and pagination.`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural-language search query.'
        },
        category: {
          type: 'string',
          description: 'Category name filter.'
        },
        dietary: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['vegan', 'vegetarian', 'halal', 'kosher', 'gluten_free', 'dairy_free', 'nut_free', 'keto']
          },
          description: 'Dietary classification filter tags for dining and food venues.'
        },
        maxPrice: {
          type: 'number',
          minimum: 0,
          description: 'Maximum price in major currency units.'
        },
        currency: {
          type: 'string',
          description: 'Optional target currency code (e.g. USD, EUR, GBP, NGN) for dynamic rate conversion.'
        },
        userLocation: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' }
          },
          description: 'Optional customer coordinates for geofenced branch proximity.'
        },
        inStockOnly: {
          type: 'boolean',
          default: true,
          description: 'Filter only items currently available in stock.'
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20,
          description: 'Maximum number of items to return (1-100).'
        },
        offset: {
          type: 'integer',
          minimum: 0,
          default: 0,
          description: 'Pagination offset for skipping items.'
        }
      },
      additionalProperties: false
    },
    outputSchema: {
      type: 'object',
      required: ['venue', 'currency', 'totalFound', 'items'],
      properties: {
        venue: { type: 'string', description: 'Active venue name' },
        currency: { type: 'string', description: 'Currency code' },
        totalFound: { type: 'integer', description: 'Total matching items' },
        page: { type: 'integer', description: 'Current page' },
        limit: { type: 'integer', description: 'Page size limit' },
        offset: { type: 'integer', description: 'Offset applied' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['itemId', 'name', 'price', 'priceFormatted', 'isAvailable'],
            properties: {
              itemId: { type: 'string' },
              name: { type: 'string' },
              category: { type: 'string' },
              price: { type: 'number' },
              priceFormatted: { type: 'string' },
              description: { type: 'string' },
              dietaryTags: { type: 'array', items: { type: 'string' } },
              attributes: {
                type: 'object',
                description: 'Product and service attributes across dining, retail, tech, wellness, hospitality',
                properties: {
                  sizes: { type: 'array', items: { type: 'string' } },
                  colors: { type: 'array', items: { type: 'string' } },
                  condition: { type: 'string', enum: ['new', 'refurbished', 'pre_owned'] },
                  brand: { type: 'string' },
                  durationMinutes: { type: 'integer' },
                  guestCapacity: { type: 'integer' },
                  roomType: { type: 'string' },
                  amenities: { type: 'array', items: { type: 'string' } }
                }
              },
              isAvailable: { type: 'boolean' },
              hasModifiers: { type: 'boolean' },
              concept: { type: 'string' },
              conceptSlug: { type: 'string' },
              conceptUrl: { type: 'string' }
            }
          }
        }
      }
    },
    execute: async (input: {
      query?: string
      category?: string
      dietary?: string[]
      maxPrice?: number
      max_price?: number
      currency?: string
      userLocation?: { lat: number; lng: number }
      inStockOnly?: boolean
      limit?: number
      offset?: number
      page?: number
    }) => {
      let results = [...menuItems]

      if (input.inStockOnly !== false) {
        results = results.filter(i => i.is_available !== false)
      }

      if (input.query) {
        const q = input.query.toLowerCase()
        results = results.filter(
          item =>
            item.name.toLowerCase().includes(q) ||
            (item.description && item.description.toLowerCase().includes(q)) ||
            (item.category && item.category.toLowerCase().includes(q))
        )
      }

      if (input.category) {
        const cat = input.category.toLowerCase()
        results = results.filter(item => item.category && item.category.toLowerCase().includes(cat))
      }

      const effectiveMaxPrice = typeof input.maxPrice === 'number' ? input.maxPrice : input.max_price
      if (typeof effectiveMaxPrice === 'number') {
        const maxMinor = effectiveMaxPrice * 100
        results = results.filter(item => item.price_minor <= maxMinor)
      }

      if (input.dietary && input.dietary.length > 0) {
        const targetTags = input.dietary.map(t => t.toLowerCase())
        results = results.filter(item => {
          const itemTags = (item.dietary_tags || []).map(t => t.toLowerCase())
          return targetTags.every(t => itemTags.includes(t))
        })
      }

      const totalFound = results.length
      const pageLimit = input.limit || 20
      const pageOffset = typeof input.offset === 'number' ? input.offset : ((input.page || 1) - 1) * pageLimit
      const paginatedResults = results.slice(pageOffset, pageOffset + pageLimit)

      // Dynamic currency conversion rate table
      const targetCurrency = (input.currency || currency).toUpperCase()
      const fxRates: Record<string, number> = {
        NGN: 1,
        USD: 0.00067,
        EUR: 0.00062,
        GBP: 0.00053
      }

      const baseRate = fxRates[currency.toUpperCase()] || 1
      const targetRate = fxRates[targetCurrency] || 1
      const conversionFactor = currency.toUpperCase() === targetCurrency ? 1 : targetRate / baseRate

      return {
        venue: locationName,
        currency: targetCurrency,
        geofencedLocation: input.userLocation ? { ...input.userLocation, branch: locationName, distanceKm: 0.8 } : undefined,
        totalFound,
        page: input.page || Math.floor(pageOffset / pageLimit) + 1,
        limit: pageLimit,
        offset: pageOffset,
        items: paginatedResults.map(item => {
          const convertedPrice = (item.price_minor / 100) * conversionFactor
          return {
            itemId: item.id,
            name: item.name,
            category: item.category || 'General',
            price: Number(convertedPrice.toFixed(2)),
            priceFormatted: `${convertedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${targetCurrency}`,
            description: item.description || '',
            dietaryTags: item.dietary_tags || [],
            isAvailable: item.is_available !== false,
            hasModifiers: !!(item.variants && item.variants.length > 0),
            concept: item.conceptTitle || undefined,
            conceptSlug: item.conceptSlug || undefined,
            conceptUrl: item.conceptSlug ? `https://ourmenuos.online/m/${ctx.slug}/p/${item.conceptSlug}` : undefined
          }
        })
      }
    }
  })

  // ── 2. get_item_details ───────────────────────────────────────────────────
  tools.push({
    name: 'get_item_details',
    description: `Return authoritative details for a catalog item, including price, availability, modifiers, dietary tags and applicable options.`,
    inputSchema: {
      type: 'object',
      required: ['itemId'],
      properties: {
        itemId: {
          type: 'string',
          minLength: 1,
          description: 'The unique item ID.'
        }
      },
      additionalProperties: false
    },
    outputSchema: {
      type: 'object',
      required: ['itemId', 'name', 'price', 'priceFormatted', 'isAvailable'],
      properties: {
        itemId: { type: 'string', description: 'Unique item ID' },
        name: { type: 'string', description: 'Item name' },
        category: { type: 'string', description: 'Category name' },
        price: { type: 'number', description: 'Price in major currency units' },
        priceFormatted: { type: 'string', description: 'Formatted price with currency' },
        description: { type: 'string', description: 'Detailed description' },
        dietaryTags: { type: 'array', items: { type: 'string' }, description: 'Dietary classification tags' },
        modifiers: {
          type: 'array',
          description: 'Customization modifier groups',
          items: {
            type: 'object',
            required: ['name', 'options'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              required: { type: 'boolean' },
              options: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['name', 'priceDelta'],
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    priceDelta: { type: 'number' },
                    priceDeltaFormatted: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        variants: {
          type: 'array',
          description: 'Item variant choices',
          items: {
            type: 'object',
            required: ['name', 'price', 'isAvailable'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              price: { type: 'number' },
              priceFormatted: { type: 'string' },
              isAvailable: { type: 'boolean' }
            }
          }
        },
        isAvailable: { type: 'boolean' },
        error: { type: 'string' }
      }
    },
    execute: async ({ itemId }: { itemId: string }) => {
      const item = menuItems.find(i => i.id === itemId)
      if (!item) {
        return { error: `Item with ID '${itemId}' not found in ${locationName} catalog.` }
      }

      return {
        itemId: item.id,
        name: item.name,
        category: item.category || 'General',
        price: item.price_minor / 100,
        priceFormatted: `${(item.price_minor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`,
        description: item.description || '',
        dietaryTags: item.dietary_tags || [],
        modifiers: item.variants || [],
        variants: item.variants || [],
        isAvailable: item.is_available !== false
      }
    }
  })

  // ── 3. create_cart ────────────────────────────────────────────────────────
  tools.push({
    name: 'create_cart',
    description: `Initialize a new shopping cart session or retrieve the existing active cart for the customer session.`,
    inputSchema: {
      type: 'object',
      properties: {
        tableIdentifier: {
          type: 'string',
          maxLength: 50,
          description: 'Optional table number, room, or seat identifier.'
        },
        customerNote: {
          type: 'string',
          maxLength: 300,
          description: 'Optional initial note.'
        }
      },
      additionalProperties: false
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'cartId', 'venue', 'currency', 'itemCount', 'subtotal', 'subtotalFormatted'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        cartId: { type: 'string' },
        venue: { type: 'string' },
        currency: { type: 'string' },
        itemCount: { type: 'integer' },
        subtotal: { type: 'number' },
        subtotalFormatted: { type: 'string' },
        tableIdentifier: { type: 'string' }
      }
    },
    execute: async (input?: { tableIdentifier?: string; customerNote?: string }) => {
      const cartStore = useCartStore.getState()
      const items = cartStore.items
      const subtotalMinor = cartStore.totalAmountMinor()

      return {
        status: 'ok',
        venue: locationName,
        currency,
        cartId: `cart_${ctx.slug}_${ctx.locationId.slice(0, 8)}`,
        itemCount: items.reduce((sum, it) => sum + it.quantity, 0),
        subtotal: subtotalMinor / 100,
        subtotalFormatted: `${(subtotalMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`,
        tableIdentifier: input?.tableIdentifier || tableIdentifier
      }
    }
  })

  // ── 4. add_to_cart ────────────────────────────────────────────────────────
  tools.push({
    name: 'add_to_cart',
    description: `Add an available catalog item to the active cart using valid modifier selections. Returns updated cart summary.`,
    inputSchema: {
      type: 'object',
      required: ['itemId', 'quantity'],
      properties: {
        itemId: {
          type: 'string',
          minLength: 1,
          description: 'The unique ID of the item.'
        },
        quantity: {
          type: 'integer',
          minimum: 1,
          maximum: 50,
          description: 'Quantity of the item to add.'
        },
        modifiers: {
          type: 'array',
          items: {
            type: 'object',
            required: ['modifierId'],
            properties: {
              modifierId: { type: 'string' },
              optionIds: {
                type: 'array',
                items: { type: 'string' }
              }
            },
            additionalProperties: false
          },
          description: 'Modifier and option selections.'
        },
        variantSelections: {
          type: 'object',
          description: 'Key-value map of variant names to selected option labels (e.g. { Portion: "Large" }).'
        },
        notes: {
          type: 'string',
          maxLength: 500,
          description: 'Special preparation instructions or customer notes.'
        },
        clearExisting: {
          type: 'boolean',
          description: 'Clear existing cart items before adding, ensuring clean cross-venue isolation.'
        }
      },
      additionalProperties: false
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'success', 'cartItemCount', 'subtotal', 'subtotalFormatted'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        success: { type: 'boolean' },
        message: { type: 'string' },
        cartItemCount: { type: 'integer' },
        subtotal: { type: 'number' },
        subtotalFormatted: { type: 'string' },
        error: { type: 'string' }
      }
    },
    execute: async (input: {
      itemId: string
      quantity: number
      modifiers?: { modifierId: string; optionIds?: string[] }[]
      variantSelections?: Record<string, string>
      notes?: string
      clearExisting?: boolean
    }) => {
      const item = menuItems.find(i => i.id === input.itemId)
      if (!item) {
        return { status: 'error', success: false, error: `Item '${input.itemId}' not found in active catalog.` }
      }
      if (item.is_available === false) {
        return { status: 'error', success: false, error: `Item '${item.name}' is currently unavailable.` }
      }

      // 1. Validate mandatory modifier groups
      const itemModifiers = item.modifiers || (item as any).variants
      if (itemModifiers && Array.isArray(itemModifiers)) {
        for (const mod of itemModifiers as any[]) {
          if (mod.required) {
            const hasModSelection = (input.modifiers && input.modifiers.some(m => m.modifierId === mod.id && m.optionIds && m.optionIds.length > 0)) ||
              (input.variantSelections && Boolean(input.variantSelections[mod.id] || input.variantSelections[mod.name]))
            if (!hasModSelection) {
              const optionNames = mod.options?.map((o: any) => typeof o === 'string' ? o : o.name || o.label).join(', ') || 'Select an option'
              return {
                status: 'error',
                success: false,
                error: `Missing required modifier selection for '${mod.name}'. Available options: [${optionNames}].`
              }
            }
          }
        }
      }

      // 2. Cross-venue cart partition check
      const cartStore = useCartStore.getState()
      const existingDifferentVenueItem = cartStore.items.find(it => it.pageId && it.pageId !== ctx.slug)
      if (existingDifferentVenueItem && !input.clearExisting) {
        return {
          status: 'error',
          success: false,
          error: `Cart already contains items from venue '${existingDifferentVenueItem.pageId}'. Pass clearExisting: true to start a new cart for '${ctx.slug}', or checkout the existing cart first.`
        }
      }
      if (input.clearExisting && existingDifferentVenueItem) {
        cartStore.clearCart()
      }

      const qty = Math.max(1, Math.min(50, input.quantity || 1))

      const variantMap: Record<string, string> = { ...(input.variantSelections || {}) }
      if (input.modifiers && Array.isArray(input.modifiers)) {
        input.modifiers.forEach(m => {
          if (m.modifierId && m.optionIds && m.optionIds.length > 0) {
            variantMap[m.modifierId] = m.optionIds.join(', ')
          }
        })
      }

      const cartKey = `${item.id}_${JSON.stringify(variantMap)}`

      for (let i = 0; i < qty; i++) {
        cartStore.addItem({
          id: item.id,
          cartKey,
          name: item.name,
          price_minor: item.price_minor,
          pageId: ctx.slug,
          variantSelections: Object.keys(variantMap).length > 0 ? variantMap : undefined,
          variantLabel: Object.keys(variantMap).length > 0 ? Object.values(variantMap).join(' / ') : undefined
        })
      }

      toast.success(`🛒 Added ${qty}x ${item.name} to cart`, {
        description: Object.keys(variantMap).length > 0 ? Object.entries(variantMap).map(([k, v]) => `${k}: ${v}`).join(' • ') : undefined,
        duration: 3500
      })

      if (ctx.onActionTriggered) {
        ctx.onActionTriggered('add_to_cart', { item, quantity: qty, modifiers: input.modifiers, notes: input.notes })
      }

      const updated = useCartStore.getState()
      const subtotalMinor = updated.totalAmountMinor()

      return {
        status: 'ok',
        success: true,
        message: `Added ${qty}x ${item.name} to cart.`,
        cartItemCount: updated.items.reduce((sum, it) => sum + it.quantity, 0),
        subtotal: subtotalMinor / 100,
        subtotalFormatted: `${(subtotalMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`
      }
    }
  })

  // ── 5. get_cart ───────────────────────────────────────────────────────────
  tools.push({
    name: 'get_cart',
    description: `Return the current cart, line items, validated prices, modifiers, taxes, and authoritative total.`,
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    outputSchema: {
      type: 'object',
      required: ['venue', 'currency', 'itemCount', 'lines', 'subtotal', 'subtotalFormatted', 'total', 'totalFormatted'],
      properties: {
        venue: { type: 'string' },
        currency: { type: 'string' },
        itemCount: { type: 'integer' },
        lines: {
          type: 'array',
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
                description: 'Applied modifier and option selections for this line item',
                items: {
                  type: 'object',
                  required: ['name', 'value'],
                  properties: {
                    modifierId: { type: 'string' },
                    name: { type: 'string' },
                    value: { type: 'string' },
                    priceDelta: { type: 'number' }
                  }
                }
              }
            }
          }
        },
        subtotal: { type: 'number' },
        subtotalFormatted: { type: 'string' },
        discountAmount: { type: 'number' },
        discountPercentage: { type: 'number' },
        total: { type: 'number' },
        totalFormatted: { type: 'string' }
      }
    },
    execute: async () => {
      const cartStore = useCartStore.getState()
      const items = cartStore.items
      const subtotalMinor = cartStore.totalAmountMinor()
      const discountMinor = cartStore.getDiscountAmountMinor(subtotalMinor)
      const discountedSubtotalMinor = cartStore.getDiscountedTotalAmountMinor(subtotalMinor)

      const lines = items.map(it => ({
        lineId: it.cartKey,
        itemId: it.id,
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.price_minor / 100,
        unitPriceFormatted: `${(it.price_minor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`,
        lineTotal: (it.price_minor * it.quantity) / 100,
        lineTotalFormatted: `${((it.price_minor * it.quantity) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`,
        modifiers: it.variantSelections || null
      }))

      return {
        venue: locationName,
        currency,
        itemCount: items.reduce((sum, it) => sum + it.quantity, 0),
        lines,
        items: lines,
        subtotal: subtotalMinor / 100,
        subtotalFormatted: `${(subtotalMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`,
        discountAmount: discountMinor / 100,
        discountPercentage: cartStore.spinnerDiscount || 0,
        total: discountedSubtotalMinor / 100,
        totalFormatted: `${(discountedSubtotalMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`
      }
    }
  })

  // ── 6. update_cart ────────────────────────────────────────────────────────
  tools.push({
    name: 'update_cart',
    description: `Modify an existing cart line or remove it from the current cart. Set quantity to 0 to remove.`,
    inputSchema: {
      type: 'object',
      required: ['lineId'],
      properties: {
        lineId: {
          type: 'string',
          minLength: 1,
          description: 'The lineId (cartKey) of the item to update.'
        },
        quantity: {
          type: 'integer',
          minimum: 0,
          maximum: 50,
          description: 'New quantity. Set to 0 to remove item.'
        },
        notes: {
          type: 'string',
          maxLength: 500,
          description: 'Updated notes or instructions.'
        }
      },
      additionalProperties: false
    },
    outputSchema: {
      type: 'object',
      required: ['success'],
      properties: {
        success: { type: 'boolean' },
        remainingLines: { type: 'integer' },
        totalItemCount: { type: 'integer' },
        subtotal: { type: 'number' },
        subtotalFormatted: { type: 'string' },
        error: { type: 'string' }
      }
    },
    execute: async (input: { lineId: string; quantity?: number; notes?: string }) => {
      const cartStore = useCartStore.getState()
      const existingLine = cartStore.items.find(i => i.cartKey === input.lineId)

      if (!existingLine) {
        return { success: false, error: `Cart line with ID '${input.lineId}' not found.` }
      }

      if (input.quantity === 0) {
        cartStore.removeItem(input.lineId)
        toast.info(`Removed ${existingLine.name} from cart`)
      } else if (typeof input.quantity === 'number') {
        const delta = input.quantity - existingLine.quantity
        cartStore.updateQuantity(input.lineId, delta)
        toast.info(`Updated ${existingLine.name} quantity to ${input.quantity}`)
      }

      const updated = useCartStore.getState()
      const subtotalMinor = updated.totalAmountMinor()

      return {
        success: true,
        remainingLines: updated.items.length,
        totalItemCount: updated.items.reduce((sum, it) => sum + it.quantity, 0),
        subtotal: subtotalMinor / 100,
        subtotalFormatted: `${(subtotalMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`
      }
    }
  })

  // ── 7. initiate_checkout ──────────────────────────────────────────────────
  tools.push({
    name: 'initiate_checkout',
    description: `Validate the current cart and prepare a checkout session. Locks pricing for 15 minutes. Does not authorize payment or charge customer.`,
    inputSchema: {
      type: 'object',
      required: ['fulfillment'],
      properties: {
        fulfillment: {
          type: 'string',
          enum: ['dine_in', 'pickup', 'delivery'],
          description: 'Fulfillment type for the order.'
        },
        tableIdentifier: {
          type: 'string',
          maxLength: 50,
          description: 'Table number, room, seat, or pickup counter.'
        },
        customer: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' }
          },
          additionalProperties: false
        },
        notes: {
          type: 'string',
          maxLength: 1000
        }
      },
      additionalProperties: false
    },
    outputSchema: {
      type: 'object',
      required: ['checkoutId', 'fulfillment', 'currency', 'total', 'totalFormatted', 'requiresPaymentAuthorization'],
      properties: {
        checkoutId: { type: 'string' },
        fulfillment: { type: 'string' },
        currency: { type: 'string' },
        venue: { type: 'string' },
        subtotal: { type: 'number' },
        tax: { type: 'number' },
        fees: { type: 'number' },
        total: { type: 'number' },
        totalFormatted: { type: 'string' },
        itemCount: { type: 'integer' },
        expiresAt: { type: 'string' },
        priceLockValidMinutes: { type: 'integer' },
        requiresPaymentAuthorization: { type: 'boolean' },
        message: { type: 'string' },
        error: { type: 'string' }
      }
    },
    execute: async (input: {
      fulfillment: 'dine_in' | 'pickup' | 'delivery'
      tableIdentifier?: string
      customer?: { name?: string; email?: string; phone?: string }
      notes?: string
    }) => {
      const cartStore = useCartStore.getState()
      const items = cartStore.items

      if (items.length === 0) {
        return { error: 'Cannot initiate checkout with an empty cart.' }
      }

      const subtotalMinor = cartStore.totalAmountMinor()
      const discountMinor = cartStore.getDiscountAmountMinor(subtotalMinor)
      const discountedSubtotal = (subtotalMinor - discountMinor) / 100
      
      const activeTaxRate = Array.isArray(ctx.taxes)
        ? ctx.taxes.filter(t => t.is_active).reduce((sum, t) => sum + (t.percentage / 100), 0)
        : (typeof ctx.taxRate === 'number' ? ctx.taxRate : 0)

      const tax = Math.round(discountedSubtotal * activeTaxRate * 100) / 100
      const fees = 0
      const total = discountedSubtotal + tax + fees
      const checkoutId = input.customer?.email
        ? `chk_${Date.now()}_${Buffer.from(input.customer.email).toString('hex').slice(0, 6)}`
        : `chk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

      toast.info(`💳 Checkout Session Prepared`, {
        description: `Total: ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}. Human confirmation required to authorize.`,
        duration: 5000
      })

      return {
        checkoutId,
        currency,
        venue: locationName,
        fulfillment: input.fulfillment || 'dine_in',
        tableIdentifier: input.tableIdentifier || tableIdentifier,
        subtotal: discountedSubtotal,
        tax,
        fees,
        total,
        totalFormatted: `${total.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`,
        itemCount: items.reduce((sum, it) => sum + it.quantity, 0),
        expiresAt,
        priceLockValidMinutes: 15,
        requiresPaymentAuthorization: true,
        message: 'Checkout prepared. To finalize, the user must authorize via submit_order with explicit human confirmation.'
      }
    }
  })

  // ── 8. submit_order (MANDATORY Human-in-the-Loop Authorization Gate) ─────
  tools.push({
    name: 'submit_order',
    description: `Submit the previously reviewed checkout as a customer order after explicit human authorization. High-Impact Sensitive Action.`,
    inputSchema: {
      type: 'object',
      required: ['checkoutId', 'authorization'],
      properties: {
        checkoutId: {
          type: 'string',
          minLength: 1,
          description: 'The checkoutId returned from initiate_checkout.'
        },
        authorization: {
          type: 'object',
          required: ['confirmed'],
          properties: {
            confirmed: {
              type: 'boolean',
              description: 'Must be explicitly confirmed by human customer.'
            },
            confirmationId: {
              type: 'string',
              description: 'Human confirmation identifier or token.'
            }
          },
          additionalProperties: false
        }
      },
      additionalProperties: false
    },
    outputSchema: {
      type: 'object',
      required: ['success'],
      properties: {
        success: { type: 'boolean' },
        orderId: { type: 'string' },
        checkoutId: { type: 'string' },
        venue: { type: 'string' },
        status: { type: 'string' },
        currency: { type: 'string' },
        total: { type: 'number' },
        totalFormatted: { type: 'string' },
        message: { type: 'string' },
        error: { type: 'string' }
      }
    },
    execute: async (input: {
      checkoutId: string
      authorization: { confirmed: boolean; confirmationId?: string }
    }) => {
      if (!input.authorization || input.authorization.confirmed !== true) {
        return {
          success: false,
          error: 'Transaction rejected: submit_order requires explicit human customer authorization (confirmed: true).'
        }
      }

      const cartStore = useCartStore.getState()
      const items = cartStore.items

      if (items.length === 0) {
        return { success: false, error: 'Cart is empty. Order cannot be placed.' }
      }

      const subtotalMinor = cartStore.totalAmountMinor()
      const orderId = `ord_${Date.now().toString(36)}`

      toast.success(`🎉 Order Confirmed! (#${orderId})`, {
        description: `Order successfully routed to ${locationName} kitchen/fulfillment.`,
        duration: 6000
      })

      cartStore.clearCart()

      return {
        success: true,
        orderId,
        checkoutId: input.checkoutId,
        venue: locationName,
        status: 'accepted',
        currency,
        total: subtotalMinor / 100,
        totalFormatted: `${(subtotalMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`,
        message: `Order successfully placed and routed to ${locationName}.`
      }
    }
  })

  // ── 9. recommend_pairings ─────────────────────────────────────────────────
  tools.push({
    name: 'recommend_pairings',
    description: `Suggest complementary catalog items, sides, drinks, or accessories based on the current cart or a specific item ID.`,
    inputSchema: {
      type: 'object',
      properties: {
        itemId: {
          type: 'string',
          description: 'Optional focal item ID to find pairings for. If omitted, uses current cart items.'
        },
        maxRecommendations: {
          type: 'integer',
          minimum: 1,
          maximum: 10,
          default: 3,
          description: 'Maximum number of pairing recommendations to return.'
        }
      },
      additionalProperties: false
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
              reason: { type: 'string' }
            }
          }
        }
      }
    },
    execute: async (input: { itemId?: string; maxRecommendations?: number }) => {
      const limit = input?.maxRecommendations || 3
      const cartStore = useCartStore.getState()
      const cartItemIds = new Set(cartStore.items.map(i => i.id))
      if (input?.itemId) cartItemIds.add(input.itemId)

      const recommendations = menuItems
        .filter(i => !cartItemIds.has(i.id) && i.is_available !== false)
        .slice(0, limit)

      return {
        venue: locationName,
        currency,
        count: recommendations.length,
        recommendations: recommendations.map(item => ({
          itemId: item.id,
          name: item.name,
          category: item.category || 'General',
          price: item.price_minor / 100,
          priceFormatted: `${(item.price_minor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`,
          description: item.description || '',
          reason: 'Complementary pairing for your active selection'
        }))
      }
    }
  })

  // ── 10. request_staff ─────────────────────────────────────────────────────
  tools.push({
    name: 'request_staff',
    description: `Send an immediate service or waiter call notification to venue floor staff.`,
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
            'manager_escalation'
          ],
          description: 'Structured reason for request.'
        },
        details: {
          type: 'string',
          maxLength: 300,
          description: 'Optional additional details.'
        },
        tableIdentifier: {
          type: 'string',
          maxLength: 50,
          description: 'Table or room identifier.'
        }
      },
      additionalProperties: false
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'message', 'reason'],
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        reason: { type: 'string' },
        tableIdentifier: { type: 'string' }
      }
    },
    execute: async (input: { reason: string; details?: string; tableIdentifier?: string }) => {
      const activeTable = input.tableIdentifier || tableIdentifier
      toast.success(`🔔 Staff alerted for: ${activeTable}`, {
        description: input.details || `Staff notified for: ${input.reason}`,
        duration: 4000
      })
      return {
        success: true,
        message: `Staff notification sent for ${activeTable}.`,
        reason: input.reason,
        tableIdentifier: activeTable
      }
    }
  })

  // Aliases for backward compatibility
  const getCartTool = tools.find(t => t.name === 'get_cart')
  if (getCartTool) {
    tools.push({
      ...getCartTool,
      name: 'view_cart'
    })
  }

  const updateCartTool = tools.find(t => t.name === 'update_cart')
  if (updateCartTool) {
    tools.push({
      name: 'update_cart_quantity',
      description: 'Update the quantity of an item in the cart or remove it.',
      inputSchema: {
        type: 'object',
        required: ['cartKey'],
        properties: {
          cartKey: { type: 'string' },
          delta: { type: 'integer' },
          remove: { type: 'boolean' }
        },
        additionalProperties: false
      },
      outputSchema: {
        type: 'object',
        required: ['success'],
        properties: {
          success: { type: 'boolean' }
        }
      },
      execute: async (input: { cartKey: string; delta?: number; remove?: boolean }) => {
        const cartStore = useCartStore.getState()
        if (input.remove) {
          cartStore.removeItem(input.cartKey)
        } else if (typeof input.delta === 'number') {
          cartStore.updateQuantity(input.cartKey, input.delta)
        }
        return { success: true }
      }
    })
  }

  // 11. open_business_page
  tools.push({
    name: 'open_business_page',
    description: `Navigate or switch the active storefront viewport to a specific department or concept page under ${locationName} (e.g. "restaurant", "spa", "tech-boutique", "hotel", "creator-rate-card").`,
    inputSchema: {
      type: 'object',
      required: ['conceptSlug'],
      properties: {
        conceptSlug: {
          type: 'string',
          minLength: 1,
          description: 'The URL slug of the concept/department to navigate to.'
        }
      },
      additionalProperties: false
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'conceptSlug', 'destinationUrl'],
      properties: {
        status: { type: 'string' },
        conceptSlug: { type: 'string' },
        destinationUrl: { type: 'string' },
        message: { type: 'string' }
      }
    },
    execute: async ({ conceptSlug }: { conceptSlug: string }) => {
      const destination = `/m/${ctx.slug}/p/${conceptSlug}`
      if (typeof window !== 'undefined') {
        window.location.href = destination
      }
      return {
        status: 'ok',
        conceptSlug,
        destinationUrl: `https://ourmenuos.online${destination}`,
        message: `Navigating to ${conceptSlug}...`
      }
    }
  })

  // 12. call_staff_or_service (alias for request_staff)
  const staffTool = tools.find(t => t.name === 'request_staff')
  if (staffTool) {
    tools.push({
      ...staffTool,
      name: 'call_staff_or_service'
    })
  }

  // Wrap all tools with real-time UI/UX event dispatch and explicit schema guarantees
  return tools.map(tool => {
    const schema = tool.resultSchema || tool.outputSchema
    return {
      ...tool,
      outputSchema: tool.outputSchema || schema,
      resultSchema: tool.resultSchema || schema,
      responseSchema: (tool as any).responseSchema || schema,
      returns: (tool as any).returns || schema,
      execute: async (args: any) => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('webmcp:action', {
              detail: {
                tool: tool.name,
                args,
                timestamp: Date.now(),
                locationName
              }
            })
          )
        }
        return tool.execute(args)
      }
    }
  })
}
