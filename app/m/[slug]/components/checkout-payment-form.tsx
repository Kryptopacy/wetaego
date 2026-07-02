'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Building2, Banknote, QrCode, Clock, Wallet, Lock, Shield, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'

type PaymentMethodId = 'card' | 'transfer' | 'iou' | 'pay_on_delivery_cash' | 'pay_on_delivery_link' | 'pay_after_service'

interface PaymentOptionConfig {
  id: PaymentMethodId
  label: string
  description: string
  icon: React.ReactNode
  gradient: string
  ring: string
  badge?: string
  badgeStyle?: string
  infoText?: string
  deliveryOnly?: boolean
  tableOnly?: boolean
}

const OPTIONS: PaymentOptionConfig[] = [
  {
    id: 'card',
    label: 'Pay by Card',
    description: 'Visa, Mastercard · instant confirmation',
    icon: <CreditCard className="w-5 h-5" />,
    gradient: 'from-indigo-500/20 to-violet-500/20',
    ring: 'ring-indigo-400/60 dark:ring-indigo-500/60',
    badge: '✦ Recommended',
    badgeStyle: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
  },
  {
    id: 'transfer',
    label: 'Bank Transfer',
    description: 'USSD or internet banking · verify after',
    icon: <Building2 className="w-5 h-5" />,
    gradient: 'from-amber-500/20 to-orange-500/20',
    ring: 'ring-amber-400/60 dark:ring-amber-500/60',
  },
  {
    id: 'pay_on_delivery_cash',
    label: 'Cash on Delivery',
    description: 'Pay the rider when your order arrives',
    icon: <Banknote className="w-5 h-5" />,
    gradient: 'from-emerald-500/20 to-green-500/20',
    ring: 'ring-emerald-400/60 dark:ring-emerald-500/60',
    deliveryOnly: true,
  },
  {
    id: 'pay_on_delivery_link',
    label: 'Pay on Arrival',
    description: "Secure payment link sent when rider arrives",
    icon: <QrCode className="w-5 h-5" />,
    gradient: 'from-teal-500/20 to-cyan-500/20',
    ring: 'ring-teal-400/60 dark:ring-teal-500/60',
    badge: 'No cash needed',
    badgeStyle: 'bg-teal-50 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400',
    infoText: "We'll email you a secure payment link the moment your rider arrives. Pay by card or transfer — no cash required.",
    deliveryOnly: true,
  },
  {
    id: 'pay_after_service',
    label: 'Pay After Service',
    description: 'Enjoy now, settle the bill at the end',
    icon: <Clock className="w-5 h-5" />,
    gradient: 'from-purple-500/20 to-fuchsia-500/20',
    ring: 'ring-purple-400/60 dark:ring-purple-500/60',
    infoText: 'Your order is confirmed now. The business will present your bill after service — settle by card, transfer, or cash.',
    tableOnly: true,
  },
  {
    id: 'iou',
    label: 'Store Credit',
    description: 'Draw from your pre-approved credit balance',
    icon: <Wallet className="w-5 h-5" />,
    gradient: 'from-rose-500/20 to-pink-500/20',
    ring: 'ring-rose-400/60 dark:ring-rose-500/60',
  },
]

function getVisibleOptions(
  pagePaymentOptions: string[],
  fulfillmentType: string | undefined,
  paymentIsLive: boolean,
  manualPaymentEnabled: boolean,
  iouPaymentEnabled: boolean,
): PaymentOptionConfig[] {
  const isDelivery = fulfillmentType === 'delivery'
  if (pagePaymentOptions.length > 0) {
    return OPTIONS.filter(opt => {
      if (!pagePaymentOptions.includes(opt.id)) return false
      if (opt.deliveryOnly && !isDelivery) return false
      if (opt.tableOnly && isDelivery) return false
      if (opt.id === 'iou' && !iouPaymentEnabled) return false
      return true
    })
  }
  const legacy: PaymentOptionConfig[] = []
  if (paymentIsLive) legacy.push(OPTIONS.find(o => o.id === 'card')!)
  if (manualPaymentEnabled || !paymentIsLive) legacy.push(OPTIONS.find(o => o.id === 'transfer')!)
  if (iouPaymentEnabled) legacy.push(OPTIONS.find(o => o.id === 'iou')!)
  return legacy.filter(Boolean)
}

