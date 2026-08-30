import { describe, it, expect, beforeEach, vi } from 'vitest'
import { globalWebMCPRegistry } from '../registry'
import { createStorefrontWebMCPTools, StorefrontContext } from '../tools'
import { useCartStore } from '@/lib/store/cart'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn()
  }
}))

describe('WebMCP Storefront Tool Suite', () => {
  const mockContext: StorefrontContext = {
    locationId: 'loc_123',
    locationName: 'Bella Italia Bistro',
    slug: 'bella-italia',
    currency: 'USD',
    menuItems: [
      {
        id: 'item_pasta',
        name: 'Truffle Tagliatelle',
        description: 'Handmade pasta with black truffle cream sauce',
        price_minor: 2400,
        category: 'Mains',
        dietary_tags: ['vegetarian'],
        variants: [
          {
            name: 'Portion',
            options: [{ label: 'Regular' }, { label: 'Large', price_delta_minor: 600 }]
          }
        ]
      },
      {
        id: 'item_salad',
        name: 'Avocado Caesar Salad',
        description: 'Crisp romaine, avocado slices, vegan caesar dressing',
        price_minor: 1400,
        category: 'Starters',
        dietary_tags: ['vegan', 'gluten_free']
      },
      {
        id: 'item_tiramisu',
        name: 'Classic Tiramisu',
        description: 'Espresso-soaked ladyfingers with mascarpone',
        price_minor: 950,
        category: 'Desserts',
        dietary_tags: ['vegetarian']
      }
    ],
    tableIdentifier: 'Table 7'
  }

  beforeEach(() => {
    useCartStore.getState().clearCart()
    // Register tools in global registry
    const tools = createStorefrontWebMCPTools(mockContext)
    tools.forEach(t => globalWebMCPRegistry.registerTool(t))
  })

  it('should search menu items by keyword and max_price', async () => {
    const res = await globalWebMCPRegistry.executeTool('search_catalog', {
      query: 'pasta',
      max_price: 30
    })

    expect(res.totalFound).toBe(1)
    expect(res.items[0].name).toBe('Truffle Tagliatelle')
    expect(res.items[0].priceFormatted).toBe('24.00 USD')
  })

  it('should filter items by dietary tags', async () => {
    const res = await globalWebMCPRegistry.executeTool('search_catalog', {
      dietary: ['vegan']
    })

    expect(res.totalFound).toBe(1)
    expect(res.items[0].name).toBe('Avocado Caesar Salad')
  })

  it('should retrieve item details and modifier options', async () => {
    const res = await globalWebMCPRegistry.executeTool('get_item_details', {
      itemId: 'item_pasta'
    })

    expect(res.name).toBe('Truffle Tagliatelle')
    expect(res.variants).toHaveLength(1)
    expect(res.variants[0].name).toBe('Portion')
  })

  it('should add items to Zustand cart through WebMCP', async () => {
    const res = await globalWebMCPRegistry.executeTool('add_to_cart', {
      itemId: 'item_pasta',
      quantity: 2,
      variantSelections: { Portion: 'Large' }
    })

    expect(res.success).toBe(true)
    expect(res.cartItemCount).toBe(2)

    const cartState = useCartStore.getState()
    expect(cartState.items).toHaveLength(1)
    expect(cartState.items[0].quantity).toBe(2)
    expect(cartState.items[0].name).toBe('Truffle Tagliatelle')
  })

  it('should inspect cart summary via view_cart tool', async () => {
    await globalWebMCPRegistry.executeTool('add_to_cart', {
      itemId: 'item_salad',
      quantity: 1
    })

    const summary = await globalWebMCPRegistry.executeTool('view_cart', {})
    expect(summary.itemCount).toBe(1)
    expect(summary.subtotalFormatted).toBe('14.00 USD')
    expect(summary.items[0].name).toBe('Avocado Caesar Salad')
  })

  it('should update cart quantities and remove items', async () => {
    await globalWebMCPRegistry.executeTool('add_to_cart', {
      itemId: 'item_tiramisu',
      quantity: 1
    })

    const cartState = useCartStore.getState()
    const cartKey = cartState.items[0].cartKey

    // Increment
    await globalWebMCPRegistry.executeTool('update_cart_quantity', {
      cartKey,
      delta: 1
    })
    expect(useCartStore.getState().items[0].quantity).toBe(2)

    // Remove
    await globalWebMCPRegistry.executeTool('update_cart_quantity', {
      cartKey,
      remove: true
    })
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('should execute call_staff_or_service tool', async () => {
    const res = await globalWebMCPRegistry.executeTool('call_staff_or_service', {
      reason: 'Need olive oil and pepper'
    })

    expect(res.success).toBe(true)
    expect(res.message).toContain('Table 7')
  })

  it('should recommend complementary pairings based on active cart', async () => {
    await globalWebMCPRegistry.executeTool('add_to_cart', {
      itemId: 'item_pasta',
      quantity: 1
    })

    const res = await globalWebMCPRegistry.executeTool('recommend_pairings', {
      maxRecommendations: 2
    })

    expect(res.count).toBeLessThanOrEqual(2)
    expect(res.recommendations.length).toBeGreaterThan(0)
    expect(res.recommendations[0].itemId).not.toBe('item_pasta')
  })

  it('should initiate checkout and present human confirmation payload with price-lock', async () => {
    await globalWebMCPRegistry.executeTool('add_to_cart', {
      itemId: 'item_pasta',
      quantity: 1
    })

    const res = await globalWebMCPRegistry.executeTool('initiate_checkout', {
      fulfillment: 'dine_in',
      customer: { name: 'Sam Taylor', email: 'sam@example.com' },
      notes: 'No napkins needed'
    })

    expect(res.requiresPaymentAuthorization).toBe(true)
    expect(res.checkoutId).toBeDefined()
    expect(res.expiresAt).toBeDefined()
    expect(res.priceLockValidMinutes).toBe(15)

    // Test submit_order requires human confirmation
    const rejected = await globalWebMCPRegistry.executeTool('submit_order', {
      checkoutId: res.checkoutId,
      authorization: { confirmed: false }
    })
    expect(rejected.error).toContain('Transaction rejected')

    // Test submit_order succeeds with human confirmation
    const approved = await globalWebMCPRegistry.executeTool('submit_order', {
      checkoutId: res.checkoutId,
      authorization: { confirmed: true, confirmationId: 'conf_123' }
    })
    expect(approved.success).toBe(true)
    expect(approved.orderId).toBeDefined()
  })
})
