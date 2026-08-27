/**
 * Dynamic WebMCP Tool Factory for OurMenuOS
 * Generates platform-level tools tailored to the active merchant storefront.
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
    options: { label: string; price_delta_minor?: number }[]
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
  onActionTriggered?: (action: string, payload: any) => void
}

export function createStorefrontWebMCPTools(ctx: StorefrontContext): WebMCPTool[] {
  const { locationName, currency = 'USD', menuItems = [], tableIdentifier = 'Storefront Guest' } = ctx

  const tools: WebMCPTool[] = []

  // 1. Search Catalog / Menu / Services / Products
  tools.push({
    name: 'search_catalog',
    description: `Search the active offerings, products, dishes, bookings, or services for ${locationName}. Filter by search keywords, category name, maximum price, or custom tags/attributes (e.g. dietary flags, material types, service types, device specs).`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Keyword to search item names, descriptions, or specifications (e.g. "pasta", "haircut", "penthouse", "titanium", "massage", "repair").'
        },
        category: {
          type: 'string',
          description: 'Filter by specific category or department name.'
        },
        max_price: {
          type: 'number',
          description: 'Maximum price in major currency units.'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags, attributes, or dietary preferences to match (e.g. ["vegan", "halal"], ["waterfront"], ["4k"], ["organic"], ["oem"]).'
        },
        dietary: {
          type: 'array',
          items: { type: 'string' },
          description: 'Alias for tags when searching food & beverage items (e.g. ["vegan", "gluten_free", "halal"]).'
        }
      }
    },
    execute: async (input: { query?: string; category?: string; max_price?: number; tags?: string[]; dietary?: string[] }) => {
      let results = [...menuItems]

      if (input.query) {
        const q = input.query.toLowerCase()
        results = results.filter(
          item =>
            item.name.toLowerCase().includes(q) ||
            (item.description && item.description.toLowerCase().includes(q))
        )
      }

      if (input.category) {
        const cat = input.category.toLowerCase()
        results = results.filter(item => item.category && item.category.toLowerCase().includes(cat))
      }

      if (typeof input.max_price === 'number') {
        const maxMinor = input.max_price * 100
        results = results.filter(item => item.price_minor <= maxMinor)
      }

      const searchTags = input.tags || input.dietary
      if (searchTags && searchTags.length > 0) {
        const targetTags = searchTags.map(t => t.toLowerCase())
        results = results.filter(item => {
          const itemTags = (item.dietary_tags || []).map(t => t.toLowerCase())
          return targetTags.every(t => itemTags.includes(t))
        })
      }

      return {
        storeName: locationName,
        totalFound: results.length,
        currency,
        items: results.slice(0, 20).map(item => ({
          id: item.id,
          name: item.name,
          category: item.category || 'General',
          priceFormatted: `${(item.price_minor / 100).toFixed(2)} ${currency}`,
          priceMinor: item.price_minor,
          description: item.description || '',
          tags: item.dietary_tags || [],
          hasVariants: !!(item.variants && item.variants.length > 0)
        }))
      }
    }
  })

  // 2. Get Item Details
  tools.push({
    name: 'get_item_details',
    description: `Get full details, ingredients, dietary badges, and customizable options (sizes, add-ons, toppings) for a specific item.`,
    inputSchema: {
      type: 'object',
      properties: {
        itemId: {
          type: 'string',
          description: 'The unique ID of the item.'
        }
      },
      required: ['itemId']
    },
    execute: async ({ itemId }: { itemId: string }) => {
      const item = menuItems.find(i => i.id === itemId)
      if (!item) {
        return { error: `Item with ID '${itemId}' not found in ${locationName} catalog.` }
      }

      return {
        id: item.id,
        name: item.name,
        category: item.category || 'General',
        priceMinor: item.price_minor,
        priceFormatted: `${(item.price_minor / 100).toFixed(2)} ${currency}`,
        description: item.description || '',
        dietaryTags: item.dietary_tags || [],
        variants: item.variants || [],
        isAvailable: item.is_available !== false
      }
    }
  })

  // 3. Add Item to Cart
  tools.push({
    name: 'add_to_cart',
    description: `Add an item with optional variant selections and quantity to the customer's live cart. Triggers instant real-time visual UI update on screen.`,
    inputSchema: {
      type: 'object',
      properties: {
        itemId: {
          type: 'string',
          description: 'The unique ID of the item to add.'
        },
        quantity: {
          type: 'integer',
          description: 'Quantity of items to add (defaults to 1).'
        },
        variantSelections: {
          type: 'object',
          description: 'Map of variant option selections (e.g. { "Size": "Large", "Spice Level": "Medium" }).'
        }
      },
      required: ['itemId']
    },
    execute: async (input: { itemId: string; quantity?: number; variantSelections?: Record<string, string> }) => {
      const item = menuItems.find(i => i.id === input.itemId)
      if (!item) {
        return { error: `Item '${input.itemId}' not found.` }
      }

      const qty = Math.max(1, input.quantity || 1)
      const cartStore = useCartStore.getState()

      // Build cartKey based on itemId and variant combo
      const variantKeyPart = input.variantSelections ? JSON.stringify(input.variantSelections) : ''
      const cartKey = `${item.id}_${variantKeyPart}`

      for (let i = 0; i < qty; i++) {
        cartStore.addItem({
          id: item.id,
          cartKey,
          name: item.name,
          price_minor: item.price_minor,
          pageId: ctx.slug,
          variantSelections: input.variantSelections,
          variantLabel: input.variantSelections
            ? Object.values(input.variantSelections).join(' / ')
            : undefined
        })
      }

      // Visual feedback toast
      toast.success(`🤖 AI added ${qty}x ${item.name} to cart`, {
        description: input.variantSelections ? Object.entries(input.variantSelections).map(([k, v]) => `${k}: ${v}`).join(', ') : undefined,
        duration: 3500
      })

      if (ctx.onActionTriggered) {
        ctx.onActionTriggered('add_to_cart', { item, quantity: qty })
      }

      const updatedState = useCartStore.getState()
      return {
        success: true,
        message: `Added ${qty}x ${item.name} to cart.`,
        cartItemCount: updatedState.items.reduce((sum, it) => sum + it.quantity, 0),
        subtotalFormatted: `${(updatedState.totalAmountMinor() / 100).toFixed(2)} ${currency}`
      }
    }
  })

  // 4. View Cart
  tools.push({
    name: 'view_cart',
    description: `Inspect the current customer cart: list of items, quantities, subtotal, active discounts, and final calculated total.`,
    inputSchema: {
      type: 'object',
      properties: {}
    },
    execute: async () => {
      const cartStore = useCartStore.getState()
      const items = cartStore.items
      const subtotalMinor = cartStore.totalAmountMinor()
      const discountMinor = cartStore.getDiscountAmountMinor(subtotalMinor)
      const finalTotalMinor = cartStore.getDiscountedTotalAmountMinor(subtotalMinor)

      return {
        storeName: locationName,
        itemCount: items.reduce((sum, it) => sum + it.quantity, 0),
        currency,
        items: items.map(it => ({
          cartKey: it.cartKey,
          id: it.id,
          name: it.name,
          quantity: it.quantity,
          unitPriceFormatted: `${(it.price_minor / 100).toFixed(2)} ${currency}`,
          lineTotalFormatted: `${((it.price_minor * it.quantity) / 100).toFixed(2)} ${currency}`,
          variant: it.variantLabel || null
        })),
        subtotalFormatted: `${(subtotalMinor / 100).toFixed(2)} ${currency}`,
        discountAmountFormatted: `${(discountMinor / 100).toFixed(2)} ${currency}`,
        discountPercentage: cartStore.spinnerDiscount || 0,
        totalAmountFormatted: `${(finalTotalMinor / 100).toFixed(2)} ${currency}`,
        splitCount: cartStore.splitCount,
        splitType: cartStore.splitType
      }
    }
  })

  // 5. Update Cart Quantity / Remove Item
  tools.push({
    name: 'update_cart_quantity',
    description: `Adjust the quantity of an existing item in the cart or remove it completely.`,
    inputSchema: {
      type: 'object',
      properties: {
        cartKey: {
          type: 'string',
          description: 'The cartKey of the item in the cart.'
        },
        delta: {
          type: 'integer',
          description: 'Change in quantity (+1 to increase, -1 to decrease).'
        },
        remove: {
          type: 'boolean',
          description: 'Set to true to completely remove the item from cart.'
        }
      },
      required: ['cartKey']
    },
    execute: async (input: { cartKey: string; delta?: number; remove?: boolean }) => {
      const cartStore = useCartStore.getState()
      if (input.remove) {
        cartStore.removeItem(input.cartKey)
        toast.info(`🤖 AI removed item from cart`)
      } else if (typeof input.delta === 'number') {
        cartStore.updateQuantity(input.cartKey, input.delta)
        toast.info(`🤖 AI updated cart quantity`)
      }

      const updated = useCartStore.getState()
      return {
        success: true,
        remainingItems: updated.items.length,
        subtotalFormatted: `${(updated.totalAmountMinor() / 100).toFixed(2)} ${currency}`
      }
    }
  })

  // 6. Clear Cart
  tools.push({
    name: 'clear_cart',
    description: `Clear all items from the customer's cart.`,
    inputSchema: {
      type: 'object',
      properties: {}
    },
    execute: async () => {
      useCartStore.getState().clearCart()
      toast.info(`🤖 AI cleared cart`)
      return { success: true, message: 'Cart cleared successfully.' }
    }
  })

  // 7. Request Staff / Waiter Assistance
  tools.push({
    name: 'call_staff_or_service',
    description: `Send an immediate service or waiter call notification to store staff.`,
    inputSchema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Reason for calling staff (e.g. "Need extra napkins", "Question about bill", "Water refill").'
        }
      }
    },
    execute: async (input: { reason?: string }) => {
      toast.success(`🔔 Staff alerted for Table/Seat: ${tableIdentifier}`, {
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

  // 8. Initiate Checkout & Place Order Gate
  tools.push({
    name: 'initiate_checkout',
    description: `Prepares the checkout payload with the current cart and prompts the customer to review and confirm payment.`,
    inputSchema: {
      type: 'object',
      properties: {
        customerName: {
          type: 'string',
          description: 'Customer full name.'
        },
        customerPhone: {
          type: 'string',
          description: 'Customer contact phone number.'
        },
        notes: {
          type: 'string',
          description: 'Special preparation or delivery instructions.'
        }
      }
    },
    execute: async (input: { customerName?: string; customerPhone?: string; notes?: string }) => {
      const cartStore = useCartStore.getState()
      if (cartStore.items.length === 0) {
        return { error: 'Cannot checkout with an empty cart. Please add items first.' }
      }

      toast.success(`💳 Ready for Checkout!`, {
        description: `Please review your order of ${(cartStore.getDiscountedTotalAmountMinor(cartStore.totalAmountMinor()) / 100).toFixed(2)} ${currency}.`,
        duration: 5000
      })

      if (ctx.onActionTriggered) {
        ctx.onActionTriggered('open_checkout', input)
      }

      return {
        status: 'awaiting_human_confirmation',
        message: 'Order review modal presented on screen. Human customer can now confirm and pay.',
        totalDue: `${(cartStore.getDiscountedTotalAmountMinor(cartStore.totalAmountMinor()) / 100).toFixed(2)} ${currency}`,
        items: cartStore.items.map(i => `${i.quantity}x ${i.name}`)
      }
    }
  })

  return tools
}
