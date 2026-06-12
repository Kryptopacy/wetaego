'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface OrdersClientProps {
  organizationId: string
  initialOrders: any[]
  initialServiceRequests: any[]
  initialMenuItems?: any[]
}

export function OrdersClient({ organizationId, initialOrders, initialServiceRequests, initialMenuItems = [] }: OrdersClientProps) {
  const supabase = createClient()
  const [orders, setOrders] = useState(initialOrders)
  const [serviceRequests, setServiceRequests] = useState(initialServiceRequests)
  const [menuItems, setMenuItems] = useState(initialMenuItems)
  const [activeTab, setActiveTab] = useState<'orders' | 'stock'>('orders')

  useEffect(() => {
    // Subscribe to Orders
    const ordersSubscription = supabase
      .channel('orders-channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `organization_id=eq.${organizationId}`
      }, (payload: any) => {
        // Fetch full order with items if INSERT
        if (payload.eventType === 'INSERT') {
          supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', payload.new.id)
            .single()
            .then(({ data }: { data: any }) => {
              if (data) setOrders((prev) => [data, ...prev])
            })
        } else if (payload.eventType === 'UPDATE') {
          setOrders((prev) => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o))
        }
      })
      .subscribe()

    // Subscribe to Service Requests
    const serviceRequestsSubscription = supabase
      .channel('service-requests-channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'service_requests',
        filter: `organization_id=eq.${organizationId}`
      }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          setServiceRequests((prev) => [...prev, payload.new])
        } else if (payload.eventType === 'UPDATE') {
          setServiceRequests((prev) => prev.map(r => r.id === payload.new.id ? payload.new : r))
        }
      })
      .subscribe()

      .subscribe()

    // Subscribe to Menu Items
    const menuSubscription = supabase
      .channel('menu-channel')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'menu_items',
        filter: `organization_id=eq.${organizationId}`
      }, (payload: any) => {
        setMenuItems((prev) => prev.map(item => item.id === payload.new.id ? { ...item, ...payload.new } : item))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(ordersSubscription)
      supabase.removeChannel(serviceRequestsSubscription)
      supabase.removeChannel(menuSubscription)
    }
  }, [organizationId, supabase])

  const urgencyWeight: Record<string, number> = { 'critical': 3, 'standard': 2, 'low': 1 }
  const pendingRequests = serviceRequests
    .filter(r => r.status === 'pending')
    .sort((a, b) => {
      const weightA = urgencyWeight[a.urgency_tier || 'standard'] || 0
      const weightB = urgencyWeight[b.urgency_tier || 'standard'] || 0
      return weightB - weightA // Critical first
    })
  const activeOrders = orders.filter(o => o.status !== 'completed')

  const toggleStock = async (itemId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'available' ? 'sold_out' : 'available'
    
    // Store previous state for rollback
    const previousItems = [...menuItems]
    
    // Optimistic update
    setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, availability_status: newStatus } : i))
    
    const { error } = await supabase.from('menu_items').update({ availability_status: newStatus }).eq('id', itemId)
    
    if (error) {
      // Rollback on failure
      setMenuItems(previousItems)
      toast.error('Failed to update stock status: ' + error.message)
    } else {
      toast.success(`Item marked as ${newStatus === 'available' ? 'Available' : 'Sold Out'}`)
    }
  }

  return (
    <div className="flex-1 flex flex-col mt-8">
      <div className="flex space-x-2 mb-6">
        <button 
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-md' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-700/50'}`}
        >
          Orders & Requests
        </button>
        <button 
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'stock' ? 'bg-blue-600 text-white shadow-md' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-700/50'}`}
        >
          <span className={`w-2 h-2 rounded-full ${menuItems.some(i => i.availability_status === 'sold_out') ? 'bg-red-500' : 'bg-green-500'}`}></span>
          Live Stock
        </button>
      </div>

      {activeTab === 'orders' ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          
          {/* Service Requests Column */}
      <div className="col-span-1 border border-zinc-800 rounded-xl bg-zinc-900/30 flex flex-col overflow-hidden max-h-[400px] lg:max-h-full">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900">
          <h2 className="font-bold text-white flex justify-between items-center">
            Table Requests
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs">{pendingRequests.length}</span>
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {pendingRequests.length === 0 ? (
            <p className="text-center text-zinc-500 py-10">No pending requests.</p>
          ) : (
            pendingRequests.map(req => {
              const isCritical = req.urgency_tier === 'critical'
              const isLow = req.urgency_tier === 'low'
              
              const borderClass = isCritical ? 'border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse' : isLow ? 'border-blue-500/30' : 'border-yellow-500/30'
              const bgClass = isCritical ? 'bg-red-500/10' : isLow ? 'bg-blue-500/10' : 'bg-yellow-500/10'
              const accentClass = isCritical ? 'bg-red-500' : isLow ? 'bg-blue-500' : 'bg-yellow-500'
              const textClass = isCritical ? 'text-red-400' : isLow ? 'text-blue-400' : 'text-yellow-400'
              const btnClass = isCritical ? 'bg-red-500/20 hover:bg-red-500/30' : isLow ? 'bg-blue-500/20 hover:bg-blue-500/30' : 'bg-yellow-500/20 hover:bg-yellow-500/30'
              const textMutedClass = isCritical ? 'text-red-500/70' : isLow ? 'text-blue-500/70' : 'text-yellow-500/70'
              
              return (
              <div key={req.id} className={`p-4 rounded-lg border ${bgClass} relative overflow-hidden ${borderClass}`}>
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentClass}`}></div>
                <div className="flex justify-between items-start mb-2">
                  <span className={`font-bold ${textClass}`}>{req.table_identifier}</span>
                  <span className={`text-xs ${textMutedClass} uppercase tracking-widest font-bold`}>{req.urgency_tier || 'STANDARD'}</span>
                </div>
                <p className="text-white font-medium capitalize">
                  {req.request_type === 'custom' ? `"${req.custom_request_text}"` : `Needs ${req.request_type}`}
                </p>
                <button 
                  onClick={() => supabase.from('service_requests').update({ status: 'resolved' }).eq('id', req.id)}
                  className={`mt-3 w-full py-2 rounded ${btnClass} ${textClass} text-sm font-medium transition-colors`}
                >
                  Mark Resolved
                </button>
              </div>
            )})
          )}
        </div>
      </div>

      {/* Orders Column */}
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
                    <div className="font-bold text-lg text-white">₦{(order.total_amount_minor / 100).toLocaleString()}</div>
                    {order.tip_amount_minor > 0 && (
                      <div className="text-sm text-blue-400 mb-1 font-medium">+ ₦{(order.tip_amount_minor / 100).toLocaleString()} Tip</div>
                    )}
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${order.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {order.order_items?.map((item: any) => (
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
                  <button 
                    onClick={() => supabase.from('orders').update({ status: 'completed' }).eq('id', order.id)}
                    className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                  >
                    Mark as Completed
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
    ) : (
      <div className="flex-1 border border-zinc-800 rounded-xl bg-zinc-900/30 overflow-hidden min-h-[500px] flex flex-col">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
          <h2 className="font-bold text-white">Stock Management</h2>
          <span className="text-sm text-zinc-400">Updates sync instantly to guest menus</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {menuItems.length === 0 ? (
            <p className="text-center text-zinc-500 py-10">No items on your menu yet.</p>
          ) : (
            menuItems.map(item => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                <div>
                  <div className="font-medium text-white">{item.name}</div>
                  <div className="text-sm text-zinc-400">₦{(item.price_minor / 100).toLocaleString()}</div>
                </div>
                <button
                  onClick={() => toggleStock(item.id, item.availability_status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${item.availability_status === 'available' ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20' : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'}`}
                >
                  {item.availability_status === 'available' ? 'Available' : 'Sold Out'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    )}
    </div>
  )
}
