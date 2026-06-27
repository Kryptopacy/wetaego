'use client'

import { useState } from 'react'
import { CheckCircle2, ChevronRight, Circle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { toast } from 'sonner'
import { processCheckout } from '@/app/m/[slug]/actions'

interface Milestone {
  id: string
  name: string
  percentage: number
  status: 'paid' | 'unpaid'
}

export function QuotePayment({
  quoteId,
  organizationId,
  locationId,
  milestones,
  totalAmountMinor,
  customerName,
  customerEmail,
  customerPhone,
  themeColor,
  paymentStatus
}: {
  quoteId: string
  organizationId: string
  locationId: string
  milestones: Milestone[]
  totalAmountMinor: number
  customerName: string
  customerEmail?: string
  customerPhone?: string
  themeColor: string
  paymentStatus: string
}) {
  const [isProcessing, setIsProcessing] = useState(false)

  // Use defined milestones, or fallback to a single "Full Payment" milestone if none exist
  const effectiveMilestones = milestones.length > 0 ? milestones : [
    { id: 'full', name: 'Full Payment', percentage: 100, status: paymentStatus === 'paid' ? 'paid' : 'unpaid' } as Milestone
  ]

  const nextMilestone = effectiveMilestones.find(m => m.status === 'unpaid')
  const allPaid = effectiveMilestones.every(m => m.status === 'paid')

  const handlePay = async () => {
    if (!nextMilestone) return
    setIsProcessing(true)

    try {
      const paymentFractionMinor = Math.floor(totalAmountMinor * (nextMilestone.percentage / 100))
      
      const { checkoutUrl, error } = await processCheckout(
        organizationId,
        locationId,
        [], // Quotes don't have standard items at this phase
        totalAmountMinor,
        0,
        'Quote Payment', // tableIdentifier
        `Milestone Payment: ${nextMilestone.name}`, // customerNote
        customerEmail,
        paymentFractionMinor, // paymentFractionMinor
        'card', // paymentMethod
        0, // discountAmountMinor
        customerName,
        customerPhone,
        'table',
        undefined,
        `${quoteId}-${nextMilestone.id}` // idempotencyKey
      ) as { checkoutUrl?: string, error?: string }

      if (error) throw new Error(error)
      if (checkoutUrl) window.location.href = checkoutUrl
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Payment initiation failed')
      setIsProcessing(false)
    }
  }

  if (allPaid) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center mt-6">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
        <h3 className="text-emerald-500 font-bold">All Milestones Paid!</h3>
        <p className="text-sm text-emerald-500/80">Thank you for your business.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 mt-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="font-bold text-white text-sm">Payment Schedule</h3>
        </div>
        <div className="divide-y divide-zinc-800">
          {effectiveMilestones.map((milestone, idx) => {
            const amountMinor = Math.floor(totalAmountMinor * (milestone.percentage / 100))
            const isNext = nextMilestone?.id === milestone.id
            const isPaid = milestone.status === 'paid'

            return (
              <div key={milestone.id} className={`p-4 flex items-center justify-between ${isNext ? 'bg-zinc-800/50' : ''}`}>
                <div className="flex items-center gap-3">
                  {isPaid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className={`w-5 h-5 ${isNext ? 'text-zinc-300' : 'text-zinc-600'}`} />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${isPaid || isNext ? 'text-white' : 'text-zinc-500'}`}>
                      {milestone.name} ({milestone.percentage}%)
                    </p>
                    {isPaid && <p className="text-xs text-emerald-500">Paid</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${isPaid || isNext ? 'text-white' : 'text-zinc-500'}`}>
                    {formatCurrency(amountMinor)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {nextMilestone && (
        <button
          onClick={handlePay}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: themeColor }}
        >
          {isProcessing ? 'Processing...' : `Pay ${nextMilestone.name} (${formatCurrency(Math.floor(totalAmountMinor * (nextMilestone.percentage / 100)))})`}
          {!isProcessing && <ChevronRight className="w-5 h-5" />}
        </button>
      )}
    </div>
  )
}
