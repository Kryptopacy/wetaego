'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { processCheckout } from './actions'

interface LiveOrderTrackerProps {
  organizationId: string
  locationId: string
}

export function LiveOrderTracker({ organizationId, locationId }: LiveOrderTrackerProps) {
  const supabase = createClient()
  const [order, setOrder] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  
  // Feedback Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [tipSelection, setTipSelection] = useState<'0' | '10' | '15' | '20' | 'custom'>('0')
  const [customTip, setCustomTip] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const activeOrderId = localStorage.getItem('activeOrderId')
    if (!activeOrderId) return

    // Fetch initial order state
    const fetchOrder = async () => {
      const { data } = await supabase.from('orders').select('*').eq('id', activeOrderId).single()
      if (data) {
        setOrder(data)
        if (data.status === 'completed' && !data.tip_amount_minor) {
          setShowFeedbackModal(true)
        }
      }
    }
    fetchOrder()

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`order-${activeOrderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${activeOrderId}`
      }, (payload: any) => {
        setOrder(payload.new)
        if (payload.new.status === 'completed') {
          setShowFeedbackModal(true)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Countdown timer logic
  useEffect(() => {
    if (!order || order.status !== 'preparing' || !order.estimated_ready_at) return

    const interval = setInterval(() => {
      const target = new Date(order.estimated_ready_at).getTime()
      const now = new Date().getTime()
      const diff = Math.max(0, Math.floor((target - now) / 1000))
      setTimeLeft(diff)
    }, 1000)

    return () => clearInterval(interval)
  }, [order])

  const handleFeedbackSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a star rating')
      return
    }

    setIsSubmitting(true)
    try {
      // Calculate Tip
      const tipAmountMinor = tipSelection === 'custom'
        ? Math.round(parseFloat(customTip || '0') * 100)
        : Math.round(order.total_amount_minor * (parseInt(tipSelection) / 100))

      // 1. Submit Review
      await supabase.from('order_reviews').insert({
        organization_id: organizationId,
        location_id: locationId,
        order_id: order.id,
        staff_id: order.assigned_staff_id,
        rating,
        feedback: feedback || null
      })

      // 2. Handle Tip
      if (tipAmountMinor > 0) {
        // If there's a tip, we need to process a new payment intent
        // We reuse the processCheckout logic just for the tip amount
        const { checkoutUrl } = await processCheckout(organizationId, locationId, [{ id: 'tip', name: 'Service Tip', quantity: 1, price_minor: tipAmountMinor }], tipAmountMinor, tipAmountMinor, order.table_identifier, 'Tip Only')
        
        if (checkoutUrl) {
          localStorage.removeItem('activeOrderId')
          window.location.href = checkoutUrl
          return
        }
      } else {
        toast.success('Thank you for your feedback!')
      }

      setShowFeedbackModal(false)
      localStorage.removeItem('activeOrderId')
      setOrder(null)
    } catch (e) {
      toast.error('Something went wrong submitting your review.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!order) return null

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
  }

  return (
    <>
      <AnimatePresence>
        {order.status === 'preparing' && !showFeedbackModal && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="sticky top-4 z-40 w-full bg-zinc-900/90 backdrop-blur-xl border border-blue-500/30 rounded-2xl py-3 px-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden flex items-center justify-between mb-6"
          >
            {/* Progress Bar Background */}
            <div 
              className="absolute inset-0 bg-blue-500/20" 
              style={{ width: `${Math.min(100, Math.max(0, 100 - (timeLeft / (order.estimated_prep_time_minutes * 60)) * 100))}%`, transition: 'width 1s linear' }} 
            />
            
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm leading-tight">Preparing Order #{order.id.split('-')[0]}</span>
                <span className="text-zinc-400 text-xs font-medium">Your meal is on the way</span>
              </div>
            </div>
            
            <div className="relative z-10 text-right pl-4 border-l border-white/10">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block leading-none mb-1">Ready In</span>
              <span className="text-blue-400 font-black font-mono tracking-tighter text-lg leading-none">
                {formatTime(timeLeft)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback & Tip Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 pointer-events-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative z-10"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-2xl font-black text-white">Order Complete!</h2>
                <p className="text-zinc-400 mt-2">How was your service today?</p>
              </div>

              <div className="space-y-6">
                {/* Star Rating */}
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-4xl transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'text-zinc-700'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Any specific feedback for your waiter? (Optional)"
                  className="w-full h-24 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 resize-none text-sm"
                />

                <div className="border-t border-zinc-800/50 pt-6">
                  <label className="block text-sm font-medium text-zinc-400 mb-3 text-center">Leave a Tip for Flawless Service? (Optional)</label>
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {[
                      { val: '0', label: 'None' },
                      { val: '10', label: '10%' },
                      { val: '15', label: '15%' },
                      { val: '20', label: '20%' },
                      { val: 'custom', label: 'Custom' }
                    ].map(btn => (
                      <button
                        key={btn.val}
                        onClick={() => setTipSelection(btn.val as any)}
                        className={`py-2 text-sm rounded-lg font-medium transition-colors ${tipSelection === btn.val ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  {tipSelection === 'custom' && (
                    <input 
                      type="number" 
                      min="0"
                      step="100"
                      value={customTip}
                      onChange={(e) => setCustomTip(e.target.value)}
                      placeholder="Enter custom amount (₦)"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 mt-2"
                    />
                  )}
                </div>

                <button 
                  onClick={handleFeedbackSubmit}
                  disabled={isSubmitting || rating === 0}
                  className="w-full bg-white text-black font-bold py-4 rounded-xl shadow-lg flex items-center justify-center disabled:opacity-50 hover:bg-zinc-200 transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : (tipSelection !== '0' ? 'Submit & Pay Tip' : 'Submit Feedback')}
                </button>
                
                <button 
                  onClick={() => {
                    setShowFeedbackModal(false)
                    localStorage.removeItem('activeOrderId')
                  }}
                  className="w-full py-2 text-zinc-500 text-sm font-medium hover:text-white transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
