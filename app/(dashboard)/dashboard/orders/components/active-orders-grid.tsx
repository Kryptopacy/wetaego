'use client'

import { useOptimistic, startTransition, useState, useMemo, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils/currency'
import { UIOrder } from '@/lib/types/frontend'
import { Printer } from 'lucide-react'
import { usePrinterStore } from '@/lib/stores/printer-store'
import { printOrder } from '@/lib/utils/printer'

interface ActiveOrdersGridProps {
  activeOrders: UIOrder[]
  currentUserId: string
  billingMode: string
  templateType?: string
  onClaimOrder: (id: string) => Promise<void>
  onMarkPaidOffline: (id: string) => Promise<void>
  onCompleteOrder: (id: string) => Promise<void>
  onCancelOrder: (id: string, reason: string, restock: boolean) => Promise<void>
}

export function ActiveOrdersGrid({ activeOrders, currentUserId, billingMode, templateType, onClaimOrder, onMarkPaidOffline, onCompleteOrder, onCancelOrder }: ActiveOrdersGridProps) {
  const [optimisticOrders, addOptimisticOrder] = useOptimistic(
    activeOrders,
    (state: UIOrder[], updatedOrder: Partial<UIOrder> & { id: string }) => {
      if (updatedOrder.status === 'completed' || updatedOrder.status === 'cancelled') {
        return state.filter(o => o.id !== updatedOrder.id)
      }
      return state.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o)
    }
  )

  const { mode, ipAddress } = usePrinterStore()

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'preparing'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [, setTick] = useState(0)

  // Force re-render every 30 seconds to update SLA timers
  useEffect(() => {
    if (templateType !== 'restaurant') return
    const interval = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(interval)
  }, [templateType])

  const filteredOrders = useMemo(() => {
    return optimisticOrders.filter(order => {
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery || 
        (order.table_identifier?.toLowerCase().includes(searchLower)) ||
        (order.customer_name?.toLowerCase().includes(searchLower)) ||
        (order.id.toLowerCase().includes(searchLower)) ||
        (order.order_items?.some(item => item.item_name.toLowerCase().includes(searchLower)))
      return matchesStatus && matchesSearch
    })
  }, [optimisticOrders, filterStatus, searchQuery])

  return (
      <div className="col-span-1 lg:col-span-2 border border-zinc-800 rounded-xl bg-zinc-900/30 flex flex-col overflow-hidden min-h-[500px]">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="font-bold text-white flex items-center gap-3">
              Active Orders
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs font-medium text-zinc-400">{filteredOrders.length}</span>
            </h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input 
                type="text" 
                placeholder="Search items, tables, or IDs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
            {['all', 'pending', 'paid', 'preparing'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  filterStatus === status 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-800'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              {optimisticOrders.length === 0 ? (
                <>
                  <p>Waiting for new orders...</p>
                  <p className="text-sm mt-2">Orders paid via Paystack will appear here instantly.</p>
                </>
              ) : (
                <p>No orders match the current filter.</p>
              )}
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className={`p-5 rounded-lg border ${order.status === 'paid' ? 'border-blue-500/50 bg-blue-500/5' : 'border-zinc-800 bg-zinc-900/50'}`}>
                <div className="flex justify-between items-start mb-4 border-b border-zinc-800/50 pb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-xl text-white">{order.table_identifier || 'Takeaway'}</span>
                      <span className="text-zinc-500">·</span>
                      <span className="text-zinc-300 font-medium">{order.customer_name || 'Guest'}</span>
                    </div>
                    <span className="text-sm text-zinc-500">Order #{order.id.split('-')[0]}</span>
                  </div>
                  <div className="text-right flex items-start gap-4">
                    <div>
                      <div className="font-bold text-lg text-white">{formatCurrency(order.total_amount_minor )}</div>
                      {(order.tip_amount_minor || 0) > 0 && (
                        <div className="text-sm text-blue-400 mb-1 font-medium">+ {formatCurrency(order.tip_amount_minor || 0)} Tip</div>
                      )}
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${order.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                        {order.status.toUpperCase()}
                      </span>
                      
                      {/* KDS SLA Timer */}
                      {templateType === 'restaurant' && order.status !== 'pending' && (
                        <div className="mt-2 text-right">
                          {(() => {
                            const waitMins = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)
                            const isWarning = waitMins >= 10 && waitMins < 15
                            const isCritical = waitMins >= 15
                            return (
                              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold border ${isCritical ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' : isWarning ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                                ⏱ {waitMins}m waiting
                              </span>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => printOrder(order, { mode, ipAddress })}
                      className="group relative p-2 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95 shadow-sm"
                      title="Print Fulfillment Ticket"
                    >
                      <Printer className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all bg-black text-xs text-white px-2 py-1 rounded shadow-xl whitespace-nowrap pointer-events-none">
                        Print Ticket
                      </span>
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-zinc-300">
                      <span><span className="text-zinc-500 mr-2">{item.quantity}x</span> {item.item_name}</span>
                    </div>
                  ))}
                </div>

                {order.customer_note && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg p-3 text-sm font-medium mb-4">
                    📝 Note: {order.customer_note}
                  </div>
                )}

                <div className={`flex justify-between items-center mt-4 pt-4 border-t border-zinc-800/50 ${templateType === 'restaurant' ? 'flex-col gap-4 sm:flex-row' : ''}`}>
                  <button
                    onClick={() => {
                      const reason = window.prompt('Reason for cancellation (e.g. Sold out, Guest left)?')
                      if (!reason) return
                      const restock = window.confirm('Restock these items back into inventory? (Click OK to restock, Cancel to keep inventory depleted)')
                      startTransition(() => {
                        addOptimisticOrder({ id: order.id, status: 'cancelled' })
                      })
                      onCancelOrder(order.id, reason, restock)
                    }}
                    className="px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 font-medium transition-colors text-sm"
                  >
                    Reject Order
                  </button>
                  <div className={`flex items-center gap-3 ${templateType === 'restaurant' ? 'w-full sm:w-auto flex-col sm:flex-row' : ''}`}>
                    {(!order.assigned_staff_id && (order.status === 'paid' || (order.status === 'pending' && billingMode === 'table_service'))) && (
                      <button 
                        onClick={() => {
                          startTransition(() => {
                            addOptimisticOrder({ id: order.id, assigned_staff_id: currentUserId, status: 'preparing' })
                          })
                          onClaimOrder(order.id)
                        }}
                        className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors animate-pulse"
                      >
                        {order.status === 'pending' ? 'Accept (Pay After)' : 'Claim Order'}
                      </button>
                    )}
                    {order.status === 'pending' && billingMode === 'standard_checkout' && (
                      <div className="flex items-center gap-4">
                        <span className="text-amber-500 text-sm font-medium flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          Waiting for payment
                        </span>
                        <button 
                          onClick={async () => {
                            startTransition(() => {
                              addOptimisticOrder({ id: order.id, status: 'paid' })
                            })
                            await onMarkPaidOffline(order.id)
                          }}
                          className="px-4 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-medium transition-colors text-sm"
                        >
                          Force Paid Offline
                        </button>
                      </div>
                    )}
                    {order.status === 'pending' && billingMode === 'table_service' && (
                      <button 
                        onClick={async () => {
                          startTransition(() => {
                            addOptimisticOrder({ id: order.id, status: 'paid' })
                          })
                          await onMarkPaidOffline(order.id)
                        }}
                        className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
                      >
                        Mark Paid Offline
                      </button>
                    )}
                    {order.status === 'preparing' && order.assigned_staff_id === currentUserId && (
                      <button 
                        onClick={async () => {
                          startTransition(() => {
                            addOptimisticOrder({ id: order.id, status: 'completed' })
                          })
                          await onCompleteOrder(order.id)
                        }}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${templateType === 'restaurant' ? 'w-full bg-emerald-600 hover:bg-emerald-500 text-white text-lg py-4 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                      >
                        {templateType === 'restaurant' ? 'Bump (Complete)' : 'Mark as Completed'}
                      </button>
                    )}
                    {order.status === 'preparing' && order.assigned_staff_id !== currentUserId && (
                      <div className="px-6 py-2 rounded-lg bg-zinc-800 text-zinc-400 font-medium">
                        Claimed (Preparing)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
  )
}
