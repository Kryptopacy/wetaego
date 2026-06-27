'use client'

import { CreditCard, Building2, ChevronRight, Lock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'

interface CheckoutPaymentFormProps {
  paymentIsLive: boolean
  manualPaymentEnabled: boolean
  manualPaymentBankName?: string | null
  manualPaymentAccountName?: string | null
  manualPaymentAccountNumber?: string | null
  manualPaymentInstructions?: string | null
  paymentMethod: 'card' | 'transfer'
  setPaymentMethod: (method: 'card' | 'transfer') => void
  splitCount: number
  setSplitCount: (count: number) => void
  finalTotalMinor: number
  isCheckingOut: boolean
  hideAddressField: boolean
  tableNumber: string
  templateType: string
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
  hideAddressField,
  tableNumber,
  templateType
}: CheckoutPaymentFormProps) {
  return (
    <>
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
    </>
  )
}
