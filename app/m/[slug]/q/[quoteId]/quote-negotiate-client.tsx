'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency } from '@/lib/utils/currency'
import { Check, MessageSquare, Lock } from 'lucide-react'
import { toast } from 'sonner'

type LineItem = { title: string; qty: number; unit_price_minor: number }

export function QuoteNegotiateClient({
  quoteId,
  pageId: _pageId,
  lineItems,
  currency,
  themeColor,
  businessName,
  isLocked,
  isExpired,
  paymentEnabled,
  paymentIsLive,
  onRequestChanges,
}: {
  quoteId: string
  pageId: string
  lineItems: LineItem[]
  currency: string
  themeColor: string
  businessName: string
  isLocked: boolean
  isExpired: boolean
  paymentEnabled: boolean
  paymentIsLive: boolean
  onRequestChanges: (message: string) => Promise<void>
}) {
  const [showChangesForm, setShowChangesForm] = useState(false)
  const [changeMessage, setChangeMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const [hasAccepted, setHasAccepted] = useState(false)

  const subtotal = lineItems.reduce((sum, i) => sum + i.unit_price_minor * i.qty, 0)

  async function handlePay() {
    startTransition(async () => {
      const res = await fetch('/api/quotes/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId }),
      })
      const data = await res.json()
      if (data.payment_url) {
        window.location.href = data.payment_url
      } else {
        toast.error(data.error || 'Could not initiate payment.')
      }
    })
  }

  async function handleRequestChanges(e: React.FormEvent) {
    e.preventDefault()
    if (!changeMessage.trim()) return
    startTransition(async () => {
      await onRequestChanges(changeMessage)
      setShowChangesForm(false)
      setChangeMessage('')
    })
  }

  if (hasAccepted && !paymentEnabled) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Quote Accepted!</h2>
        <p className="text-zinc-400">The team at {businessName} has been notified and will be in touch shortly.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Line Items Table */}
      <div className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Quote Line Items</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-6 py-3 text-left">Item</th>
              <th className="px-6 py-3 text-right">Qty</th>
              <th className="px-6 py-3 text-right">Unit Price</th>
              <th className="px-6 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {lineItems.map((item, idx) => (
              <tr key={idx} className="text-zinc-200">
                <td className="px-6 py-4 font-medium text-white">{item.title}</td>
                <td className="px-6 py-4 text-right text-zinc-400">{item.qty}</td>
                <td className="px-6 py-4 text-right">{formatCurrency(item.unit_price_minor, currency)}</td>
                <td className="px-6 py-4 text-right font-semibold">{formatCurrency(item.unit_price_minor * item.qty, currency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-white/5">
            <tr>
              <td colSpan={3} className="px-6 py-4 text-right font-bold text-zinc-300">Total</td>
              <td className="px-6 py-4 text-right text-xl font-black" style={{ color: themeColor }}>
                {formatCurrency(subtotal, currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Expired State */}
      {isExpired && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-center">
          <p className="text-red-400 font-semibold">This quote has expired.</p>
          <p className="text-zinc-500 text-sm mt-1">Please contact {businessName} to request a new proposal.</p>
        </div>
      )}

      {/* Locked State */}
      {isLocked && !isExpired && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center">
          <Lock className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-emerald-400 font-semibold">This quote has been accepted and locked.</p>
        </div>
      )}

      {/* Action Buttons — shown only when quote is open and not expired */}
      {!isLocked && !isExpired && (
        <div className="flex flex-col sm:flex-row gap-3">
          {paymentEnabled && paymentIsLive ? (
            <button
              onClick={handlePay}
              disabled={isPending}
              className="flex-1 py-4 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-50 hover:opacity-90 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}
            >
              {isPending ? 'Redirecting…' : `Accept & Pay ${formatCurrency(subtotal, currency)}`}
            </button>
          ) : (
            <button
              onClick={() => setHasAccepted(true)}
              disabled={isPending}
              className="flex-1 py-4 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-50 hover:opacity-90 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}
            >
              Accept Quote
            </button>
          )}

          <button
            onClick={() => setShowChangesForm(v => !v)}
            className="flex-1 sm:flex-none sm:px-6 py-4 rounded-2xl font-bold text-zinc-300 text-sm bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Request Changes
          </button>
        </div>
      )}

      {/* Request Changes Form */}
      <AnimatePresence>
        {showChangesForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleRequestChanges}
            className="overflow-hidden"
          >
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="text-white font-semibold">What would you like to change?</h3>
              <textarea
                value={changeMessage}
                onChange={e => setChangeMessage(e.target.value)}
                rows={4}
                required
                placeholder="e.g. Can we remove Item 2 and reduce Item 3 quantity to 2? Our budget is around ₦500,000."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-violet-500 focus:outline-none resize-none"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition-all"
                  style={{ backgroundColor: themeColor }}
                >
                  {isPending ? 'Sending…' : 'Send Change Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowChangesForm(false)}
                  className="px-6 py-3 rounded-xl font-medium text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center gap-1.5 pt-2 opacity-40">
        <Lock className="w-3 h-3 text-zinc-500" />
        <span className="text-[11px] text-zinc-500">Secured by OurMenu OS</span>
      </div>
    </div>
  )
}
