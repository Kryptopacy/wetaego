import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '@/lib/store/cart'

describe('Cart Store', () => {
  beforeEach(() => {
    // Reset state before each test
    useCartStore.getState().clearCart()
  })

  it('should initialize with an empty cart', () => {
    const state = useCartStore.getState()
    expect(state.items).toEqual([])
    expect(state.spinnerDiscount).toBeNull()
  })

  it('should add a new item with quantity 1', () => {
    useCartStore.getState().addItem({
      id: 'item-1',
      cartKey: 'item-1',
      name: 'Burger',
      price_minor: 150000
    })

    const state = useCartStore.getState()
    expect(state.items).toHaveLength(1)
    expect(state.items[0]).toEqual({
      id: 'item-1',
      name: 'Burger',
      price_minor: 150000,
      quantity: 1
    })
  })

  it('should increment quantity if item already exists', () => {
    const store = useCartStore.getState()
    store.addItem({ id: 'item-1', cartKey: 'item-1', name: 'Burger', price_minor: 150000 })
    store.addItem({ id: 'item-1', cartKey: 'item-1', name: 'Burger', price_minor: 150000 })

    const state = useCartStore.getState()
    expect(state.items).toHaveLength(1)
    expect(state.items[0].quantity).toBe(2)
  })

  it('should remove an item by id', () => {
    const store = useCartStore.getState()
    store.addItem({ id: 'item-1', cartKey: 'item-1', name: 'Burger', price_minor: 150000 })
    store.addItem({ id: 'item-2', cartKey: 'item-2', name: 'Fries', price_minor: 50000 })

    store.removeItem('item-1')

    const state = useCartStore.getState()
    expect(state.items).toHaveLength(1)
    expect(state.items[0].id).toBe('item-2')
  })

  it('should calculate the total amount correctly', () => {
    const store = useCartStore.getState()
    store.addItem({ id: 'item-1', cartKey: 'item-1', name: 'Burger', price_minor: 150000 }) // 1500.00
    store.addItem({ id: 'item-1', cartKey: 'item-1', name: 'Burger', price_minor: 150000 }) // 1500.00 -> 3000.00
    store.addItem({ id: 'item-2', cartKey: 'item-2', name: 'Fries', price_minor: 50000 })   // 500.00 -> 3500.00

    expect(store.totalAmountMinor()).toBe(350000)
  })

  it('should handle spinner discount state', () => {
    const store = useCartStore.getState()
    store.setSpinnerDiscount(15) // 15%

    const state = useCartStore.getState()
    expect(state.spinnerDiscount).toBe(15)
  })
})