function getCtaLabel(method: string, finalTotalMinor: number, isUnevenSplit?: boolean, splitCount?: number): string {
  if (isUnevenSplit) return `Share Bill — ${formatCurrency(finalTotalMinor)}`
  const amount = splitCount && splitCount > 1
    ? formatCurrency(Math.ceil(finalTotalMinor / splitCount))
    : formatCurrency(finalTotalMinor)
  switch (method) {
    case 'card':              return `Pay ${amount}`
    case 'transfer':          return `Confirm Order — ${amount}`
    case 'pay_on_delivery_cash': return 'Place Order'
    case 'pay_on_delivery_link': return 'Place Order'
    case 'pay_after_service': return 'Place Order'
    case 'iou':               return `Charge ${amount} from Credit`
    default:                  return `Pay ${amount}`
  }
}

interface CheckoutPaymentFormProps {
  paymentIsLive: boolean
  manualPaymentEnabled: boolean
  manualPaymentBankName?: string | null
  manualPaymentAccountName?: string | null
  manualPaymentAccountNumber?: string | null
  manualPaymentInstructions?: string | null
  paymentMethod: string
  setPaymentMethod: (m: string) => void
  splitCount: number
  setSplitCount: (n: number) => void
  finalTotalMinor: number
  isCheckingOut: boolean
  hideAddressField: boolean
  tableNumber: string
  templateType: string
  isUnevenSplit?: boolean
  iouPaymentEnabled?: boolean
  pagePaymentOptions?: string[]
  fulfillmentType?: string
}

