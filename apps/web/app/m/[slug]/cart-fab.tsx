/* eslint-disable */
'use client'

import { useCartStore } from '@/lib/store/cart'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { processCheckout } from './actions'
import { motion, AnimatePresence } from 'framer-motion'
import posthog from 'posthog-js'

interface CartFABProps {
  organizationId: string
  locationId: string
  tableIdentifier?: string
}

export function CartFAB({ organizationId, locationId, tableIdentifier }: CartFABProps) {
  const { items, totalAmountMinor, clearCart } = useCartStore()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [tableNumber, setTableNumber] = useState(tableIdentifier || '')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerNote, setCustomerNote] = useState('')
  const [splitCount, setSplitCount] = useState(1)

  // Ensure zustand persist hydrate matches server render
  useEffect(() => {
    setIsMounted(true)
    const handleOpenModal = () => setShowCheckoutModal(true)
    window.addEventListener('open-checkout-modal', handleOpenModal)
    return () => window.removeEventListener('open-checkout-modal', handleOpenModal)
  }, [])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotalMinor = totalAmountMinor()
  
  const finalTotalMinor = subtotalMinor

  const handleCheckout = async () => {
    if (!tableNumber) {
      toast.error('Please enter your table number')
      return
    }

    setIsCheckingOut(true)
    try {
      posthog.capture('checkout_completed', { organizationId, locationId, totalAmountMinor: finalTotalMinor })
      
      let paymentFractionMinor: number | undefined = undefined
      if (splitCount > 1) {
        paymentFractionMinor = Math.ceil(finalTotalMinor / splitCount)
      }

      const { checkoutUrl, orderId, error } = (await processCheckout(
        organizationId,
        locationId,
        items,
        finalTotalMinor,
        0, 
        tableNumber,
        customerNote,
        customerEmail,
        paymentFractionMinor
      )) as any

      if (error) {
        toast.error(error)
        return
      }

      clearCart()
      localStorage.setItem('activeOrderId', orderId)
      
      if (splitCount > 1) {
        window.location.href = `/pay/${orderId}/share?split=${splitCount}`
      } else if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        toast.success('Order placed successfully!')
        setShowCheckoutModal(false)
      }
    } catch (e: any) {
      toast.error('Could not initialize checkout. Please try again.')
      setIsCheckingOut(false)
    }
  }

  if (!isMounted) return null

  return (
    <>
      <AnimatePresence>
        {totalItems > 0 && !showCheckoutModal && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCheckoutModal(true)}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0f7b55] hover:bg-[#095a3d] dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-[#17201b] font-bold h-14 px-8 rounded-full shadow-[0_8px_30px_rgba(15,123,85,0.4)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.15)] flex items-center gap-3 transition-colors whitespace-nowrap overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <div className="bg-white dark:bg-[#17201b] text-[#0f7b55] dark:text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                {totalItems}
              </div>
              <svg className="w-5 h-5 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>View Order</span>
            </div>
            <span className="text-base">₦{(subtotalMinor / 100).toLocaleString()}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCheckoutModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 pointer-events-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCheckoutModal(false)}
            />
            
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Complete Order</h2>
                <button onClick={() => setShowCheckoutModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Location / Table</label>
                  {tableIdentifier ? (
                    <div className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white font-bold opacity-75">
                      {tableIdentifier}
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder="e.g. Table 12 or 'Takeaway'"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Email (Optional for E-Receipt)</label>
                  <input 
                    type="email" 
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Order Note (Optional)</label>
                  <textarea 
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="e.g. No onions, extra spicy, allergies..."
                    className="w-full h-20 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="bg-zinc-800/50 rounded-xl p-4 space-y-4">
                  <div className="flex justify-between items-center text-white font-bold text-lg pt-2 border-t border-zinc-700/50 mt-2">
                    <span>Total</span>
                    <span>₦{(finalTotalMinor / 100).toLocaleString()}</span>
                  </div>

                  <div className="border-t border-zinc-700/50 pt-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-zinc-400">Split Bill?</span>
                      <div className="flex items-center gap-3 bg-zinc-900 rounded-lg p-1">
                        <button 
                          onClick={() => setSplitCount(Math.max(1, splitCount - 1))}
                          className="w-8 h-8 flex items-center justify-center bg-zinc-800 rounded-md text-white hover:bg-zinc-700 disabled:opacity-50"
                          disabled={splitCount <= 1}
                        >-</button>
                        <span className="text-white font-bold w-4 text-center">{splitCount}</span>
                        <button 
                          onClick={() => setSplitCount(Math.min(10, splitCount + 1))}
                          className="w-8 h-8 flex items-center justify-center bg-zinc-800 rounded-md text-white hover:bg-zinc-700 disabled:opacity-50"
                          disabled={splitCount >= 10}
                        >+</button>
                      </div>
                    </div>
                    {splitCount > 1 && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
                        <span className="block text-xs text-blue-400 uppercase tracking-widest mb-1 font-bold">Your Share (1 of {splitCount})</span>
                        <span className="text-xl font-black text-white">₦{(Math.ceil(finalTotalMinor / splitCount) / 100).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={isCheckingOut || !tableNumber}
                  className="w-full bg-white text-black font-bold py-4 rounded-xl shadow-lg flex items-center justify-center disabled:opacity-50 hover:bg-zinc-200 transition-colors"
                >
                  {isCheckingOut ? 'Processing...' : (splitCount > 1 ? `Pay My Share (₦${(Math.ceil(finalTotalMinor / splitCount) / 100).toLocaleString()})` : `Pay ₦${(finalTotalMinor / 100).toLocaleString()}`)}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
