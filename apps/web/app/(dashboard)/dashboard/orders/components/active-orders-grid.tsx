import { Database } from '@/lib/supabase/types'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils/currency'
import { UIOrder } from '@/lib/types/frontend'

type FullOrder = Database['public']['Tables']['orders']['Row'] & { order_items?: Database['public']['Tables']['order_items']['Row'][] }

interface ActiveOrdersGridProps {
  activeOrders: UIOrder[]
  currentUserId: string
  billingMode: string
  onClaimOrder: (id: string) => Promise<void>
}

export function ActiveOrdersGrid({ activeOrders, currentUserId, billingMode, onClaimOrder }: ActiveOrdersGridProps) {
  return (
      <div className="col-span-1 lg:col-span-2 border border-zinc-800 rounded-xl bg-zinc-900/30 flex flex-col overflow-hidden min-h-[500px]">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900">
          <h2 className="font-bold text-white flex justify-between items-center">
            Active Orders
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs">{activeOrders.length}</span>
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <p>Waiting for new orders...</p>
              <p className="text-sm mt-2">Orders paid via Paystack will appear here instantly.</p>
            </div>
          ) : (
            activeOrders.map(order => (
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
                  <div className="text-right">
                    <div className="font-bold text-lg text-white">{formatCurrency(order.total_amount_minor )}</div>
                    {(order.tip_amount_minor || 0) > 0 && (
                      <div className="text-sm text-blue-400 mb-1 font-medium">+ {formatCurrency(order.tip_amount_minor || 0)} Tip</div>
                    )}
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${order.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      {order.status.toUpperCase()}
                    </span>
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

                <div className="flex justify-end mt-4 pt-4 border-t border-zinc-800/50">
                  {(!order.assigned_staff_id && (order.status === 'paid' || (order.status === 'pending' && billingMode === 'table_service'))) && (
                    <button 
                      onClick={() => onClaimOrder(order.id)}
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
                          const { markOrderPaidOffline } = await import('../actions')
                          toast.promise(markOrderPaidOffline(order.id), {
                            loading: 'Confirming payment...',
                            success: 'Payment confirmed!',
                            error: 'Failed to confirm payment'
                          })
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
                        const { markOrderPaidOffline } = await import('../actions')
                        toast.promise(markOrderPaidOffline(order.id), {
                          loading: 'Confirming payment...',
                          success: 'Payment confirmed!',
                          error: 'Failed to confirm payment'
                        })
                      }}
                      className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
                    >
                      Mark Paid Offline
                    </button>
                  )}
                  {order.status === 'preparing' && order.assigned_staff_id === currentUserId && (
                    <button 
                      onClick={async () => {
                        const { completeOrderAction } = await import('../actions')
                        toast.promise(completeOrderAction(order.id), {
                          loading: 'Completing order...',
                          success: 'Order completed! Feedback email sent.',
                          error: 'Failed to complete order'
                        })
                      }}
                      className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                    >
                      Mark as Completed
                    </button>
                  )}
                  {order.status === 'preparing' && order.assigned_staff_id !== currentUserId && (
                    <div className="px-6 py-2 rounded-lg bg-zinc-800 text-zinc-400 font-medium">
                      Claimed (Preparing)
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
  )
}
