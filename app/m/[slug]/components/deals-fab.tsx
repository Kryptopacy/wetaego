'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency } from '@/lib/utils/currency'
import { useCartStore } from '@/lib/store/cart'
import { toast } from 'sonner'

type DealItem = {
  id: string
  deal_price_minor: number
  quantity_limit: number | null
  quantity_sold: number
  menu_items: {
    id: string
    name: string
    price_minor: number
    image_url: string | null
    description: string | null
  } | null
}

type Deal = {
  id: string
  name: string
  description: string | null
  type: 'time_based' | 'quantity_based' | 'manual'
  deal_items: DealItem[]
}

interface DealsFABProps {
  deals: Deal[]
  locationId: string
  pageId?: string
}

export function DealsFAB({ deals, locationId, pageId }: DealsFABProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { addItem } = useCartStore()

  useEffect(() => { Promise.resolve().then(() => setIsMounted(true)) }, [])

  if (!isMounted || deals.length === 0) return null

  // Count all available deal items across all active deals
  const totalItems = deals.reduce((sum, d) => sum + d.deal_items.length, 0)

  const handleAddToCart = (deal: Deal, item: DealItem) => {
    if (!item.menu_items) return
    addItem({
      id: item.menu_items.id,
      cartKey: `deal-${item.id}`,
      pageId: pageId || locationId,
      name: item.menu_items.name,
      price_minor: item.deal_price_minor,
      dealItemId: item.id,
    })
    toast.success(`${item.menu_items.name} added at deal price!`, {
      description: `${formatCurrency(item.deal_price_minor)} · from "${deal.name}"`,
    })
  }

  return (
    <>
      {/* FAB Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(true)}
        className="relative z-[45] h-14 rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2 px-4 text-white font-bold text-sm group"
        aria-label="View active deals"
      >
        <span className="text-base">🏷️</span>
        <span>Deals</span>
        <span className="ml-1 bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
          {totalItems}
        </span>
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-20 pointer-events-none" />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false) }}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-white dark:bg-zinc-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col"
              id="deals-modal"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">🏷️ Active Deals</h2>
                  <p className="text-sm text-zinc-500 mt-0.5">Limited time offers — grab them before they're gone!</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Deal Items */}
              <div className="overflow-y-auto flex-1 px-4 py-4 space-y-6">
                {deals.map(deal => (
                  <div key={deal.id}>
                    <div className="flex items-center gap-2 mb-3 px-2">
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                        {deal.name}
                      </span>
                      {deal.type === 'quantity_based' && (
                        <span className="text-xs text-zinc-400">· Qty limited</span>
                      )}
                      {deal.type === 'time_based' && (
                        <span className="text-xs text-zinc-400">· Time limited</span>
                      )}
                    </div>

                    <div className="space-y-3">
                      {deal.deal_items.map(item => {
                        if (!item.menu_items) return null
                        const savings = item.menu_items.price_minor - item.deal_price_minor
                        const savingsPct = Math.round((savings / item.menu_items.price_minor) * 100)
                        const remaining = item.quantity_limit !== null 
                          ? item.quantity_limit - item.quantity_sold 
                          : null

                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-3 border border-zinc-100 dark:border-zinc-700/50"
                          >
                            {item.menu_items.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.menu_items.image_url}
                                alt={item.menu_items.name}
                                className="w-16 h-16 rounded-xl object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-zinc-200 dark:bg-zinc-700 shrink-0 flex items-center justify-center text-2xl">
                                🍽️
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate">
                                {item.menu_items.name}
                              </p>
                              <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                  {formatCurrency(item.deal_price_minor)}
                                </span>
                                <span className="text-xs text-zinc-400 line-through">
                                  {formatCurrency(item.menu_items.price_minor)}
                                </span>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                  -{savingsPct}%
                                </span>
                              </div>
                              {remaining !== null && (
                                <p className="text-xs text-red-500 mt-0.5 font-medium">
                                  Only {remaining} left!
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => handleAddToCart(deal, item)}
                              className="shrink-0 w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 transition-all"
                              aria-label={`Add ${item.menu_items.name} to cart`}
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-xs text-zinc-400 text-center">
                  Deal prices are applied automatically at checkout.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
