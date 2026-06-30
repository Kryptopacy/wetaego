import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useState, useEffect } from 'react'

export interface CartItem {
  id: string          // page_items.id
  cartKey: string     // id + variant combo, used for deduplication
  name: string
  price_minor: number
  quantity: number
  variantSelections?: Record<string, string> // e.g. { Size: "M", Color: "Blue" }
  variantLabel?: string // e.g. "M / Blue" for display
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (cartKey: string) => void
  updateQuantity: (cartKey: string, delta: number) => void
  totalAmountMinor: () => number
  spinnerDiscount: number | null
  setSpinnerDiscount: (discount: number | null) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => {
        const existingItem = state.items.find(i => i.cartKey === item.cartKey)
        if (existingItem) {
          return {
            items: state.items.map(i =>
              i.cartKey === item.cartKey ? { ...i, quantity: i.quantity + 1 } : i
            )
          }
        }
        return { items: [...state.items, { ...item, quantity: 1 }] }
      }),
      removeItem: (cartKey) => set((state) => ({
        items: state.items.filter(i => i.cartKey !== cartKey)
      })),
      updateQuantity: (cartKey, delta) => set((state) => {
        const existingItem = state.items.find(i => i.cartKey === cartKey)
        if (!existingItem) return { items: state.items }
        const newQuantity = existingItem.quantity + delta
        if (newQuantity <= 0) {
          return { items: state.items.filter(i => i.cartKey !== cartKey) }
        }
        return {
          items: state.items.map(i => i.cartKey === cartKey ? { ...i, quantity: newQuantity } : i)
        }
      }),
      clearCart: () => set({ items: [], spinnerDiscount: null }),
      totalAmountMinor: () => {
        const { items } = get()
        return items.reduce((total, item) => total + (item.price_minor * item.quantity), 0)
      },
      spinnerDiscount: null,
      setSpinnerDiscount: (discount) => set({ spinnerDiscount: discount })
    }),
    {
      name: 'ourmenu-cart-storage',
      skipHydration: true,
    }
  )
)

export function useCartHydration() {
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    useCartStore.persist.onFinishHydration(() => setHasHydrated(true))
    useCartStore.persist.rehydrate()
  }, [])

  return hasHydrated
}
