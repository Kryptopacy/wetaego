'use client'

import { useState } from 'react'
import { Search, CheckCircle2, Settings, MessageSquare } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { getTrackingDetailsAction, sendMessageAction, generateBalancePaymentLinkAction } from './actions'
import { AnimatedDialog, AnimatedDialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Building2 } from 'lucide-react'

type TrackOrderClientProps = {
  location: { id: string; currency_code: string; [key: string]: unknown }
}

type OrderDetails = {
  id: string
  tracking_code: string | null
  status: string
  total_amount_minor: number
  amount_paid_minor: number | null
  created_at: string
  customer_name: string | null
  milestones: Array<{
    id: string
    title: string
    description: string | null
    is_completed: boolean | null
    created_at: string
    completed_at: string | null
  }>
  items: Array<{
    item_name: string
    quantity: number
  }>
}

export function TrackOrderClient({ location }: TrackOrderClientProps) {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<OrderDetails | null>(null)

  const [message, setMessage] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [messageSent, setMessageSent] = useState(false)

  const [isPaying, setIsPaying] = useState(false)
  const [manualDetails, setManualDetails] = useState<{ bankName?: string | null; accountName?: string | null; accountNumber?: string | null; instructions?: string | null } | null>(null)

  const balance = order ? Math.max(0, order.total_amount_minor - (order.amount_paid_minor || 0)) : 0

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setIsLoading(true)
    setError('')
    setOrder(null)

    try {
      const res = await getTrackingDetailsAction(location.id, code.trim())
      if (!res.success || !res.data) {
        setError(res.error || 'Invalid tracking code or order not found.')
      } else {
        setOrder(res.data)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !order) return

    setIsSendingMessage(true)
    try {
      const res = await sendMessageAction(location.id, order.tracking_code || '', message.trim())
      if (res.success) {
        setMessageSent(true)
        setMessage('')
        setTimeout(() => setMessageSent(false), 5000)
      } else {
        setError(res.error || 'Failed to send message.')
      }
    } catch (_err: unknown) {
      setError('Something went wrong sending your message.')
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handlePayBalance = async () => {
    if (!order) return
    setIsPaying(true)
    try {
      const res = await generateBalancePaymentLinkAction(location.id, order.tracking_code || '')
      if (!res.success || !res.data) {
        setError(res.error || 'Failed to initiate payment')
        return
      }
      
      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl
      } else if (res.data.manualDetails) {
        setManualDetails(res.data.manualDetails)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment initiation failed')
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-blue-500/10 text-blue-600 dark:text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Settings className="w-8 h-8 animate-[spin_4s_linear_infinite]" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Track Your Repair</h1>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto text-lg">
          Enter the tracking code provided at drop-off to view real-time updates on your service.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. REP-A84K2"
            className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-32 text-lg font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 placeholder:font-normal focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all uppercase"
          />
          <div className="absolute inset-y-2 right-2">
            <button
              type="submit"
              disabled={isLoading || !code.trim()}
              className="h-full px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Track'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium text-center border border-red-100 dark:border-red-500/20">
            {error}
          </div>
        )}
      </div>

      {order && (
        <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/20 dark:shadow-none">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Order Status</p>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white mt-1 capitalize">
                  {order.status === 'completed' ? 'Completed & Ready' : 'In Progress'}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Amount</p>
                <p className="text-lg font-black text-zinc-900 dark:text-white">{formatCurrency(order.total_amount_minor, location.currency_code)}</p>
              </div>
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
                <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">Amount Paid</p>
                <p className="text-lg font-black text-green-700 dark:text-green-300">{formatCurrency(order.amount_paid_minor || 0, location.currency_code)}</p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Remaining Balance</p>
                <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{formatCurrency(balance, location.currency_code)}</p>
              </div>
              {balance > 0 && (
                <button
                  onClick={handlePayBalance}
                  disabled={isPaying}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPaying ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Pay Balance'}
                </button>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">Timeline</h3>
              
              <div className="relative pl-6 space-y-8 py-4">
                {/* Vertical Line */}
                <div className="absolute top-0 bottom-0 left-[11px] w-0.5 bg-zinc-200 dark:bg-zinc-800" />
                
                {/* Intake step (auto-generated) */}
                <div className="relative">
                  <div className="absolute -left-[30px] top-1 w-6 h-6 rounded-full bg-blue-500 border-4 border-white dark:border-zinc-900 flex items-center justify-center shadow-sm z-10">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white">Order Received</h4>
                    <p className="text-sm text-zinc-500 mt-1">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                </div>

                {order.milestones.map((m) => (
                  <div key={m.id} className="relative">
                    <div className={`absolute -left-[30px] top-1 w-6 h-6 rounded-full border-4 border-white dark:border-zinc-900 flex items-center justify-center z-10 transition-colors duration-500 ${m.is_completed ? 'bg-blue-500' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
                      {m.is_completed ? <CheckCircle2 className="w-3 h-3 text-white" /> : <div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-600" />}
                    </div>
                    <div>
                      <h4 className={`font-bold ${m.is_completed ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        {m.title}
                      </h4>
                      {m.description && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1.5 whitespace-pre-line bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                          {m.description}
                        </p>
                      )}
                      {m.is_completed && m.completed_at && (
                        <p className="text-xs text-zinc-500 font-medium mt-2">{new Date(m.completed_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-500 uppercase tracking-wider mb-3">Service Items</h3>
              <ul className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm py-2 border-b border-zinc-100 last:border-0 text-zinc-700 dark:text-zinc-300">
                    <span>{item.quantity}x {item.item_name}</span>
                  </div>
                ))}
              </ul>
            </div>
            
            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                Message the Shop
              </h3>
              
              {messageSent ? (
                <div className="bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-xl border border-green-100 dark:border-green-500/20 flex items-center gap-3 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Message sent successfully! The shop will be notified.</span>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-3">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask a question, approve a repair cost, or provide additional details..."
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none h-24 text-zinc-900 dark:text-white placeholder:text-zinc-400"
                    required
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSendingMessage || !message.trim()}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                    >
                      {isSendingMessage ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : 'Send Message'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      
      <AnimatedDialog open={!!manualDetails} onOpenChange={(open) => !open && setManualDetails(null)}>
        {manualDetails && (
          <AnimatedDialogContent isOpen={!!manualDetails} className="max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl">
            <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-white">Bank Transfer Details</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400 mt-1 mb-6">
              Please transfer the remaining balance to the following bank account.
            </DialogDescription>
            <div className="rounded-2xl border border-amber-200/80 dark:border-amber-500/25 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-[13px] font-bold text-amber-800 dark:text-amber-300">Bank Details</span>
              </div>
              <div className="space-y-1.5 text-[13px]">
                {manualDetails.bankName && <p className="text-amber-900/70 dark:text-amber-200/60">Bank: <span className="font-semibold text-amber-900 dark:text-amber-100">{manualDetails.bankName}</span></p>}
                {manualDetails.accountName && <p className="text-amber-900/70 dark:text-amber-200/60">Name: <span className="font-semibold text-amber-900 dark:text-amber-100">{manualDetails.accountName}</span></p>}
                {manualDetails.accountNumber && (
                  <p className="text-amber-900/70 dark:text-amber-200/60">Account: <span className="font-mono font-bold text-amber-900 dark:text-amber-100 bg-amber-100/80 dark:bg-amber-500/20 px-2 py-0.5 rounded-lg tracking-wide">{manualDetails.accountNumber}</span></p>
                )}
              </div>
              {manualDetails.instructions && <p className="mt-3 text-[12px] text-amber-800/60 dark:text-amber-200/50 leading-relaxed border-t border-amber-200/50 dark:border-amber-500/20 pt-3">{manualDetails.instructions}</p>}
            </div>
            <button
              onClick={() => setManualDetails(null)}
              className="mt-6 w-full py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold rounded-xl transition-colors"
            >
              Done
            </button>
          </AnimatedDialogContent>
        )}
      </AnimatedDialog>
    </div>
  )
}
