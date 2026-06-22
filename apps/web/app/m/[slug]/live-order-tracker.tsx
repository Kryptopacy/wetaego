'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Tables } from '../../../../../types'

interface LiveOrderTrackerProps {
  organizationId: string
  locationId: string
}

export function LiveOrderTracker({ organizationId, locationId }: LiveOrderTrackerProps) {
  const supabase = createClient()
  const [order, setOrder] = useState<Tables<'orders'> | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const activeOrderId = localStorage.getItem('activeOrderId')
    if (!activeOrderId) return

    // Fetch initial order state
    const fetchOrder = async () => {
      const { data } = await supabase.from('orders').select('*').eq('id', activeOrderId).single()
      if (data) {
        setOrder(data)
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
      }, (payload) => {
        setOrder(payload.new as Tables<'orders'>)
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
      const target = order.estimated_ready_at ? new Date(order.estimated_ready_at).getTime() : 0
      const now = new Date().getTime()
      const diff = Math.max(0, Math.floor((target - now) / 1000))
      setTimeLeft(diff)
    }, 1000)

    return () => clearInterval(interval)
  }, [order])

  // Feedback logic moved to standalone page

  if (!order) return null

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
  }

  return (
    <>
      <AnimatePresence>
        {order.status === 'preparing' && (
          <motion.div
            layout
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25 }}
            className="sticky top-4 z-40 w-full bg-zinc-900/90 backdrop-blur-xl border border-blue-500/30 rounded-2xl py-3 px-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden flex items-center justify-between mb-6"
          >
            {/* Progress Bar Background */}
            <div 
              className="absolute inset-0 bg-blue-500/20" 
              style={{ width: `${Math.min(100, Math.max(0, 100 - (timeLeft / ((order.estimated_prep_time_minutes || 1) * 60)) * 100))}%`, transition: 'width 1s linear' }} 
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

      {order.status === 'completed' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center"
        >
          <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Enjoy your meal!</h2>
          <p className="text-zinc-400 mb-6">Your order has been completed and delivered.</p>
          <button
            onClick={() => window.location.href = `/m/${window.location.pathname.split('/')[2]}/feedback/${order.id}`}
            className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition-colors"
          >
            Leave Feedback & Tip
          </button>
        </motion.div>
      )}
    </>
  )
}
