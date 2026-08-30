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
  const [showApprovalSheet, setShowApprovalSheet] = useState(false)
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
          <button
            onClick={() => setShowApprovalSheet(true)}
            disabled={isPending}
            className="flex-1 py-4 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-50 hover:opacity-90 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}
          >
            {paymentEnabled && paymentIsLive ? `Approve & Pay Deposit (${formatCurrency(subtotal, currency)})` : 'Accept Quote →'}
          </button>

          <button
            onClick={() => setShowChangesForm(v => !v)}
            className="flex-1 sm:flex-none sm:px-6 py-4 rounded-2xl font-bold text-zinc-300 text-sm bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Request Changes
          </button>
        </div>
      )}

      {/* 2-Tap Mobile Sticky Approval Bar */}
      {!isLocked && !isExpired && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 z-40 sm:hidden shadow-2xl flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Total Amount</p>
            <p className="text-lg font-black text-white">{formatCurrency(subtotal, currency)}</p>
          </div>
          <button
            onClick={() => setShowApprovalSheet(true)}
            disabled={isPending}
            className="px-6 py-3 rounded-xl font-bold text-white text-sm shadow-lg active:scale-95 transition-all"
            style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}
          >
            Review & Approve →
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
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none resize-none"
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

      {/* 2nd-Tap Bottom Sheet Confirmation */}
      <AnimatePresence>
        {showApprovalSheet && !isLocked && !isExpired && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowApprovalSheet(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-lg font-black text-white">Confirm & Lock Proposal</h3>
                  <p className="text-xs text-zinc-400">Step 2 of 2: Final confirmation</p>
                </div>
                <button onClick={() => setShowApprovalSheet(false)} className="text-zinc-500 hover:text-white text-sm">✕</button>
              </div>

              <div className="bg-zinc-800/50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Total Investment</span>
                  <span className="font-bold text-white">{formatCurrency(subtotal, currency)}</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  By confirming, you authorize {businessName} to schedule your project according to this quote.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                {paymentEnabled && paymentIsLive ? (
                  <button
                    onClick={handlePay}
                    disabled={isPending}
                    className="w-full py-4 rounded-2xl font-bold text-white text-base shadow-xl transition-all"
                    style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}
                  >
                    {isPending ? 'Redirecting…' : `Confirm & Pay Deposit (${formatCurrency(subtotal, currency)})`}
                  </button>
                ) : (
                  <button
                    onClick={() => { setShowApprovalSheet(false); setHasAccepted(true); }}
                    disabled={isPending}
                    className="w-full py-4 rounded-2xl font-bold text-white text-base shadow-xl transition-all"
                    style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}
                  >
                    Confirm & Accept Quote
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowApprovalSheet(false);
                    setShowChangesForm(true);
                  }}
                  className="w-full py-3 rounded-xl font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 text-sm transition-colors"
                >
                  Request Changes Instead
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center gap-1.5 pt-2 opacity-40">
        <Lock className="w-3 h-3 text-zinc-500" />
        <span className="text-[11px] text-zinc-500">Secured by WETAEGO</span>
      </div>
    </div>
  )
}
