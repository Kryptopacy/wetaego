'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Smartphone, CheckCircle2, AlertCircle } from 'lucide-react'

interface DeskPayClientProps {
  resourceId: string
  resourceName: string
  slug: string
  initialOrderId: string | null
}

export function DeskPayClient({ resourceId, resourceName, slug, initialOrderId }: DeskPayClientProps) {
  const [orderId, setOrderId] = useState<string | null>(initialOrderId)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'waiting' | 'paying' | 'paid' | 'error'>('idle')
  const supabase = createClient()

  // 1. Listen for new orders assigned to this terminal
  useEffect(() => {
    // If we already have an orderId on load, fetch its details
    if (initialOrderId) {
      fetchOrderDetails(initialOrderId)
    } else {
      setStatus('waiting')
    }

    const channel = supabase
      .channel(`resource-${resourceId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'resources',
        filter: `id=eq.${resourceId}`
      }, (payload) => {
        const newOrderId = payload.new.current_order_id
        if (newOrderId && newOrderId !== orderId) {
          setOrderId(newOrderId)
          fetchOrderDetails(newOrderId)
        } else if (!newOrderId) {
          // Cashier recalled or finished the order
          setOrderId(null)
          setCheckoutUrl(null)
          setStatus('waiting')
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [resourceId, initialOrderId, supabase])

  // 2. Fetch order metadata to get Paystack checkout URL
  const fetchOrderDetails = async (id: string) => {
    const { data: order } = await supabase
      .from('orders')
      .select('metadata, status')
      .eq('id', id)
      .single()

    if (order?.status === 'paid' || order?.status === 'completed') {
      setStatus('paid')
      return
    }

    const metadata = order?.metadata as { checkout_url?: string } | null

    if (metadata?.checkout_url) {
      setCheckoutUrl(metadata.checkout_url)
      setStatus('paying')
      // Auto-redirect to Paystack
      window.location.href = metadata.checkout_url
    } else {
      setStatus('error')
    }
  }

  // Render states
  if (status === 'waiting' || status === 'idle') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-zinc-950 p-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/20 animate-pulse"></div>
          <Smartphone className="w-8 h-8 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">{resourceName}</h1>
        <p className="text-zinc-400 text-center max-w-sm">
          Please wait. The cashier will push your order to this screen shortly.
        </p>
      </div>
    )
  }

  if (status === 'paying') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-zinc-950 p-6">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
        <h1 className="text-xl font-bold text-white mb-2">Redirecting to Payment...</h1>
        <p className="text-zinc-400 text-sm text-center">
          If you are not redirected automatically,{' '}
          <a href={checkoutUrl!} className="text-emerald-500 hover:underline">click here</a>.
        </p>
      </div>
    )
  }

  if (status === 'paid') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-zinc-950 p-6">
        <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-6" />
        <h1 className="text-3xl font-black text-white mb-2">Payment Successful!</h1>
        <p className="text-zinc-400 text-center mb-8">
          Thank you for your order. The cashier has been notified.
        </p>
        <button 
          onClick={() => setStatus('waiting')}
          className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-colors border border-zinc-800"
        >
          Return to Waiting Screen
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-center">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
      <p className="text-zinc-400 max-w-xs">
        We couldn&apos;t find the checkout URL for this order. Please ask the cashier to try again.
      </p>
    </div>
  )
}
