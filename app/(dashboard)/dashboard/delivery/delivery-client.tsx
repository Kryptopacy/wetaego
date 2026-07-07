'use client'

import { useState, useEffect } from 'react'
import { Database } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/utils/currency'
import { createClient } from '@/lib/supabase/client'
import { Package, Truck, CheckCircle, Clock, MapPin, User as UserIcon, Phone } from 'lucide-react'
import { toast } from 'sonner'

type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items: Database['public']['Tables']['order_items']['Row'][]
}

interface DeliveryClientProps {
  initialOrders: Order[]
  organizationId: string
  locationId: string
  currencyCode: string
}

type ColumnStatus = 'preparing' | 'out_for_delivery' | 'completed'

const COLUMNS: { id: ColumnStatus; label: string; icon: React.ElementType; color: string; border: string }[] = [
  { id: 'preparing', label: 'Preparing', icon: Package, color: 'bg-amber-500/10 text-amber-500', border: 'border-amber-500/20' },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, color: 'bg-indigo-500/10 text-indigo-400', border: 'border-indigo-500/20' },
  { id: 'completed', label: 'Delivered', icon: CheckCircle, color: 'bg-emerald-500/10 text-emerald-500', border: 'border-emerald-500/20' }
]

export function DeliveryClient({ initialOrders, organizationId, locationId, currencyCode }: DeliveryClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const supabase = createClient()

  useEffect(() => {
    // Realtime updates for orders
    const channel = supabase.channel('delivery-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `organization_id=eq.${organizationId}`
      }, async (payload) => {
        if (payload.new && 'fulfillment_type' in payload.new && payload.new.fulfillment_type === 'delivery') {
           // Refetch this order to get items
           const { data } = await supabase.from('orders').select('*, order_items(*)').eq('id', payload.new.id).single()
           if (data) {
             setOrders(prev => {
               const exists = prev.find(o => o.id === data.id)
               if (exists) return prev.map(o => o.id === data.id ? data : o)
               return [data, ...prev]
             })
           }
        }
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId, supabase])

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('orderId', orderId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() // Required to allow drop
  }

  const handleDrop = async (e: React.DragEvent, newStatus: ColumnStatus) => {
    e.preventDefault()
    const orderId = e.dataTransfer.getData('orderId')
    
    const orderToMove = orders.find(o => o.id === orderId)
    // If it's already in the target column, do nothing
    // Treat 'paid' as 'preparing' for column logic
    const currentMappedStatus = (orderToMove?.status === 'paid' ? 'preparing' : orderToMove?.status) as ColumnStatus
    if (!orderToMove || currentMappedStatus === newStatus) return

    // Optimistic update
    const previousOrders = [...orders]
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))

    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
      if (error) throw error
      toast.success(`Order moved to ${COLUMNS.find(c => c.id === newStatus)?.label}`)
    } catch (err) {
      console.error(err)
      toast.error("Failed to update status")
      setOrders(previousOrders)
    }
  }

  return (
    <div className="flex-1 flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
      {COLUMNS.map(col => {
        const columnOrders = orders.filter(o => {
          if (col.id === 'preparing') return o.status === 'preparing' || o.status === 'paid'
          return o.status === col.id
        })

        return (
          <div 
            key={col.id} 
            className="flex-shrink-0 w-80 md:w-96 flex flex-col bg-zinc-900/50 rounded-2xl border border-zinc-800/80 snap-center overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Column Header */}
            <div className={`p-4 border-b border-zinc-800/80 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${col.color}`}>
                  <col.icon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white">{col.label}</h3>
              </div>
              <span className="bg-zinc-800/50 text-zinc-400 font-mono text-xs px-2 py-0.5 rounded border border-zinc-700/50">
                {columnOrders.length}
              </span>
            </div>

            {/* Column Body */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
              {columnOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 p-6 text-center border-2 border-dashed border-zinc-800/50 rounded-xl">
                  <col.icon className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm font-medium">No orders here</p>
                </div>
              ) : (
                columnOrders.map(order => (
                  <div
                    key={order.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, order.id)}
                    className="bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-700/50 rounded-xl p-4 cursor-grab active:cursor-grabbing transition-colors group relative"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-mono text-xs font-bold text-zinc-400">
                        #{order.id.slice(0, 6)}
                      </div>
                      <div className="text-xs text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2 text-sm text-zinc-200">
                        <UserIcon className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                        <span className="font-medium line-clamp-1">{order.customer_name}</span>
                      </div>
                      {order.customer_phone && (
                        <div className="flex items-start gap-2 text-sm text-zinc-400">
                          <Phone className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                          <span className="font-mono">{order.customer_phone}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2 text-sm text-zinc-300">
                        <MapPin className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{order.table_identifier || 'No Address Provided'}</span>
                      </div>
                    </div>

                    <div className="bg-zinc-900/50 rounded-lg p-2.5 space-y-1.5 mb-4">
                      {order.order_items.map(item => (
                        <div key={item.id} className="flex justify-between text-xs">
                          <span className="text-zinc-300"><span className="text-zinc-500 font-bold mr-1">{item.quantity}x</span> {item.item_name}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-700/50">
                      <span className="text-sm font-bold text-emerald-400">
                        {formatCurrency(order.total_amount_minor || 0, currencyCode)}
                      </span>
                      {order.status === 'paid' ? (
                        <span className="text-[10px] px-2 py-0.5 rounded border bg-zinc-800 text-zinc-400 border-zinc-700/50 font-bold uppercase tracking-wider">PAID</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded border bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold uppercase tracking-wider">PAY ON DELIVERY</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
