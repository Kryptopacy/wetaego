"use client";

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Sparkles, Plus, Minus, ShoppingBag, ChevronDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { CheckoutPaymentForm } from './checkout-payment-form'
import { toast } from 'sonner'
import { processCheckout } from '../actions'

// Extracted Floating Input
export function FloatingInput({ 
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

export interface CheckoutCartItem {
  id: string;
  name: string;
  price_minor: number;
  quantity: number;
  options?: Record<string, string>;
  image_url?: string;
}

export interface CheckoutMenuItem {
  id: string;
  name: string;
  price_minor: number;
  image_url?: string;
  description?: string;
}

export interface CheckoutTax {
  name: string;
  percentage: number;
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  items: CheckoutCartItem[]
  totalAmountMinor: () => number
  addItem: (item: Omit<CheckoutCartItem, 'quantity'>) => void
  updateQuantity: (id: string, delta: number) => void
  clearCart: () => void
  spinnerDiscount?: number | null

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
  menuItems?: CheckoutMenuItem[]
  templateType?: string
  deliveryEnabled?: boolean | null
  deliveryFeeMinor?: number | null
  deliveryMinimumOrderMinor?: number | null
  deliveryNote?: string | null
  fulfillmentLocationLabel?: string | null
  pageId?: string
  refundPolicy?: string | null
  pageFulfillmentOptions?: { pickup: boolean, delivery: boolean, table: boolean }
  __pageBillingMode?: string; pageBillingMode?: string
  locationTaxes?: CheckoutTax[]
}

export function CheckoutModal({
  isOpen,
  onClose,
  items,
  totalAmountMinor,
  addItem,
  updateQuantity,
  clearCart,
  spinnerDiscount,

  organizationId,
  locationId,
  tableIdentifier,
  paymentIsLive,
  manualPaymentEnabled = false,
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
  pageBillingMode: _pageBillingMode,
  locationTaxes = []
}: CheckoutModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const [isCheckingOut, setIsCheckingOut] = useState(false)
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
  const [splitType, setSplitType] = useState<'even' | 'uneven'>('even')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>(paymentIsLive ? 'card' : 'transfer')

  // Auto-fill customer data on load
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem('om_customer_profile')
      if (saved) {
        const profile = JSON.parse(saved)
        if (profile.name && !customerName) Promise.resolve().then(() => setCustomerName(profile.name))
        if (profile.email && !customerEmail) Promise.resolve().then(() => setCustomerEmail(profile.email))
        if (profile.phone && !customerPhone) Promise.resolve().then(() => setCustomerPhone(profile.phone))
        if (profile.address && !tableIdentifier && !tableNumber) Promise.resolve().then(() => setTableNumber(profile.address)) // reuse for delivery address
      }
    } catch {
      // Ignore
    }
  }, [tableIdentifier, customerName, customerEmail, customerPhone, tableNumber])

  // AI Upselling State
  const [upsellData, setUpsellData] = useState<{ suggestedItemId: string, pitch: string } | null>(null)
  const isFetchingUpsell = useRef(false)

  useEffect(() => {
    if (isOpen && items.length > 0 && menuItems.length > 0 && !upsellData && !isFetchingUpsell.current) {
      isFetchingUpsell.current = true
      const controller = new AbortController()
      const fetchUpsell = async () => {
        try {
          const res = await fetch('/api/upsell', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartItems: items, availableItems: menuItems, templateType }),
            signal: controller.signal
          })
          if (res.ok) {
            const data = await res.json()
            setUpsellData(data)
          }
        } catch (e) {
          if (e instanceof Error && e.name !== 'AbortError') {
             console.error('Upsell fetch failed', e)
          }
        } finally {
          isFetchingUpsell.current = false
        }
      }
      fetchUpsell()
      
      return () => {
        controller.abort()
        isFetchingUpsell.current = false
      }
    }
  }, [isOpen, items, items.length, menuItems, templateType, upsellData])

  const upsellItemDetails = upsellData ? menuItems.find(i => i.id === upsellData.suggestedItemId) : null

  const handleAddUpsell = () => {
    if (upsellItemDetails) {
      addItem({ id: upsellItemDetails.id, name: upsellItemDetails.name, price_minor: upsellItemDetails.price_minor || 0 })
      toast.success(`Added ${upsellItemDetails.name} ✨`)
      setUpsellData(null)
    }
  }

  const subtotalMinor = totalAmountMinor()
  const effectiveGlobalPercent = (globalDiscountEnabled && globalDiscountPercentage) ? globalDiscountPercentage : 0
  const effectivePercent = Math.max(effectiveGlobalPercent, spinnerDiscount || 0)
  
  const discountMultiplier = effectivePercent / 100
  const discountAmountMinor = Math.floor(subtotalMinor * discountMultiplier)
  const discountedSubtotalMinor = subtotalMinor - discountAmountMinor
  
  // Calculate Taxes based on discounted subtotal
  const taxBreakdown = locationTaxes.map(tax => {
    const taxAmount = Math.floor(discountedSubtotalMinor * (tax.percentage / 100))
    return { name: tax.name, percentage: tax.percentage, amount_minor: taxAmount }
  })
  const taxTotalMinor = taxBreakdown.reduce((sum, tax) => sum + tax.amount_minor, 0)
  
  const isDelivery = fulfillmentType === 'delivery'
  const appliedDeliveryFee = (isDelivery && deliveryFeeMinor) ? deliveryFeeMinor : 0
  
  const finalTotalMinor = discountedSubtotalMinor + taxTotalMinor + appliedDeliveryFee

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
      localStorage.setItem('om_customer_profile', JSON.stringify({
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        address: tableNumber
      }))

      // Dynamically import posthog to prevent issues with SSR/Edge
      const posthog = (await import('posthog-js')).default
      posthog.capture('checkout_completed', { organizationId, locationId, totalAmountMinor: finalTotalMinor })
      
      let paymentFractionMinor: number | undefined = undefined
      if (splitCount > 1 && splitType === 'even') {
        paymentFractionMinor = Math.ceil(finalTotalMinor / splitCount)
      }

      const isUnevenSplit = splitCount > 1 && splitType === 'uneven'

      const result = await processCheckout({
        organizationId, locationId, items, totalAmountMinor: finalTotalMinor, tipAmountMinor: 0,
        tableIdentifier: tableNumber, customerNote, customerEmail, paymentFractionMinor,
        paymentMethod, discountAmountMinor, customerName, customerPhone,
        fulfillmentType, deliveryInstructions, staffId: undefined, staffSubaccountOverride: undefined,
        pageId, idempotencyKey: undefined, subtotalMinor: discountedSubtotalMinor, taxTotalMinor, taxBreakdown,
        isUnevenSplit
      })

      if (result?.serverError || result?.validationErrors) {
        toast.error(result?.serverError || 'Checkout failed')
        return
      }

      const { checkoutUrl, orderId } = result.data || {}

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
        const currentSlug = window.location.pathname.split('/')[2]
        window.location.href = `/pay/${orderId}/share?split=${splitCount}&slug=${currentSlug}`
      } else if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        toast.success('Order Sent to Kitchen!')
        onClose()
      }
    } catch (e: unknown) {
      const err = e as Error
      toast.error(err.message || 'Could not initialize checkout. Please try again.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  // Calculate sliding pill positions based on active options
  const getPillStyle = () => {
    const activeCount = [showTableOption, showPickupOption, showDeliveryOption].filter(Boolean).length
    if (activeCount === 0) return { display: 'none' }
    
    let left = '6px'
    let width = '100%'

    if (activeCount === 3) {
      width = 'calc(33.33% - 4px)'
      if (fulfillmentType === 'pickup') left = 'calc(33.33% + 4px)'
      else if (fulfillmentType === 'delivery') left = 'calc(66.66% + 2px)'
    } else if (activeCount === 2) {
      width = 'calc(50% - 6px)'
      if (fulfillmentType === 'table' && !showPickupOption) left = '6px' // Table is first
      else if (fulfillmentType === 'pickup' && !showTableOption) left = '6px' // Pickup is first
      else if (fulfillmentType !== 'table' && showTableOption) left = 'calc(50% + 3px)' // Second option
      else if (fulfillmentType === 'delivery') left = 'calc(50% + 3px)'
    }
    return { left, width }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-modal-title"
        >
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />
          
          <motion.form
            onSubmit={handleCheckout}
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl relative z-10 max-h-[90vh] flex flex-col"
          >
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 id="checkout-modal-title" className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Checkout</h2>
              <button 
                type="button"
                aria-label="Close Checkout"
                onClick={onClose} 
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
                    style={getPillStyle()}
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
              <div className="flex flex-col gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[14px] font-bold text-zinc-900 dark:text-white block">Split Bill?</span>
                    {splitCount > 1 && splitType === 'even' && (
                      <span className="text-xs text-zinc-500">{formatCurrency(Math.ceil(finalTotalMinor / splitCount))} per person</span>
                    )}
                    {splitCount > 1 && splitType === 'uneven' && (
                      <span className="text-xs text-zinc-500">Group members choose amount</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 rounded-full p-1 border border-zinc-200 dark:border-zinc-700">
                    <button type="button" aria-label="Decrease split" onClick={() => setSplitCount(Math.max(1, splitCount - 1))} disabled={splitCount <= 1 || paymentMethod === 'transfer'} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-700 rounded-full text-zinc-600 dark:text-zinc-300 shadow-sm disabled:opacity-50"><Minus className="w-4 h-4" /></button>
                    <span className="text-zinc-900 dark:text-white font-bold w-4 text-center">{splitCount}</span>
                    <button type="button" aria-label="Increase split" onClick={() => setSplitCount(Math.min(10, splitCount + 1))} disabled={splitCount >= 10 || paymentMethod === 'transfer'} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-zinc-700 rounded-full text-zinc-600 dark:text-zinc-300 shadow-sm disabled:opacity-50"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>

                {splitCount > 1 && (
                  <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSplitType('even')}
                      className={`flex-1 text-[13px] font-bold py-2 rounded-lg transition-colors ${splitType === 'even' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                      Even Split
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitType('uneven')}
                      className={`flex-1 text-[13px] font-bold py-2 rounded-lg transition-colors ${splitType === 'uneven' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                      Uneven / Custom
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Method / Action Buttons (Extracted Component) */}
              <CheckoutPaymentForm 
                paymentIsLive={paymentIsLive || false}
                manualPaymentEnabled={manualPaymentEnabled || false}
                manualPaymentBankName={manualPaymentBankName}
                manualPaymentAccountName={manualPaymentAccountName}
                manualPaymentAccountNumber={manualPaymentAccountNumber}
                manualPaymentInstructions={manualPaymentInstructions}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                splitCount={splitCount}
                setSplitCount={setSplitCount}
                finalTotalMinor={finalTotalMinor}
                isCheckingOut={isCheckingOut}
                hideAddressField={hideAddressField}
                tableNumber={tableNumber}
                templateType={templateType}
              />
              
              {refundPolicy && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                  <h4 className="text-[12px] font-bold text-red-800 dark:text-red-400 mb-1 uppercase tracking-wider">Cancellation Policy</h4>
                  <p className="text-[13px] text-red-900/80 dark:text-red-200/80 leading-relaxed">{refundPolicy}</p>
                </div>
              )}
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
  )
}
