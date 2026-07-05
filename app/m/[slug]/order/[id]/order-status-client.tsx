'use client'



import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils/currency'
import type { Database } from '@/lib/supabase/types'
import { DownloadReceiptButton } from './components/receipt-pdf'

type OrderRow = Database['public']['Tables']['orders']['Row']
type OrderPaymentRow = Database['public']['Tables']['order_payments']['Row']

type OrderWithRelations = OrderRow & {
  order_payments?: OrderPaymentRow[]
}

export function OrderStatusClient({ 
  initialOrder, 
  orgName,
  manualPaymentBankName, 
  manualPaymentAccountName, 
  manualPaymentAccountNumber, 
  manualPaymentInstructions,
  currencyCode,
  slug 
}: { 
  initialOrder: OrderWithRelations
  orgName: string
  manualPaymentBankName?: string
  manualPaymentAccountName?: string
  manualPaymentAccountNumber?: string
  manualPaymentInstructions?: string
  currencyCode: string
  slug: string
}) {
  const [order, setOrder] = useState<OrderWithRelations>(initialOrder)
  const supabase = createClient()

  useEffect(() => {
    const orderChannel = supabase
      .channel(`order-${order.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${order.id}`
      }, (payload: { new: Partial<OrderRow> }) => {
        setOrder((prev) => {
          if (payload.new.status === 'paid' && prev.status === 'pending') {
            toast.success('Payment completed! Your food is being prepared.')
          }
          return { ...prev, ...payload.new }
        })
      })
      .subscribe()

    const paymentsChannel = supabase
      .channel(`order-payments-${order.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'order_payments',
        filter: `order_id=eq.${order.id}`
      }, (payload: { new: OrderPaymentRow }) => {
        setOrder((prev) => {
          const updatedPayments = [...(prev.order_payments || []), payload.new]
          toast.success(`Payment share of ${formatCurrency(payload.new.amount_minor, currencyCode)} received!`)
          return { ...prev, order_payments: updatedPayments }
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(orderChannel)
      supabase.removeChannel(paymentsChannel)
    }
  }, [order.id, supabase, currencyCode])

  const copyToClipboard = () => {
    if (manualPaymentAccountNumber) {
      navigator.clipboard.writeText(manualPaymentAccountNumber)
      toast.success('Account number copied!')
    }
  }

  const payments = order.order_payments || []
  const amountPaid = payments.reduce((sum, p) => sum + p.amount_minor, 0)
  const totalAmount = order.total_amount_minor
  const amountRemaining = Math.max(0, totalAmount - amountPaid)
  const progressPercent = Math.min(100, (amountPaid / totalAmount) * 100)
  const isPartiallyPaid = amountPaid > 0 && amountPaid < totalAmount

  return (
    <div className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
      <div className="text-center mb-6 border-b border-zinc-800 pb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Order #{order.id.split('-')[0]}</h1>
        <p className="text-zinc-400">Total: <span className="font-bold text-white">{formatCurrency(totalAmount, currencyCode)}</span></p>
      </div>

      <AnimatePresence mode="wait">
        {order.status === 'pending' ? (
          <motion.div 
            key="pending"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center"
          >
            {isPartiallyPaid ? (
              <div className="w-full mb-8">
                <div className="flex justify-between items-end mb-2">
                  <h3 className="text-white font-bold">Split Progress</h3>
                  <span className="text-emerald-400 text-sm font-medium">{Math.round(progressPercent)}% Paid</span>
                </div>
                <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden mb-3">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${progressPercent}%` }} 
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Paid: <span className="text-white">{formatCurrency(amountPaid, currencyCode)}</span></span>
                  <span className="text-amber-400 font-medium">Left: {formatCurrency(amountRemaining, currencyCode)}</span>
                </div>

                {payments.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-zinc-800 w-full text-left">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Received Shares</p>
                    <div className="space-y-2">
                      {payments.map((p, idx) => (
                        <div key={p.id || idx} className="flex justify-between items-center bg-zinc-800/30 p-2 px-3 rounded-lg border border-zinc-700/30">
                          <span className="text-zinc-300 text-sm">Share #{idx + 1}</span>
                          <span className="text-emerald-400 font-medium text-sm">+{formatCurrency(p.amount_minor, currencyCode)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-amber-500/20 animate-pulse"></div>
                <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            
            <h2 className="text-xl font-bold text-white mb-2">{isPartiallyPaid ? 'Awaiting Remaining Balance' : 'Awaiting Transfer'}</h2>
            <p className="text-zinc-400 text-center text-sm mb-6 max-w-[280px]">
              {isPartiallyPaid ? 'Waiting for the rest of the group to pay their share.' : `Please make a transfer of ${formatCurrency(totalAmount, currencyCode)} to the account below.`} The cashier will verify and approve your order.
            </p>

            <div className="w-full bg-zinc-800/50 rounded-xl p-5 mb-6 relative overflow-hidden">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Bank Name</p>
                  <p className="font-bold text-white text-lg">{manualPaymentBankName || 'N/A'}</p>
                </div>
                {manualPaymentBankName?.toLowerCase().includes('opay') && (
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <span className="text-green-500 text-xs font-bold">O</span>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Account Number</p>
                <div className="flex items-center justify-between bg-black/20 rounded-lg p-3 group border border-zinc-700/50">
                  <p className="font-mono text-xl text-white tracking-wider">{manualPaymentAccountNumber || 'N/A'}</p>
                  <button onClick={copyToClipboard} className="text-emerald-400 hover:text-emerald-300 transition-colors p-2 -mr-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Account Name</p>
                <p className="font-medium text-zinc-300">{manualPaymentAccountName || 'N/A'}</p>
              </div>

              {manualPaymentInstructions && (
                <div className="mt-4 pt-4 border-t border-zinc-700/50">
                  <p className="text-xs text-amber-400/80">{manualPaymentInstructions}</p>
                </div>
              )}
            </div>

            <a href={`/m/${slug}`} className="w-full h-14 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors">
              Return to Menu
            </a>
          </motion.div>
        ) : (
          <motion.div 
            key="paid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Payment Confirmed!</h2>
            <p className="text-emerald-400/80 text-center font-medium mb-8">
              The kitchen is now preparing your order.
            </p>

            <div className="w-full space-y-3">
              <DownloadReceiptButton order={order} orgName={orgName} currencyCode={currencyCode} />
              
              <a href={`/m/${slug}`} className="w-full h-14 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors">
                Return to Menu
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
