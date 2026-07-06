'use client'

import { useCartStore } from '@/lib/store/cart'
import { formatCurrency } from '@/lib/utils/currency'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { CheckoutModal } from './components/checkout-modal'

interface CartFABProps {
  organizationId: string
  locationId: string
  tableIdentifier?: string
  paymentIsLive?: boolean
  manualPaymentEnabled?: boolean
  manualPaymentBankName?: string | null
  manualPaymentAccountName?: string | null
  manualPaymentAccountNumber?: string | null
  manualPaymentInstructions?: string | null
  hideAddressField?: boolean
  globalDiscountEnabled?: boolean | null
  globalDiscountPercentage?: number | null
  menuItems?: { id: string, name: string, price_minor: number }[]
  templateType?: string
  deliveryEnabled?: boolean | null
  deliveryFeeMinor?: number | null
  deliveryMinimumOrderMinor?: number | null
  deliveryNote?: string | null
  fulfillmentLocationLabel?: string | null
  pageId?: string
  refundPolicy?: string | null
  pageFulfillmentOptions?: { pickup: boolean, delivery: boolean, table: boolean }
  pageBillingMode?: string
  locationTaxes?: { name: string; percentage: number }[]
  pagePaymentOptions?: string[]
  globalManualPaymentOverride?: boolean
}

export function CartFAB(props: CartFABProps) {
  const { items, totalAmountMinorForPage, addItem, updateQuantity, clearCart, spinnerDiscount } = useCartStore()
  const [isMounted, setIsMounted] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  
  useEffect(() => {
    queueMicrotask(() => setIsMounted(true))
    const handleOpenModal = () => setShowCheckoutModal(true)
    window.addEventListener('open-checkout-modal', handleOpenModal)
    return () => window.removeEventListener('open-checkout-modal', handleOpenModal)
  }, [])

  const pageItems = items.filter(i => i.pageId === props.pageId)
  const totalItems = pageItems.reduce((sum, item) => sum + item.quantity, 0)
  const subtotalMinor = totalAmountMinorForPage(props.pageId || '')
  
  const effectiveGlobalPercent = (props.globalDiscountEnabled && props.globalDiscountPercentage) ? props.globalDiscountPercentage : 0
  const effectivePercent = Math.max(effectiveGlobalPercent, spinnerDiscount || 0)
  
  const discountMultiplier = effectivePercent / 100
  const discountAmountMinor = Math.floor(subtotalMinor * discountMultiplier)
  
  // NOTE: final total logic including delivery fee is managed inside the modal. 
  // We'll show the discounted subtotal on the FAB for simplicity before delivery fee is known.
  const displayTotalMinor = subtotalMinor - discountAmountMinor

  if (!isMounted) return null

  return (
    <>
      <AnimatePresence>
        {totalItems > 0 && !showCheckoutModal && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 inset-x-0 flex justify-center z-40 pointer-events-none px-4"
          >
            <button
              aria-label="Checkout Cart"
              onClick={() => setShowCheckoutModal(true)}
              className="pointer-events-auto group relative w-full max-w-sm overflow-hidden bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold h-16 rounded-[2rem] shadow-2xl flex items-center justify-between px-2 transition-all active:scale-95"
            >
              <div className="absolute inset-0 bg-theme/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative flex items-center gap-3 pl-4">
                <div className="bg-zinc-800 dark:bg-zinc-100 w-10 h-10 rounded-full flex items-center justify-center relative">
                  <ShoppingBag className="w-5 h-5 text-white dark:text-zinc-900" />
                  <motion.div 
                    key={totalItems}
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-theme text-white w-5 h-5 text-[11px] font-black rounded-full flex items-center justify-center border-2 border-zinc-900 dark:border-white"
                  >
                    {totalItems}
                  </motion.div>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[15px]">View Order</span>
                  {discountAmountMinor > 0 && (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium tracking-wide">
                      Saved {formatCurrency(discountAmountMinor)}!
                    </span>
                  )}
                </div>
              </div>

              <div className="relative flex items-center gap-3 pr-4">
                <span className="text-[17px] font-black tracking-tight">
                  {formatCurrency(displayTotalMinor)}
                </span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        items={items}
        totalAmountMinor={totalAmountMinorForPage(props.pageId || '')}
        addItem={(item) => addItem({ ...item, pageId: props.pageId || '' })}
        updateQuantity={updateQuantity}
        clearCart={clearCart}
        spinnerDiscount={spinnerDiscount}
        pageFulfillmentOptions={props.pageFulfillmentOptions}
        pageBillingMode={props.pageBillingMode}
        locationTaxes={props.locationTaxes}
        {...props}
        manualPaymentEnabled={props.globalManualPaymentOverride || props.manualPaymentEnabled}
      />
    </>
  )
}
