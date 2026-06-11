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
  const [tipSelection, setTipSelection] = useState<'0' | '10' | '15' | '20' | 'custom'>('0')
  const [customTip, setCustomTip] = useState('')
  const [customerNote, setCustomerNote] = useState('')

  // Ensure zustand persist hydrate matches server render
  useEffect(() => {
    setIsMounted(true)
    const handleOpenModal = () => setShowCheckoutModal(true)
    window.addEventListener('open-checkout-modal', handleOpenModal)
    return () => window.removeEventListener('open-checkout-modal', handleOpenModal)
  }, [])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotalMinor = totalAmountMinor()
  
  const tipAmountMinor = tipSelection === 'custom'
    ? Math.round(parseFloat(customTip || '0') * 100)
    : Math.round(subtotalMinor * (parseInt(tipSelection) / 100))
    
  const finalTotalMinor = subtotalMinor + tipAmountMinor

  const handleCheckout = async () => {
    if (!tableNumber) {
      toast.error('Please enter your table number')
      return
    }

    setIsCheckingOut(true)
    try {
      posthog.capture('checkout_completed', { organizationId, locationId, totalAmountMinor: finalTotalMinor })
      const { checkoutUrl } = await processCheckout(organizationId, locationId, items, finalTotalMinor, tipAmountMinor, tableNumber, customerNote)
      
      if (checkoutUrl) {
        clearCart()
        window.location.href = checkoutUrl
      }
    } catch (e) {
      toast.error('Could not initialize checkout. Please try again.')
    } finally {
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
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Add a Tip (Optional)</label>
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {[
                      { val: '0', label: 'None' },
                      { val: '10', label: '10%' },
                      { val: '15', label: '15%' },
                      { val: '20', label: '20%' },
                      { val: 'custom', label: 'Custom' }
                    ].map(btn => (
                      <button
                        key={btn.val}
                        onClick={() => setTipSelection(btn.val as any)}
                        className={`py-2 text-sm rounded-lg font-medium transition-colors ${tipSelection === btn.val ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  {tipSelection === 'custom' && (
                    <input 
                      type="number" 
                      min="0"
                      step="100"
                      value={customTip}
                      onChange={(e) => setCustomTip(e.target.value)}
                      placeholder="Enter custom amount (₦)"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 mt-2"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Order Note (Optional)</label>
                  <textarea 
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="e.g. No onions, extra spicy, allergies..."
                    className="w-full h-20 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="bg-zinc-800/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span>₦{(subtotalMinor / 100).toLocaleString()}</span>
                  </div>
                  {tipAmountMinor > 0 && (
                    <div className="flex justify-between text-blue-400">
                      <span>Tip {tipSelection !== 'custom' ? `(${tipSelection}%)` : ''}</span>
                      <span>₦{(tipAmountMinor / 100).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-zinc-700/50 mt-2">
                    <span>Total</span>
                    <span>₦{(finalTotalMinor / 100).toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={isCheckingOut || !tableNumber}
                  className="w-full bg-white text-black font-bold py-4 rounded-xl shadow-lg flex items-center justify-center disabled:opacity-50 hover:bg-zinc-200 transition-colors"
                >
                  {isCheckingOut ? 'Processing...' : `Pay ₦${(finalTotalMinor / 100).toLocaleString()}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
