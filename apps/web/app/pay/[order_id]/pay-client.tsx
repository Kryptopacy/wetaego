'use client'

import { useState, useEffect } from 'react'
import { processExistingOrderPayment } from '../../m/[slug]/actions'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export interface Organization {
  name: string
  slug: string
}

export interface Order {
  id: string
  status: string
  total_amount_minor: number
  amount_paid_minor: number | null
  table_identifier: string | null
  created_at: string
  organization_id: string
  location_id: string
  organizations: Organization | Organization[] | null
}

export default function PayClient({
  order: initialOrder,
  splitCount
}: {
  order: Order
  splitCount: number
}) {
  const [order, setOrder] = useState(initialOrder)
  const [isProcessing, setIsProcessing] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`order-payment-${order.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`
        },
        (payload) => {
          setOrder((prev: Order) => ({ ...prev, ...payload.new } as Order))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [order.id, supabase])

  const remainingMinor = Math.max(0, order.total_amount_minor - (order.amount_paid_minor || 0))
  const suggestedShareMinor = splitCount > 1 ? Math.ceil(order.total_amount_minor / splitCount) : remainingMinor

  // We cap the suggested share at the remaining balance so they don't overpay
  const defaultPayAmount = Math.min(suggestedShareMinor, remainingMinor)

  const handlePay = async (amountMinor: number) => {
    if (amountMinor > remainingMinor) {
      toast.error('Cannot overpay balance')
      return
    }

    setIsProcessing(true)
    try {
      const { checkoutUrl, error } = await processExistingOrderPayment(
        order.id,
        amountMinor
      )

      if (error) {
        toast.error(error)
        setIsProcessing(false)
        return
      }

      if (checkoutUrl) {
        window.location.href = checkoutUrl
      }
    } catch {
      toast.error('Failed to initialize payment')
      setIsProcessing(false)
    }
  }

  const handleCustomPay = () => {
    const val = parseInt(customAmount)
    if (isNaN(val) || val <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    const valMinor = val * 100
    if (valMinor > remainingMinor) {
      toast.error(`Cannot pay more than the remaining balance (₦${(remainingMinor/100).toLocaleString()})`)
      return
    }
    handlePay(valMinor)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-50">
      <div className="max-w-md mx-auto space-y-3">
        {splitCount > 1 && defaultPayAmount < remainingMinor && (
          <button 
            onClick={() => handlePay(defaultPayAmount)}
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : `Pay My Share (₦${(defaultPayAmount / 100).toLocaleString()})`}
          </button>
        )}

        <button 
          onClick={() => handlePay(remainingMinor)}
          disabled={isProcessing}
          className={`w-full font-bold py-4 rounded-xl shadow-lg transition-colors disabled:opacity-50 ${splitCount > 1 && defaultPayAmount < remainingMinor ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-white text-black hover:bg-zinc-200'}`}
        >
          {isProcessing ? 'Processing...' : `Pay Remaining Balance (₦${(remainingMinor / 100).toLocaleString()})`}
        </button>

        <div className="flex gap-2 pt-2">
          <input 
            type="number"
            placeholder="Custom Amount (₦)"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-zinc-500"
          />
          <button 
            onClick={handleCustomPay}
            disabled={isProcessing || !customAmount}
            className="px-6 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            Pay
          </button>
        </div>
      </div>
    </div>
  )
}
