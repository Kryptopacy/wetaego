'use client'

import { useOptimistic, startTransition, useState, useMemo, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils/currency'
import { UIOrder } from '@/lib/types/frontend'
import { Printer, MapPin } from 'lucide-react'
import { usePrinterStore } from '@/lib/stores/printer-store'
import { printOrder } from '@/lib/utils/printer'
import { PINPromptModal } from './pin-prompt-modal'
import { MilestonesManager } from './milestones-manager'
import { toast } from 'sonner'

interface ActiveOrdersGridProps {
  activeOrders: UIOrder[]
  currentUserId: string
  billingMode: string
  templateType?: string
  onClaimOrder: (id: string) => Promise<void>
  onMarkPaidOffline: (id: string) => Promise<void>
  onCompleteOrder: (id: string) => Promise<void>
  onCancelOrder: (id: string, reason: string, restock: boolean) => Promise<void>
  onSendPaymentLink: (id: string) => Promise<void>
  onVoidOrder: (id: string, pin: string) => Promise<{success: boolean, error?: string}>
  onRefundOrder: (id: string, pin: string) => Promise<{success: boolean, error?: string}>
}

export function ActiveOrdersGrid({ activeOrders, currentUserId, billingMode, templateType, onClaimOrder, onMarkPaidOffline, onCompleteOrder, onCancelOrder, onSendPaymentLink, onVoidOrder, onRefundOrder }: ActiveOrdersGridProps) {
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
  const [cancelState, setCancelState] = useState<{ orderId: string; reason: string; restock: boolean } | null>(null)
  
  // States for Void/Refund
  const [voidState, setVoidState] = useState<{ orderId: string } | null>(null)
  const [refundState, setRefundState] = useState<{ orderId: string } | null>(null)
  const [milestonesOrder, setMilestonesOrder] = useState<UIOrder | null>(null)
  const [isProcessingAction, setIsProcessingAction] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleShareDispatch = async (orderId: string) => {
    const link = `${window.location.origin}/d/${orderId}`
    try {
      await navigator.clipboard.writeText(link)
      toast.success('Dispatch link copied to clipboard!')
    } catch (_err) {
      toast.error(`Failed to copy. Share this link: ${link}`)
    }
  }

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
                onClick={() => setFilterStatus(status as 'all' | 'pending' | 'paid' | 'preparing')}
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

        {/* Cancel Order Modal */}
        {cancelState && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-white font-bold text-lg mb-1">Cancel Order</h3>
              <p className="text-zinc-400 text-sm mb-4">This cannot be undone. Provide a reason below.</p>
              <textarea
                autoFocus
                value={cancelState.reason}
                onChange={(e) => setCancelState(s => s ? { ...s, reason: e.target.value } : null)}
                placeholder="e.g. Sold out, Guest left, Wrong order..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-red-500/50 resize-none mb-4"
                rows={3}
              />
              <label className="flex items-center gap-3 mb-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cancelState.restock}
                  onChange={(e) => setCancelState(s => s ? { ...s, restock: e.target.checked } : null)}
                  className="w-4 h-4 rounded accent-emerald-500"
                />
                <span className="text-sm text-zinc-300">Restock items back into inventory</span>
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setCancelState(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
                >
                  Keep Order
                </button>
                <button
                  disabled={!cancelState.reason.trim()}
                  onClick={() => {
                    if (!cancelState.reason.trim()) return
                    startTransition(() => {
                      addOptimisticOrder({ id: cancelState.orderId, status: 'cancelled' })
                    })
                    onCancelOrder(cancelState.orderId, cancelState.reason, cancelState.restock)
                    setCancelState(null)
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-colors"
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Void Order Modal */}
        {voidState && (
          <PINPromptModal
            title="Void Unpaid Order"
            description="Enter your Manager PIN to void this order."
            actionLabel="Void Order"
            isLoading={isProcessingAction}
            onCancel={() => { setVoidState(null); setActionError(null); }}
            onConfirm={async (pin) => {
              setIsProcessingAction(true)
              setActionError(null)
              try {
                const res = await onVoidOrder(voidState.orderId, pin)
                if (res.success) {
                  startTransition(() => {
                    addOptimisticOrder({ id: voidState.orderId, status: 'cancelled' }) // using cancelled optimistic state to remove it
                  })
                  setVoidState(null)
                } else {
                  setActionError(res.error || 'Failed to void order')
                }
              } finally {
                setIsProcessingAction(false)
              }
            }}
          />
        )}
        
        {/* Refund Order Modal */}
        {refundState && (
          <PINPromptModal
            title="Refund Paid Order"
            description="Enter your Manager PIN to refund this payment. This will initiate a gateway refund if paid online."
            actionLabel="Refund Payment"
            isLoading={isProcessingAction}
            onCancel={() => { setRefundState(null); setActionError(null); }}
            onConfirm={async (pin) => {
              setIsProcessingAction(true)
              setActionError(null)
              try {
                const res = await onRefundOrder(refundState.orderId, pin)
                if (res.success) {
                  startTransition(() => {
                    addOptimisticOrder({ id: refundState.orderId, status: 'cancelled' }) // using cancelled optimistic state
                  })
                  setRefundState(null)
                } else {
                  setActionError(res.error || 'Failed to refund order')
                }
              } finally {
                setIsProcessingAction(false)
              }
            }}
          />
        )}
        
        {/* Global Action Error Toast */}
        {actionError && (
          <div className="fixed bottom-4 right-4 z-50 bg-red-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <span className="font-bold">Error:</span>
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} className="ml-2 font-bold text-red-200 hover:text-white">✕</button>
          </div>
        )}
        
        {/* Milestones Manager Modal */}
        {milestonesOrder && (
          <MilestonesManager 
            order={milestonesOrder}
            isOpen={true}
            onClose={() => setMilestonesOrder(null)}
          />
        )}
        
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
              <div key={order.id} className="relative overflow-hidden rounded-lg sm:overflow-visible">
                {/* Mobile Swipe Container (CSS Scroll Snap) */}
                <div className="flex w-full overflow-x-auto snap-x snap-mandatory hide-scrollbar sm:block sm:overflow-visible">
                  
                  {/* Main Card Content */}
                  <div className={`w-full shrink-0 snap-center p-5 border sm:rounded-lg ${order.status === 'paid' ? 'border-blue-500/50 bg-blue-500/5' : 'border-zinc-800 bg-zinc-900/50'}`}>
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
                      {(order.wallet_balance_applied_minor || 0) > 0 && (
                        <div className="text-xs text-emerald-400 mb-1 font-medium">- {formatCurrency(order.wallet_balance_applied_minor || 0)} Wallet</div>
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
                    <div key={item.id} className="flex flex-col text-zinc-300">
                      <div className="flex justify-between">
                        <span><span className="text-zinc-500 mr-2">{item.quantity}x</span> {item.item_name}</span>
                      </div>
                      {item.metadata && typeof item.metadata === 'object' && Object.keys(item.metadata as object).length > 0 && (
                        <div className="pl-6 mt-1 flex flex-col gap-0.5">
                          {Object.entries(item.metadata as Record<string, unknown>).map(([key, value]) => (
                            <span key={key} className="text-xs text-zinc-500 bg-zinc-800/30 px-1.5 py-0.5 rounded w-fit capitalize">
                              {key.replace(/_/g, ' ')}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {order.customer_note && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg p-3 text-sm font-medium mb-4">
                    📝 Note: {order.customer_note}
                  </div>
                )}
                
                {/* Dispatch Button for Delivery Orders */}
                {order.fulfillment_type === 'delivery' && (
                  <div className="mb-4">
                    <button
                      onClick={() => handleShareDispatch(order.id)}
                      className="px-4 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 font-medium transition-colors text-sm border border-indigo-500/20 hover:border-indigo-500/40 w-fit flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                      Share Dispatch Link
                    </button>
                  </div>
                )}

                {/* Desktop Inline Actions (Hidden on Mobile) */}
                <div className={`hidden sm:flex justify-between items-center mt-4 pt-4 border-t border-zinc-800/50 ${templateType === 'restaurant' ? 'flex-col gap-4 sm:flex-row' : ''}`}>
                  <div className="flex items-center gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => setVoidState({ orderId: order.id })}
                        className="px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 font-medium transition-colors text-sm"
                      >
                        Void (Unpaid)
                      </button>
                    )}
                    {(order.status === 'paid' || order.status === 'preparing') && (
                      <button
                        onClick={() => setRefundState({ orderId: order.id })}
                        className="px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 font-medium transition-colors text-sm"
                      >
                        Refund (Paid)
                      </button>
                    )}
                  </div>
                  <div className={`flex items-center gap-3 ${templateType === 'restaurant' ? 'w-full sm:w-auto flex-col sm:flex-row' : ''}`}>
                    {(templateType === 'services' || order.fulfillment_type === 'delivery' || order.fulfillment_type === 'pickup') && order.status !== 'cancelled' && (
                      <button
                        onClick={() => setMilestonesOrder(order)}
                        className="px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-medium transition-colors text-sm border border-blue-500/20 hover:border-blue-500/40 flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4" />
                        Manage Progress
                      </button>
                    )}
                    {(!order.assigned_staff_id && (order.status === 'paid' || (order.status === 'pending' && billingMode === 'table_service'))) && (
                      <button 
                        onClick={() => {
                          startTransition(() => {
                            addOptimisticOrder({ id: order.id, assigned_staff_id: currentUserId, status: 'preparing' })
                          })
                          onClaimOrder(order.id)
                        }}
                        className="px-6 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors animate-pulse"
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
                        
                        {/* Send Payment Link Button */}
                        {order.customer_email && (
                          <button 
                            onClick={() => onSendPaymentLink(order.id)}
                            className="px-4 py-2 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 font-medium transition-colors text-sm border border-teal-500/20 hover:border-teal-500/40"
                            title={`Send link to ${order.customer_email}`}
                          >
                            Send Payment Link
                          </button>
                        )}
                        
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
                      <div className="flex items-center gap-3">
                        {order.customer_email && (
                          <button 
                            onClick={() => onSendPaymentLink(order.id)}
                            className="px-6 py-2 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 font-medium transition-colors border border-teal-500/20 hover:border-teal-500/40"
                          >
                            Send Payment Link
                          </button>
                        )}
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
                      </div>
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

              {/* Mobile Swipe Actions Panel */}
              <div className="w-[85%] shrink-0 snap-center bg-zinc-900/80 border-y border-r border-zinc-800 flex flex-col items-center justify-center p-6 sm:hidden space-y-4">
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2">Swipe Actions</span>
                
                {/* Cancel Action */}
                {order.status === 'pending' ? (
                  <button
                    onClick={() => setVoidState({ orderId: order.id })}
                    className="w-full px-4 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 font-bold active:bg-red-500/20"
                  >
                    Void Order
                  </button>
                ) : (
                  <button
                    onClick={() => setRefundState({ orderId: order.id })}
                    className="w-full px-4 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 font-bold active:bg-red-500/20"
                  >
                    Refund Order
                  </button>
                )}

                {(templateType === 'services' || order.fulfillment_type === 'delivery' || order.fulfillment_type === 'pickup') && (
                  <button
                    onClick={() => setMilestonesOrder(order)}
                    className="w-full px-4 py-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold active:bg-blue-500/20"
                  >
                    Manage Progress
                  </button>
                )}

                {/* Claim / Complete Actions */}
                {(!order.assigned_staff_id && (order.status === 'paid' || (order.status === 'pending' && billingMode === 'table_service'))) && (
                  <button 
                    onClick={() => {
                      startTransition(() => {
                        addOptimisticOrder({ id: order.id, assigned_staff_id: currentUserId, status: 'preparing' })
                      })
                      onClaimOrder(order.id)
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-teal-600 text-white font-bold active:bg-teal-700"
                  >
                    {order.status === 'pending' ? 'Accept Order' : 'Claim Order'}
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
                    className="w-full px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold active:bg-emerald-700"
                  >
                    {templateType === 'restaurant' ? 'Bump Order' : 'Complete Order'}
                  </button>
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
