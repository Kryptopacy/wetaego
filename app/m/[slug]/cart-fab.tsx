'use client'

import { useCartStore } from '@/lib/store/cart'
import { formatCurrency } from '@/lib/utils/currency'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { processCheckout } from './actions'
import { motion, AnimatePresence } from 'framer-motion'
import posthog from 'posthog-js'
import { ShoppingBag, ChevronRight, X, Sparkles, Plus, Minus, CreditCard, Building2, Lock, MapPin, ChevronDown } from 'lucide-react'

function FloatingInput({ 
  label, 
  value, 
  onChange, 
  type = "text", 
  placeholder = "",
  required = false
}: { 
  label: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false)
  const isActive = isFocused || value.length > 0

  return (
    <div className="relative w-full">
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        required={required}
        className={`w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 pb-2 pt-6 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-[15px] ${isActive ? '' : 'placeholder:text-transparent'}`}
        placeholder={placeholder}
      />
      <label 
        className={`absolute left-4 transition-all duration-200 pointer-events-none ${isActive ? 'text-[11px] top-2 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-[15px] top-3.5 text-zinc-500 dark:text-zinc-400'}`}
      >
        {label}
      </label>
    </div>
  )
}

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
}

export function CartFAB({ 
  organizationId, 
  locationId, 
  tableIdentifier,
  paymentIsLive,
  manualPaymentEnabled,
  manualPaymentBankName,
  manualPaymentAccountName,
  manualPaymentAccountNumber,
  manualPaymentInstructions,
  hideAddressField = false,
  globalDiscountEnabled,
  globalDiscountPercentage,
  menuItems = [],
  templateType = 'catalog',
  deliveryEnabled,
  deliveryFeeMinor,
  deliveryMinimumOrderMinor,
  deliveryNote,
  fulfillmentLocationLabel = 'Table',
  pageId,
  refundPolicy,
  pageFulfillmentOptions,
  pageBillingMode
}: CartFABProps) {
  const { items, totalAmountMinor, addItem, updateQuantity, clearCart, spinnerDiscount } = useCartStore()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [tableNumber, setTableNumber] = useState(tableIdentifier || '')
  const [isFetchingLocation, setIsFetchingLocation] = useState(false)
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false)
  
  const showTableOption = pageFulfillmentOptions ? pageFulfillmentOptions.table : !['catalog', 'retail'].includes(templateType)
  const showPickupOption = pageFulfillmentOptions ? pageFulfillmentOptions.pickup : true
  const showDeliveryOption = pageFulfillmentOptions ? pageFulfillmentOptions.delivery : !!deliveryEnabled

  const defaultFulfillment = tableIdentifier ? 'table' : (showTableOption ? 'table' : (showPickupOption ? 'pickup' : 'delivery'))
  const [fulfillmentType, setFulfillmentType] = useState<'table' | 'pickup' | 'delivery'>(defaultFulfillment)
  
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerNote, setCustomerNote] = useState('')
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  
  const [splitCount, setSplitCount] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>(paymentIsLive ? 'card' : 'transfer')

  // Auto-fill customer data on load
  useEffect(() => {
    try {
      const saved = localStorage.getItem('om_customer_profile')
      if (saved) {
        const profile = JSON.parse(saved)
        /* eslint-disable react-hooks/set-state-in-effect */
        if (profile.name) setCustomerName(profile.name)
        if (profile.email) setCustomerEmail(profile.email)
        if (profile.phone) setCustomerPhone(profile.phone)
        if (profile.address && !tableIdentifier) setTableNumber(profile.address) // reuse for delivery address
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    } catch {
      // Ignore local storage errors
    }
  }, [tableIdentifier])

  useEffect(() => {
    queueMicrotask(() => setIsMounted(true))
    const handleOpenModal = () => setShowCheckoutModal(true)
    window.addEventListener('open-checkout-modal', handleOpenModal)
    return () => window.removeEventListener('open-checkout-modal', handleOpenModal)
  }, [])

  // AI Upselling State
  const [upsellData, setUpsellData] = useState<{ suggestedItemId: string, pitch: string } | null>(null)
  const isFetchingUpsell = useRef(false)

  useEffect(() => {
    if (showCheckoutModal && items.length > 0 && menuItems.length > 0 && !upsellData && !isFetchingUpsell.current) {
      isFetchingUpsell.current = true
      const fetchUpsell = async () => {
        try {
          const res = await fetch('/api/upsell', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartItems: items, availableItems: menuItems, templateType })
          })
          if (res.ok) {
            const data = await res.json()
            setUpsellData(data)
          }
        } catch (e) {
          console.error('Upsell fetch failed', e)
        } finally {
          isFetchingUpsell.current = false
        }
      }
      fetchUpsell()
    }
  }, [showCheckoutModal, items, items.length, menuItems, templateType, upsellData])

  const upsellItemDetails = upsellData ? menuItems.find(i => i.id === upsellData.suggestedItemId) : null

  const handleAddUpsell = () => {
    if (upsellItemDetails) {
      addItem({ id: upsellItemDetails.id, name: upsellItemDetails.name, price_minor: upsellItemDetails.price_minor || 0 })
      toast.success(`Added ${upsellItemDetails.name} ✨`)
      setUpsellData(null)
    }
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotalMinor = totalAmountMinor()
  
  const effectiveGlobalPercent = (globalDiscountEnabled && globalDiscountPercentage) ? globalDiscountPercentage : 0
  const effectivePercent = Math.max(effectiveGlobalPercent, spinnerDiscount || 0)
  
  const discountMultiplier = effectivePercent / 100
  const discountAmountMinor = Math.floor(subtotalMinor * discountMultiplier)
  const discountedSubtotalMinor = subtotalMinor - discountAmountMinor
  
  const isDelivery = fulfillmentType === 'delivery'
  const appliedDeliveryFee = (isDelivery && deliveryFeeMinor) ? deliveryFeeMinor : 0
  const finalTotalMinor = discountedSubtotalMinor + appliedDeliveryFee

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    setIsFetchingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setTableNumber(prev => prev ? `${prev}\n📍 Live Location (Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)})` : `📍 Live Location (Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)})`)
        toast.success('Live location attached!')
        setIsFetchingLocation(false)
      },
      (error) => {
        console.error(error)
        toast.error('Unable to retrieve your location')
        setIsFetchingLocation(false)
      }
    )
  }

  const handleCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (isCheckingOut) return
    
    // Validation
    if (!customerName) {
      toast.error('Please enter your name')
      return
    }
    if (isDelivery && !tableNumber) {
      toast.error('Please enter your delivery address')
      return
    }
    if ((isDelivery || fulfillmentType === 'pickup') && !customerPhone) {
      toast.error('Please enter your phone number')
      return
    }
    if (isDelivery && deliveryMinimumOrderMinor && subtotalMinor < deliveryMinimumOrderMinor) {
      toast.error(`Minimum order for delivery is ${formatCurrency(deliveryMinimumOrderMinor)}`)
      return
    }

    setIsCheckingOut(true)
    if (!navigator.onLine) {
      toast.error("You're offline. Please reconnect to place your order.", { id: 'offline-checkout' })
      setIsCheckingOut(false)
      return
    }
    try {
      // Save profile to local storage for frictionless future checkouts
      localStorage.setItem('om_customer_profile', JSON.stringify({
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        address: tableNumber
      }))

      posthog.capture('checkout_completed', { organizationId, locationId, totalAmountMinor: finalTotalMinor })
      
      let paymentFractionMinor: number | undefined = undefined
      if (splitCount > 1) {
        paymentFractionMinor = Math.ceil(finalTotalMinor / splitCount)
      }

      const { checkoutUrl, orderId, error } = (await processCheckout(
        organizationId, locationId, items, finalTotalMinor, 0, tableNumber,
        customerNote, customerEmail, paymentFractionMinor, paymentMethod, discountAmountMinor,
        customerName, customerPhone, fulfillmentType, deliveryInstructions, undefined, undefined, pageId
      )) as { checkoutUrl?: string, orderId?: string, error?: string }

      if (error) {
        toast.error(error || 'Checkout failed')
        return
      }

      clearCart()
      localStorage.setItem('activeOrderId', orderId as string)
      
      try {
        const previousItemsJson = localStorage.getItem('pastOrderedItemIds')
        const previousItems: string[] = previousItemsJson ? JSON.parse(previousItemsJson) : []
        const currentItemIds = items.map(item => item.id)
        const newPastItems = Array.from(new Set([...previousItems, ...currentItemIds]))
        localStorage.setItem('pastOrderedItemIds', JSON.stringify(newPastItems))
      } catch (e) {
        console.error('Failed to save past orders', e)
      }
      
      if (paymentMethod === 'transfer' && manualPaymentEnabled) {
        const currentSlug = window.location.pathname.split('/')[2]
        window.location.href = `/m/${currentSlug}/order/${orderId}`
      } else if (splitCount > 1) {
        window.location.href = `/pay/${orderId}/share?split=${splitCount}`
      } else if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        toast.success('Order Sent to Kitchen!')
        setShowCheckoutModal(false)
      }
    } catch (e: unknown) {
      const err = e as Error
      toast.error(err.message || 'Could not initialize checkout. Please try again.')
    } finally {
      setIsCheckingOut(false)
    }
  }

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
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative flex items-center gap-3 pl-4">
                <div className="bg-zinc-800 dark:bg-zinc-100 w-10 h-10 rounded-full flex items-center justify-center relative">
                  <ShoppingBag className="w-5 h-5 text-white dark:text-zinc-900" />
                  <motion.div 
                    key={totalItems}
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-emerald-500 text-white w-5 h-5 text-[11px] font-black rounded-full flex items-center justify-center border-2 border-zinc-900 dark:border-white"
                  >
                    {totalItems}
                  </motion.div>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[15px]">View Order</span>
                  {discountAmountMinor > 0 && (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium tracking-wide">
                      Saved {formatCurrency(discountAmountMinor )}!
                    </span>
                  )}
                </div>
              </div>

              <div className="relative flex items-center gap-3 pr-4">
                <span className="text-[17px] font-black tracking-tight">
                  {formatCurrency(finalTotalMinor )}
                </span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCheckoutModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 pointer-events-auto">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md"
              onClick={() => setShowCheckoutModal(false)}
            />
            
            <motion.form
              onSubmit={handleCheckout}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl relative z-10 max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Checkout</h2>
                <button 
                  type="button"
                  aria-label="Close Checkout"
                  onClick={() => setShowCheckoutModal(false)} 
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto overflow-x-hidden -mx-6 px-6 pb-6 space-y-6 flex-1">
                {/* Fulfillment Type Segmented Control */}
                {!tableIdentifier && (showTableOption || showDeliveryOption || showPickupOption) && (
                  <div className="relative flex bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-md p-1.5 rounded-[1.25rem] shadow-inner">
                    {/* Animated Sliding Pill */}
                    <motion.div 
                      layout
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="absolute top-1.5 bottom-1.5 rounded-xl bg-white dark:bg-zinc-700 shadow-sm border border-zinc-200/50 dark:border-zinc-600/50"
                      style={{
                        left: fulfillmentType === 'table' ? '6px' : fulfillmentType === 'pickup' ? (showTableOption ? 'calc(33.33% + 4px)' : '6px') : (showTableOption ? 'calc(66.66% + 2px)' : 'calc(50% + 3px)'),
                        width: (showTableOption && showDeliveryOption && showPickupOption) ? 'calc(33.33% - 4px)' : ((showTableOption && showPickupOption) || (showTableOption && showDeliveryOption) || (showPickupOption && showDeliveryOption)) ? 'calc(50% - 6px)' : 'calc(100% - 12px)'
                      }}
                    />
                    
                    {showTableOption && (
                      <button
                        type="button"
                        className={`relative z-10 flex-1 py-2.5 text-[14px] font-bold rounded-xl transition-colors ${fulfillmentType === 'table' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                        onClick={() => setFulfillmentType('table')}
                      >
                        {fulfillmentLocationLabel}
                      </button>
                    )}
                    {showPickupOption && (
                      <button
                        type="button"
                        className={`relative z-10 flex-1 py-2.5 text-[14px] font-bold rounded-xl transition-colors ${fulfillmentType === 'pickup' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                        onClick={() => setFulfillmentType('pickup')}
                      >
                        Pickup
                      </button>
                    )}
                    {showDeliveryOption && (
                      <button
                        type="button"
                        className={`relative z-10 flex-1 py-2.5 text-[14px] font-bold rounded-xl transition-colors ${fulfillmentType === 'delivery' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                        onClick={() => setFulfillmentType('delivery')}
                      >
                        Delivery
                      </button>
                    )}
                  </div>
                )}

                {/* Customer Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FloatingInput 
                      label="Your Name *"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="John Doe"
                    />
                    <FloatingInput 
                      label="Phone Number *"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="08012345678"
                    />
                  </div>
                  <FloatingInput 
                    label="Email for receipt (Optional)"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>

                {/* Location / Table Input */}
                {!hideAddressField && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        {fulfillmentType === 'delivery' ? 'Delivery Address' : 
                         fulfillmentType === 'pickup' ? 'Pickup Details' : 
                         fulfillmentLocationLabel}
                      </label>
                      {fulfillmentType === 'delivery' && (
                        <button
                          type="button"
                          onClick={handleGetLocation}
                          disabled={isFetchingLocation}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 disabled:opacity-50 transition-colors bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          {isFetchingLocation ? 'Locating...' : 'Use current location'}
                        </button>
                      )}
                    </div>
                    {tableIdentifier && templateType !== 'catalog' ? (
                      <div className="w-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl px-4 py-3.5 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-between shadow-inner">
                        <span>{fulfillmentLocationLabel} {tableIdentifier}</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      </div>
                    ) : (
                      <textarea 
                        aria-label="Location or Delivery Address"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        placeholder={
                          fulfillmentType === 'delivery' ? "123 Main St, Apt 4B..." : 
                          fulfillmentType === 'pickup' ? "e.g. 'Pickup at 5pm' or 'Car details'" :
                          `Enter your ${fulfillmentLocationLabel} (e.g. 12 or 'VIP 1')`
                        }
                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none placeholder:text-zinc-400 text-[15px] transition-all"
                        rows={fulfillmentType === 'delivery' ? 2 : 1}
                      />
                    )}
                  </div>
                )}
                
                {/* Delivery Note / Instructions */}
                {fulfillmentType === 'delivery' && (
                  <div className="space-y-2">
                    {deliveryNote && (
                       <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">⚠️ {deliveryNote}</p>
                    )}
                    <textarea 
                      aria-label="Delivery instructions"
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      placeholder="Delivery instructions (e.g. leave at door)"
                      className="w-full h-16 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none placeholder:text-zinc-400 text-[15px]"
                    />
                  </div>
                )}
                
                {/* Optional Note */}
                <textarea 
                  aria-label="Order notes"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="Order notes (e.g. allergies, specific requests)"
                  className="w-full h-16 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none placeholder:text-zinc-400 text-[15px]"
                />

                {/* AI Upsell */}
                <AnimatePresence>
                  {upsellItemDetails && upsellData && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between gap-4 mt-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Pairs well</span>
                          </div>
                          <p className="text-[14px] text-zinc-900 dark:text-white font-semibold leading-tight">{upsellData.pitch}</p>
                          <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-1">{upsellItemDetails.name} • {formatCurrency(upsellItemDetails.price_minor )}</p>
                        </div>
                        <button 
                          type="button"
                          aria-label="Add upsell to cart"
                          onClick={handleAddUpsell}
                          className="shrink-0 w-10 h-10 rounded-full bg-white dark:bg-indigo-500 hover:scale-105 text-indigo-600 dark:text-white flex items-center justify-center transition-transform shadow-sm border border-indigo-100 dark:border-indigo-600"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Order Summary Accordion */}
                <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <button 
                    type="button" 
                    onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                    className="w-full flex items-center justify-between p-5 focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="w-5 h-5 text-zinc-500" />
                      <div className="text-left">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Order Summary</h3>
                        <p className="text-[12px] text-zinc-500">{items.reduce((acc, item) => acc + item.quantity, 0)} items • {formatCurrency(subtotalMinor)}</p>
                      </div>
                    </div>
                    <motion.div animate={{ rotate: isSummaryExpanded ? 180 : 0 }}>
                      <ChevronDown className="w-5 h-5 text-zinc-400" />
                    </motion.div>
                  </button>
                  
                  <AnimatePresence>
                    {isSummaryExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="px-5 pb-5 pt-1 space-y-4 border-t border-zinc-200 dark:border-zinc-800"
                      >
                        <div className="space-y-3">
                          <AnimatePresence>
                            {items.map(item => (
                              <motion.div 
                                layout
                                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                key={item.id} 
                                className="flex justify-between items-center group"
                              >
                                <div className="flex-1 min-w-0 pr-4">
                                  <h4 className="text-[14px] font-medium text-zinc-900 dark:text-white truncate">{item.name}</h4>
                                  <span className="text-[13px] text-zinc-500">{formatCurrency(item.price_minor )}</span>
                                </div>
                                <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full p-1 shadow-sm opacity-100 transition-opacity">
                                  <button type="button" aria-label={`Decrease quantity of ${item.name}`} onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-transform"><Minus className="w-3 h-3" /></button>
                                  <span className="text-zinc-900 dark:text-white font-bold text-[13px] w-3 text-center">{item.quantity}</span>
                                  <button type="button" aria-label={`Increase quantity of ${item.name}`} onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-transform"><Plus className="w-3 h-3" /></button>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {discountAmountMinor > 0 && (
                    <div className="px-5 pb-5">
                      <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-full mb-4" />
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-zinc-500 text-[14px]">
                          <span>Subtotal</span>
                          <span className="line-through">{formatCurrency(subtotalMinor )}</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium text-[14px]">
                          <span>Discount ({effectivePercent}%) {spinnerDiscount === effectivePercent && '🎲'}</span>
                          <span>-{formatCurrency(discountAmountMinor )}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-end p-5 bg-zinc-100/50 dark:bg-zinc-800/50">
                    <span className="text-[15px] font-bold text-zinc-900 dark:text-white">Total</span>
                    <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{formatCurrency(finalTotalMinor)}</span>
                  </div>
                </div>

                {/* Split Bill */}
                <div className="flex items-center justify-between p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <div>
                    <span className="text-[14px] font-bold text-zinc-900 dark:text-white block">Split Bill?</span>
                    {splitCount > 1 && (
                      <span className="text-xs text-zinc-500">{formatCurrency(Math.ceil(finalTotalMinor / splitCount))} per person</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 rounded-full p-1 border border-zinc-200 dark:border-zinc-700">
                    <button type="button" aria-label="Decrease split" onClick={() => setSplitCount(Math.max(1, splitCount - 1))} disabled={splitCount <= 1 || paymentMethod === 'transfer'} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-700 rounded-full text-zinc-600 dark:text-zinc-300 shadow-sm disabled:opacity-50"><Minus className="w-4 h-4" /></button>
                    <span className="text-zinc-900 dark:text-white font-bold w-4 text-center">{splitCount}</span>
                    <button type="button" aria-label="Increase split" onClick={() => setSplitCount(Math.min(10, splitCount + 1))} disabled={splitCount >= 10 || paymentMethod === 'transfer'} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-700 rounded-full text-zinc-600 dark:text-zinc-300 shadow-sm disabled:opacity-50"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Payment Method */}
                {paymentIsLive && manualPaymentEnabled && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Payment Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'card' ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                      >
                        <CreditCard className="w-6 h-6" />
                        <span className="text-sm font-bold">Online</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setPaymentMethod('transfer'); setSplitCount(1); }}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'transfer' ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                      >
                        <Building2 className="w-6 h-6" />
                        <span className="text-sm font-bold">Transfer</span>
                      </button>
                    </div>
                  </div>
                )}
                
                {manualPaymentEnabled && paymentMethod === 'transfer' && (
                  <div className="rounded-2xl border p-5 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20">
                    <h4 className="font-bold text-[14px] mb-3 text-amber-800 dark:text-amber-400 flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Transfer Details
                    </h4>
                    <div className="space-y-1.5 text-[14px]">
                      {manualPaymentBankName && <p className="text-amber-900/70 dark:text-amber-200/70">Bank: <span className="font-semibold text-amber-900 dark:text-amber-100">{manualPaymentBankName}</span></p>}
                      {manualPaymentAccountName && <p className="text-amber-900/70 dark:text-amber-200/70">Name: <span className="font-semibold text-amber-900 dark:text-amber-100">{manualPaymentAccountName}</span></p>}
                      {manualPaymentAccountNumber && <p className="text-amber-900/70 dark:text-amber-200/70">Account: <span className="font-mono font-bold text-amber-900 dark:text-amber-100 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded">{manualPaymentAccountNumber}</span></p>}
                    </div>
                    {manualPaymentInstructions && <p className="mt-4 text-[13px] text-amber-900/60 dark:text-amber-200/60 leading-relaxed">{manualPaymentInstructions}</p>}
                  </div>
                )}
                
                {refundPolicy && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                    <h4 className="text-[12px] font-bold text-red-800 dark:text-red-400 mb-1 uppercase tracking-wider">Cancellation Policy</h4>
                    <p className="text-[13px] text-red-900/80 dark:text-red-200/80 leading-relaxed">{refundPolicy}</p>
                  </div>
                )}
              </div>

              {/* Sticky Checkout Button */}
              <div className="pt-5 mt-auto shrink-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-200/50 dark:border-zinc-800/50 -mx-6 px-6 -mb-6 pb-8 sm:mb-0 sm:pb-0 sm:border-t-0 sm:pt-0 sm:bg-transparent">
                <button 
                  type="submit"
                  disabled={isCheckingOut || (!hideAddressField && !tableNumber && templateType !== 'catalog')}
                  className="relative group w-full overflow-hidden text-white dark:text-zinc-900 font-bold h-14 rounded-2xl shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95 text-[15px]"
                >
                  <div className="absolute inset-0 bg-zinc-900 dark:bg-white" />
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {isCheckingOut ? (
                    <div className="relative z-10 flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <div className="relative z-10 flex items-center justify-center gap-2 w-full px-6">
                      <div className="flex-1 text-left">
                        <span className="text-[13px] font-medium opacity-80 block -mb-1">Pay</span>
                        <span className="text-[16px] tracking-tight">{splitCount > 1 ? formatCurrency(Math.ceil(finalTotalMinor / splitCount)) : formatCurrency(finalTotalMinor)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/10 dark:bg-black/10 py-1.5 px-3 rounded-xl backdrop-blur-sm">
                        {paymentMethod === 'transfer' ? 'Transfer' : 'Complete Order'}
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  )}
                </button>
                <div className="mt-4 flex items-center justify-center gap-1.5 opacity-60">
                  <Lock className="w-3 h-3 text-zinc-500" />
                  <span className="text-[11px] text-zinc-500 font-medium">Payments securely processed by CruiseHQ (OurMenu)</span>
                </div>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
