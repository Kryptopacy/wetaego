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
      price: 1500,
      quantity: 1,
      image_url: null,
      customizations: {}
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
      price: 1500,
      quantity: 2,
      image_url: null,
      customizations: {}
    })

    store.addItem({
      id: 'item_2',
      name: 'Fries',
      price: 500,
      quantity: 1,
      image_url: null,
      customizations: {}
    })

    // Subtotal: 1500*2 + 500 = 3500
    const state = useCartStore.getState()
    expect(state.getTotal()).toBe(3500)
  })

  it('should handle removing items', () => {
    const store = useCartStore.getState()
    
    store.addItem({
      id: 'item_1',
      name: 'Burger',
      price: 1500,
      quantity: 1,
      image_url: null,
      customizations: {}
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
      price: 10000,
      quantity: 1,
      image_url: null,
      customizations: {}
    })

    // Total should be 10000
    expect(store.getTotal()).toBe(10000)

    store.setDiscount(1500)
    
    // Check if store allows discount getter
    // Since discount logic might be handled in components or if setDiscount is implemented
    expect(useCartStore.getState().discount).toBe(1500)

    // Clear cart should also reset discount
    store.clearCart()
    expect(useCartStore.getState().discount).toBe(0)
  })
})
