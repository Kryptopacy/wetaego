'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UIOrder } from '@/lib/types/frontend'
import { formatCurrency } from '@/lib/utils/currency'
import { mapSupabaseOrderToUI } from '@/lib/utils/transformers'

interface OrderHistoryViewProps {
  organizationId: string
  locationId: string
  initialOrders: UIOrder[]
}

export function OrderHistoryView({ organizationId, locationId, initialOrders }: OrderHistoryViewProps) {
  const [orders, setOrders] = useState<UIOrder[]>(initialOrders)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialOrders.length >= 0) // We'll just assume there might be more initially
  const supabase = createClient()

  const loadMore = async () => {
    if (isLoading || orders.length === 0) return
    setIsLoading(true)

    const lastOrder = orders[orders.length - 1]
    const lastCreatedAt = lastOrder.created_at

    try {
      let query = supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('organization_id', organizationId)
        .eq('location_id', locationId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50)

      if (lastCreatedAt) {
         query = query.lt('created_at', lastCreatedAt)
      }

      const { data, error } = await query

      if (error) throw error

      if (data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const uiOrders = (data as any[]).map(mapSupabaseOrderToUI)
        setOrders(prev => [...prev, ...uiOrders])
        if (data.length < 50) {
          setHasMore(false)
        }
      } else {
        setHasMore(false)
      }
    } catch (e) {
      console.error('Failed to load more orders:', e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="col-span-1 lg:col-span-3 border border-zinc-800 rounded-xl bg-zinc-900/30 flex flex-col overflow-hidden min-h-[500px]">
      <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
        <h2 className="font-bold text-white flex items-center gap-3">
          Completed Orders
          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs font-medium text-zinc-400">History</span>
        </h2>
      </div>
      
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-zinc-800/50 text-xs uppercase text-zinc-500 border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4 font-medium">Order ID</th>
              <th className="px-6 py-4 font-medium">Table / Type</th>
              <th className="px-6 py-4 font-medium">Customer</th>
              <th className="px-6 py-4 font-medium">Items</th>
              <th className="px-6 py-4 font-medium">Total</th>
              <th className="px-6 py-4 font-medium text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                  No completed orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-zinc-500">
                    {order.id.split('-')[0]}
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-200">
                    {order.table_identifier || 'Takeaway'}
                  </td>
                  <td className="px-6 py-4">
                    {order.customer_name || 'Guest'}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {order.order_items?.map(i => `${i.quantity}x ${i.item_name}`).join(', ') || 'N/A'}
                  </td>
                  <td className="px-6 py-4 font-bold">
                    {order.status === 'cancelled' ? (
                      <div className="flex flex-col">
                        <span className="text-red-400 line-through">{formatCurrency(order.total_amount_minor)}</span>
                        <span className="text-xs text-red-400/80 uppercase tracking-wider font-bold mt-1">Cancelled</span>
                        {order.cancellation_reason && (
                          <span className="text-xs text-red-400/60 mt-0.5">"{order.cancellation_reason}"</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-emerald-400">{formatCurrency(order.total_amount_minor)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-xs">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {hasMore && orders.length > 0 && (
          <div className="p-4 border-t border-zinc-800 flex justify-center">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? 'Loading...' : 'Load Older Orders'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
