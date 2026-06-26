import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useState, useEffect } from 'react'

export interface CartItem {
  id: string
  name: string
  price_minor: number
  quantity: number
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, delta: number) => void
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
        const existingItem = state.items.find(i => i.id === item.id)
        if (existingItem) {
          return {
            items: state.items.map(i => 
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            )
          }
        }
        return { items: [...state.items, { ...item, quantity: 1 }] }
      }),
      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
      })),
      updateQuantity: (id, delta) => set((state) => {
        const existingItem = state.items.find(i => i.id === id)
        if (!existingItem) return { items: state.items }
        const newQuantity = existingItem.quantity + delta
        if (newQuantity <= 0) {
          return { items: state.items.filter(i => i.id !== id) }
        }
        return {
          items: state.items.map(i => i.id === id ? { ...i, quantity: newQuantity } : i)
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
      name: 'ourmenu-cart-storage', // name of the item in the storage (must be unique)
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
