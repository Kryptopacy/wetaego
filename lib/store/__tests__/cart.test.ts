import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '../cart'

describe('Cart Zustand Store', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart()
  })

  it('should add items correctly', () => {
    useCartStore.getState().addItem({
      id: 'item_1',
      name: 'Burger',
      price_minor: 1500,
    })

    const state = useCartStore.getState()
    expect(state.items).toHaveLength(1)
    expect(state.items[0].name).toBe('Burger')
    expect(state.items[0].quantity).toBe(1)
  })

  it('should calculate total amounts correctly', () => {
    const store = useCartStore.getState()
    
    store.addItem({
      id: 'item_1',
      name: 'Burger',
      price_minor: 1500,
    })
    // Added twice to simulate quantity = 2
    store.addItem({
      id: 'item_1',
      name: 'Burger',
      price_minor: 1500,
    })

    store.addItem({
      id: 'item_2',
      name: 'Fries',
      price_minor: 500,
    })

    // Subtotal: 1500*2 + 500 = 3500
    const state = useCartStore.getState()
    expect(state.totalAmountMinor()).toBe(3500)
  })

  it('should handle removing items', () => {
    const store = useCartStore.getState()
    
    store.addItem({
      id: 'item_1',
      name: 'Burger',
      price_minor: 1500,
    })
    store.removeItem('item_1')

    const state = useCartStore.getState()
    expect(state.items).toHaveLength(0)
  })

  it('should correctly apply and remove discounts', () => {
    const store = useCartStore.getState()
    
    store.addItem({
      id: 'item_1',
      name: 'Steak',
      price_minor: 10000,
    })

    // Total should be 10000
    expect(store.totalAmountMinor()).toBe(10000)

    store.setSpinnerDiscount(1500)
    
    expect(useCartStore.getState().spinnerDiscount).toBe(1500)

    // Clear cart should also reset discount
    store.clearCart()
    expect(useCartStore.getState().spinnerDiscount).toBeNull()
  })
})
