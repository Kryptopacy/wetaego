import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useState, useEffect } from 'react'

export interface CartItem {
  id: string          // menu_items.id (or page_items.id for catalog)
  cartKey: string     // id + variant combo, used for deduplication
  pageId: string      // which page this item belongs to (for cross-page scoping)
  name: string
  price_minor: number
  quantity: number
  dealItemId?: string  // if from a deal, references deal_items.id for server-side price verification
  variantSelections?: Record<string, string> // e.g. { Size: "M", Color: "Blue" }
  variantLabel?: string // e.g. "M / Blue" for display
}

interface CartState {
  items: CartItem[]
  savedAt: number | null
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (cartKey: string) => void
  updateQuantity: (cartKey: string, delta: number) => void
  totalAmountMinor: () => number
  totalAmountMinorForPage: (pageId: string) => number
  getDiscountAmountMinor: (subtotalMinor: number, globalDiscountPercentage?: number | null) => number
  getDiscountedTotalAmountMinor: (subtotalMinor: number, globalDiscountPercentage?: number | null) => number
  spinnerDiscount: number | null
  setSpinnerDiscount: (discount: number | null) => void
  splitCount: number
  splitType: 'even' | 'uneven'
  splitShares?: number[]
  setSplit: (count: number, type: 'even' | 'uneven', shares?: number[]) => void
  clearCart: () => void
}

const CART_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

import { createJSONStorage, StateStorage } from 'zustand/middleware'
import { get, set as idbSet, del } from 'idb-keyval'

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name)
  },
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      savedAt: null,
      addItem: (item) => set((state) => {
        const existingItem = state.items.find(i => i.cartKey === item.cartKey)
        if (existingItem) {
          return {
            items: state.items.map(i =>
              i.cartKey === item.cartKey ? { ...i, quantity: i.quantity + 1 } : i
            ),
            savedAt: Date.now()
          }
        }
        return { items: [...state.items, { ...item, quantity: 1 }], savedAt: Date.now() }
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
      clearCart: () => set({ items: [], spinnerDiscount: null, savedAt: null, splitCount: 1, splitType: 'even', splitShares: undefined }),
      totalAmountMinor: () => {
        const { items } = get()
        return items.reduce((total, item) => total + (item.price_minor * item.quantity), 0)
      },
      totalAmountMinorForPage: (pageId: string) => {
        const { items } = get()
        return items
          .filter(i => i.pageId === pageId)
          .reduce((total, item) => total + (item.price_minor * item.quantity), 0)
      },
      getDiscountAmountMinor: (subtotalMinor: number, globalDiscountPercentage?: number | null) => {
        const { spinnerDiscount } = get()
        const effectivePercentage = Math.max(spinnerDiscount || 0, globalDiscountPercentage || 0)
        if (effectivePercentage <= 0) return 0
        return Math.floor(subtotalMinor * (effectivePercentage / 100))
      },
      getDiscountedTotalAmountMinor: (subtotalMinor: number, globalDiscountPercentage?: number | null) => {
        const { getDiscountAmountMinor } = get()
        return Math.max(0, subtotalMinor - getDiscountAmountMinor(subtotalMinor, globalDiscountPercentage))
      },
      spinnerDiscount: null,
      setSpinnerDiscount: (discount) => set({ spinnerDiscount: discount }),
      splitCount: 1,
      splitType: 'even',
      splitShares: undefined,
      setSplit: (count, type, shares) => set({ splitCount: count, splitType: type, splitShares: shares })
    }),
    {
      name: 'ourmenu-cart-storage',
      storage: createJSONStorage(() => idbStorage),
      skipHydration: true,
    }
  )
)

export function useCartHydration() {
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    useCartStore.persist.onFinishHydration(() => {
      // Auto-clear cart if older than 24 hours (covers stale demo sessions)
      const state = useCartStore.getState()
      if (state.savedAt && Date.now() - state.savedAt > CART_TTL_MS) {
        state.clearCart()
      }
      setHasHydrated(true)
    })
    useCartStore.persist.rehydrate()
  }, [])

  return hasHydrated
}
