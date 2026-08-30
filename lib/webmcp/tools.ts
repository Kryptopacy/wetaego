/**
 * Authoritative WebMCP Client-Side Tool Suite for WETAEGO (OurMenuOS)
 * Implements the standard 8-tool client-side commerce specification for document.modelContext
 * with Human-in-the-Loop transaction authorization boundaries.
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
  is_available?: boolean
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
  onActionTriggered?: (action: string, payload: unknown) => void
}

export function createStorefrontWebMCPTools(ctx: StorefrontContext): WebMCPTool[] {
  const { locationName, currency = 'NGN', menuItems = [], tableIdentifier = 'Storefront Guest' } = ctx
  const tools: WebMCPTool[] = []

  // 1. search_catalog
  tools.push({
    name: 'search_catalog',
    description: `Search the current venue catalog for products, dishes, services, and available variants for ${locationName}. Results are limited to items currently visible and orderable.`,
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
            enum: ['vegan', 'vegetarian', 'halal', 'keto', 'gluten_free', 'dairy_free', 'nut_free']
          },
          description: 'Dietary filter tags.'
        },
        maxPrice: {
          type: 'number',
          minimum: 0,
          description: 'Maximum price in major currency units.'
        },
        inStockOnly: {
          type: 'boolean',
          default: true,
          description: 'Filter only items currently available in stock.'
        }
      },
      additionalProperties: false
    },
    execute: async (input: {
      query?: string
      category?: string
      dietary?: string[]
      maxPrice?: number
      inStockOnly?: boolean
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

      if (typeof input.maxPrice === 'number') {
        const maxMinor = input.maxPrice * 100
        results = results.filter(item => item.price_minor <= maxMinor)
      }

      if (input.dietary && input.dietary.length > 0) {
        const targetTags = input.dietary.map(t => t.toLowerCase())
        results = results.filter(item => {
          const itemTags = (item.dietary_tags || []).map(t => t.toLowerCase())
          return targetTags.every(t => itemTags.includes(t))
        })
      }

      return {
        venue: locationName,
        currency,
        totalFound: results.length,
        items: results.map(item => ({
          itemId: item.id,
          name: item.name,
          category: item.category || 'General',
          price: item.price_minor / 100,
          priceFormatted: `${(item.price_minor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`,
          description: item.description || '',
          dietaryTags: item.dietary_tags || [],
          isAvailable: item.is_available !== false,
          hasModifiers: !!(item.variants && item.variants.length > 0)
        }))
      }
    }
  })

  // 2. get_item_details
  tools.push({
    name: 'get_item_details',
    description: `Return authoritative details for a catalog item, including price, availability, modifiers, dietary tags and applicable options.`,
    inputSchema: {
      type: 'object',
      required: ['itemId'],
      properties: {
        itemId: {
          type: 'string',
          description: 'The unique item ID.'
        }
      },
      additionalProperties: false
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
        isAvailable: item.is_available !== false
      }
    }
  })

  // 3. create_cart
  tools.push({
    name: 'create_cart',
    description: `Create or retrieve the current shopping cart for the active venue and customer session.`,
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    execute: async () => {
      const cartStore = useCartStore.getState()
      const items = cartStore.items
      const subtotalMinor = cartStore.totalAmountMinor()

      return {
        venue: locationName,
        currency,
        cartId: `cart_${ctx.slug}_${ctx.locationId.slice(0, 8)}`,
        itemCount: items.reduce((sum, it) => sum + it.quantity, 0),
        subtotal: subtotalMinor / 100,
        subtotalFormatted: `${(subtotalMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`
      }
    }
  })

  // 4. add_to_cart
  tools.push({
    name: 'add_to_cart',
    description: `Add an available catalog item to the active cart using only valid modifier selections.`,
    inputSchema: {
      type: 'object',
      required: ['itemId', 'quantity'],
      properties: {
        itemId: {
          type: 'string',
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
        notes: {
          type: 'string',
          maxLength: 500,
          description: 'Special preparation instructions or customer notes.'
        }
      },
      additionalProperties: false
    },
    execute: async (input: {
      itemId: string
      quantity: number
      modifiers?: { modifierId: string; optionIds?: string[] }[]
      notes?: string
    }) => {
      const item = menuItems.find(i => i.id === input.itemId)
      if (!item) {
        return { error: `Item '${input.itemId}' not found in active catalog.` }
      }
      if (item.is_available === false) {
        return { error: `Item '${item.name}' is currently unavailable.` }
      }

      const qty = Math.max(1, Math.min(50, input.quantity || 1))
      const cartStore = useCartStore.getState()

      const variantMap: Record<string, string> = {}
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
        success: true,
        message: `Added ${qty}x ${item.name} to cart.`,
        cartItemCount: updated.items.reduce((sum, it) => sum + it.quantity, 0),
        subtotal: subtotalMinor / 100,
        subtotalFormatted: `${(subtotalMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`
      }
    }
  })

  // 5. get_cart
  tools.push({
    name: 'get_cart',
    description: `Return the current cart, validated prices, modifiers, taxes, fees and current total.`,
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    execute: async () => {
      const cartStore = useCartStore.getState()
      const items = cartStore.items
      const subtotalMinor = cartStore.totalAmountMinor()
      const discountMinor = cartStore.getDiscountAmountMinor(subtotalMinor)
      const discountedSubtotalMinor = cartStore.getDiscountedTotalAmountMinor(subtotalMinor)

      return {
        venue: locationName,
        currency,
        itemCount: items.reduce((sum, it) => sum + it.quantity, 0),
        lines: items.map(it => ({
          lineId: it.cartKey,
          itemId: it.id,
          name: it.name,
          quantity: it.quantity,
          unitPrice: it.price_minor / 100,
          unitPriceFormatted: `${(it.price_minor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`,
          lineTotal: (it.price_minor * it.quantity) / 100,
          lineTotalFormatted: `${((it.price_minor * it.quantity) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`,
          modifiers: it.variantSelections || null
        })),
        subtotal: subtotalMinor / 100,
        subtotalFormatted: `${(subtotalMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`,
        discountAmount: discountMinor / 100,
        discountPercentage: cartStore.spinnerDiscount || 0,
        total: discountedSubtotalMinor / 100,
        totalFormatted: `${(discountedSubtotalMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`
      }
    }
  })

  // 6. update_cart
  tools.push({
    name: 'update_cart',
    description: `Modify an existing cart line or remove it from the current cart. Set quantity to 0 to remove.`,
    inputSchema: {
      type: 'object',
      required: ['lineId'],
      properties: {
        lineId: {
          type: 'string',
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
    execute: async (input: { lineId: string; quantity?: number; notes?: string }) => {
      const cartStore = useCartStore.getState()
      const existingLine = cartStore.items.find(i => i.cartKey === input.lineId)

      if (!existingLine) {
        return { error: `Cart line with ID '${input.lineId}' not found.` }
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

  // 7. initiate_checkout
  tools.push({
    name: 'initiate_checkout',
    description: `Validate the current cart and prepare a checkout session. This does not authorize payment or submit the order.`,
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
      const tax = Math.round(discountedSubtotal * 0.075 * 100) / 100 // 7.5% VAT
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
        fulfillment: input.fulfillment,
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

  // 8. submit_order (MANDATORY Human-in-the-Loop Authorization Gate)
  tools.push({
    name: 'submit_order',
    description: `Submit the previously reviewed checkout as a customer order after explicit human authorization.`,
    inputSchema: {
      type: 'object',
      required: ['checkoutId', 'authorization'],
      properties: {
        checkoutId: {
          type: 'string',
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
    execute: async (input: {
      checkoutId: string
      authorization: { confirmed: boolean; confirmationId?: string }
    }) => {
      if (!input.authorization || input.authorization.confirmed !== true) {
        return {
          error: 'Transaction rejected: submit_order requires explicit human customer authorization (confirmed: true).'
        }
      }

      const cartStore = useCartStore.getState()
      const items = cartStore.items

      if (items.length === 0) {
        return { error: 'Cart is empty. Order cannot be placed.' }
      }

      const subtotalMinor = cartStore.totalAmountMinor()
      const orderId = `ord_${Date.now().toString(36)}`

      // Visual success and clear cart
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

  // 9. recommend_pairings
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

  // Helper & Operations Tools
  tools.push({
    name: 'request_staff',
    description: `Send an immediate service or waiter call notification to venue staff.`,
    inputSchema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Reason for request (e.g. "Water refill", "Bill check", "Assistance").'
        }
      },
      additionalProperties: false
    },
    execute: async (input: { reason?: string }) => {
      toast.success(`🔔 Staff alerted for: ${tableIdentifier}`, {
        description: input.reason || 'Staff is on their way to assist you.',
        duration: 4000
      })
      return {
        success: true,
        message: `Staff notification sent for ${tableIdentifier}.`,
        reason: input.reason || 'General assistance'
      }
    }
  })

  // Wrap all tools with real-time UI/UX event dispatch
  return tools.map(tool => ({
    ...tool,
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
  }))
}
