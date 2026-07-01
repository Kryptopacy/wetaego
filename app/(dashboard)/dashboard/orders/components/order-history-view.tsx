'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UIOrder } from '@/lib/types/frontend'
import { formatCurrency } from '@/lib/utils/currency'
import { mapSupabaseOrderToUI } from '@/lib/utils/transformers'
import { Skeleton } from '@/components/ui/skeleton'
import { StaggeredList } from '@/components/StaggeredList'

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
      
      <div className="flex-1">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
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
        </div>

        {/* Mobile Cards View */}
        <StaggeredList className="sm:hidden divide-y divide-zinc-800">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No completed orders found.
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="p-4 flex flex-col gap-3 hover:bg-zinc-800/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-500">#{order.id.split('-')[0]}</span>
                    <span className="font-medium text-zinc-200">{order.table_identifier || 'Takeaway'}</span>
                  </div>
                  <div className="text-right">
                    {order.status === 'cancelled' ? (
                      <div className="flex flex-col items-end">
                        <span className="text-red-400 line-through font-bold">{formatCurrency(order.total_amount_minor)}</span>
                        <span className="text-[10px] text-red-400/80 uppercase tracking-wider font-bold mt-0.5">Cancelled</span>
                      </div>
                    ) : (
                      <span className="text-emerald-400 font-bold">{formatCurrency(order.total_amount_minor)}</span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Customer</div>
                    <div className="text-zinc-300">{order.customer_name || 'Guest'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Date & Time</div>
                    <div className="text-zinc-300 text-xs">
                      {new Date(order.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-1">
                  <div className="text-xs text-zinc-500 mb-1">Items</div>
                  <div className="text-zinc-400 text-xs line-clamp-2">
                    {order.order_items?.map(i => `${i.quantity}x ${i.item_name}`).join(', ') || 'N/A'}
                  </div>
                </div>
                
                {order.status === 'cancelled' && order.cancellation_reason && (
                  <div className="text-xs text-red-400/60 bg-red-500/10 p-2 rounded-lg border border-red-500/20 mt-1">
                    "{order.cancellation_reason}"
                  </div>
                )}
              </div>
            ))
          )}
        </StaggeredList>
        
        {hasMore && orders.length > 0 && (
          <div className="p-4 border-t border-zinc-800 flex justify-center">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  Loading more...
                </div>
              ) : 'Load Older Orders'}
            </button>
          </div>
        )}

        {/* Skeletons to show while loading more */}
        {isLoading && (
          <div className="divide-y divide-zinc-800 border-t border-zinc-800">
            {[...Array(3)].map((_, i) => (
              <div key={`skeleton-${i}`} className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                  <div>
                    <Skeleton className="h-3 w-16 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-20 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <div className="mt-1">
                  <Skeleton className="h-3 w-10 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