export function CheckoutPaymentForm({
  paymentIsLive,
  manualPaymentEnabled,
  manualPaymentBankName,
  manualPaymentAccountName,
  manualPaymentAccountNumber,
  manualPaymentInstructions,
  paymentMethod,
  setPaymentMethod,
  splitCount,
  setSplitCount,
  finalTotalMinor,
  isCheckingOut,
  isUnevenSplit,
  iouPaymentEnabled = false,
  pagePaymentOptions = [],
  fulfillmentType,
}: CheckoutPaymentFormProps) {
  const visible = getVisibleOptions(pagePaymentOptions, fulfillmentType, paymentIsLive, manualPaymentEnabled, iouPaymentEnabled)
  const selected = OPTIONS.find(o => o.id === paymentMethod)
  const isOffline = ['pay_on_delivery_cash', 'pay_on_delivery_link', 'pay_after_service'].includes(paymentMethod)

  // If selection no longer valid for current options, pick first
  if (visible.length > 0 && !visible.find(o => o.id === paymentMethod)) {
    setPaymentMethod(visible[0].id)
  }

  return (
    <>
      {/* ─── Payment Method Picker ────────────────────────────── */}
      {visible.length > 1 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">How would you like to pay?</span>
          </div>

          <div className="space-y-2">
            {visible.map((opt, i) => {
              const isSelected = paymentMethod === opt.id
              return (
                <motion.button
                  key={opt.id}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  onClick={() => {
                    setPaymentMethod(opt.id)
                    if (isOffline) setSplitCount(1)
                  }}
                  className={`
                    relative w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border-2 text-left transition-all duration-200 overflow-hidden
                    ${isSelected
                      ? `ring-2 ${opt.ring} border-transparent shadow-lg`
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30'
                    }
                  `}
                >
                  {/* Animated gradient background for selected */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        key="gradient"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`absolute inset-0 bg-gradient-to-r ${opt.gradient}`}
                      />
                    )}
                  </AnimatePresence>

                  {/* Icon bubble */}
                  <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200
                    ${isSelected
                      ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {opt.icon}
                  </div>

                  {/* Text */}
                  <div className="relative z-10 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[14px] font-bold transition-colors ${isSelected ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {opt.label}
                      </span>
                      {opt.badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opt.badgeStyle ?? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className={`text-[12px] mt-0.5 leading-snug ${isSelected ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                      {opt.description}
                    </p>
                  </div>

                  {/* Selection indicator */}
                  <div className="relative z-10 shrink-0">
                    <AnimatePresence mode="wait">
                      {isSelected ? (
                        <motion.div key="check" initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                          <CheckCircle2 className="w-5 h-5 text-zinc-900 dark:text-white" />
                        </motion.div>
                      ) : (
                        <motion.div key="circle" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── Contextual Info Reveals ──────────────────────────── */}
      <AnimatePresence mode="wait">
        {/* Bank Transfer details */}
        {paymentMethod === 'transfer' && manualPaymentEnabled && (manualPaymentBankName || manualPaymentAccountNumber) && (
          <motion.div key="transfer-info" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="rounded-2xl border border-amber-200/80 dark:border-amber-500/25 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-[13px] font-bold text-amber-800 dark:text-amber-300">Bank Details</span>
              </div>
              <div className="space-y-1.5 text-[13px]">
                {manualPaymentBankName && <p className="text-amber-900/70 dark:text-amber-200/60">Bank: <span className="font-semibold text-amber-900 dark:text-amber-100">{manualPaymentBankName}</span></p>}
                {manualPaymentAccountName && <p className="text-amber-900/70 dark:text-amber-200/60">Name: <span className="font-semibold text-amber-900 dark:text-amber-100">{manualPaymentAccountName}</span></p>}
                {manualPaymentAccountNumber && (
                  <p className="text-amber-900/70 dark:text-amber-200/60">Account: <span className="font-mono font-bold text-amber-900 dark:text-amber-100 bg-amber-100/80 dark:bg-amber-500/20 px-2 py-0.5 rounded-lg tracking-wide">{manualPaymentAccountNumber}</span></p>
                )}
              </div>
              {manualPaymentInstructions && <p className="mt-3 text-[12px] text-amber-800/60 dark:text-amber-200/50 leading-relaxed border-t border-amber-200/50 dark:border-amber-500/20 pt-3">{manualPaymentInstructions}</p>}
            </div>
          </motion.div>
        )}

        {/* Pay-after-service info */}
        {paymentMethod === 'pay_after_service' && (
          <motion.div key="after-service" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="rounded-2xl border border-purple-200/80 dark:border-purple-500/25 bg-gradient-to-br from-purple-50 to-fuchsia-50/50 dark:from-purple-500/10 dark:to-fuchsia-500/5 p-4 flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-[13px] text-purple-900 dark:text-purple-200 leading-relaxed">
                Your order is confirmed instantly. The business will present your bill when you're done — you can pay by card, transfer, or cash.
              </p>
            </div>
          </motion.div>
        )}

        {/* Pay-on-arrival info */}
        {paymentMethod === 'pay_on_delivery_link' && (
          <motion.div key="arrival-link" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="rounded-2xl border border-teal-200/80 dark:border-teal-500/25 bg-gradient-to-br from-teal-50 to-cyan-50/50 dark:from-teal-500/10 dark:to-cyan-500/5 p-4 flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <QrCode className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              </div>
              <p className="text-[13px] text-teal-900 dark:text-teal-200 leading-relaxed">
                We'll email you a secure Paystack link the moment your rider arrives. Tap to pay — no cash needed.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Submit CTA ────────────────────────────────────────── */}
      <div className="pt-4 shrink-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-200/50 dark:border-zinc-800/50 -mx-6 px-6 -mb-6 pb-8 sm:mb-0 sm:pb-0 sm:border-0 sm:pt-0 sm:bg-transparent sm:dark:bg-transparent">
        <motion.button
          type="submit"
          disabled={isCheckingOut}
          whileTap={{ scale: 0.98 }}
          className="relative group w-full h-14 rounded-2xl overflow-hidden shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* Base dark fill */}
          <div className="absolute inset-0 bg-zinc-900 dark:bg-white" />

          {/* Gradient shimmer on hover */}
          {selected && (
            <div className={`absolute inset-0 bg-gradient-to-r ${selected.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
          )}

          {/* Shine sweep */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

          <div className="relative z-10 flex items-center justify-between h-full px-5 text-white dark:text-zinc-900">
            {isCheckingOut ? (
              <div className="flex items-center gap-3 mx-auto">
                <div className="w-4 h-4 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />
                <span className="font-bold text-[15px]">Processing…</span>
              </div>
            ) : (
              <>
                <span className="font-black text-[16px] tracking-tight">
                  {getCtaLabel(paymentMethod, finalTotalMinor, isUnevenSplit, splitCount)}
                </span>
                <div className="flex items-center gap-1.5 bg-white/12 dark:bg-black/10 py-1.5 px-3 rounded-xl backdrop-blur-sm">
                  {isOffline
                    ? <CheckCircle2 className="w-4 h-4" />
                    : <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  }
                </div>
              </>
            )}
          </div>
        </motion.button>

        <div className="mt-3 flex items-center justify-center gap-1.5 opacity-40">
          {isOffline ? (
            <><Shield className="w-3 h-3 text-zinc-500" /><span className="text-[11px] text-zinc-500 font-medium">Order confirmed by OurMenu OS</span></>
          ) : (
            <><Lock className="w-3 h-3 text-zinc-500" /><span className="text-[11px] text-zinc-500 font-medium">Payments secured by Paystack</span></>
          )}
        </div>
      </div>
    </>
  )
}
