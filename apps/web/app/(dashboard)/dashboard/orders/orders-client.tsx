'use client'



import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Database } from '@/lib/supabase/types'
import { ServiceRequestsPanel } from './components/service-requests-panel'
import { ActiveOrdersGrid } from './components/active-orders-grid'
import { StockManagementView } from './components/stock-management-view'
import { mapSupabaseOrderToUI } from '@/lib/utils/transformers'
import { UIOrder } from '@/lib/types/frontend'

type ServiceRequestRow = Database['public']['Tables']['service_requests']['Row']
type MenuItemRow = Database['public']['Tables']['menu_items']['Row']
type OrderPayload = { eventType: string, new: Database['public']['Tables']['orders']['Row'] }
type ServiceRequestPayload = { eventType: string, new: ServiceRequestRow }
type MenuItemPayload = { eventType: string, new: MenuItemRow }

interface OrdersClientProps {
  organizationId: string
  locationId: string
  initialOrders: UIOrder[]
  initialServiceRequests: ServiceRequestRow[]
  initialMenuItems?: MenuItemRow[]
  currentUserId: string
  billingMode?: string
}

export function OrdersClient({ organizationId, locationId, initialOrders, initialServiceRequests, initialMenuItems = [], currentUserId, billingMode = 'standard_checkout' }: OrdersClientProps) {
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
        filter: `location_id=eq.${locationId}`
      }, (payload: unknown) => {
        const orderPayload = payload as OrderPayload
        // Fetch full order with items if INSERT
        if (orderPayload.eventType === 'INSERT') {
          supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('id', orderPayload.new.id)
            .single()
            .then(({ data }: { data: unknown }) => {
              const fullData = data ? mapSupabaseOrderToUI(data as Parameters<typeof mapSupabaseOrderToUI>[0]) : null
              if (fullData) {
                setOrders((prev) => [fullData, ...prev])
                if (fullData.status === 'paid' || fullData.status === 'pending') {
                  toast.success(`New Order Received! Table: ${fullData.table_identifier}`)
                }
              }
            })
        } else if (orderPayload.eventType === 'UPDATE') {
          setOrders((prev) => {
            const oldOrder = prev.find(o => o.id === orderPayload.new.id)
            if (oldOrder && oldOrder.status !== 'paid' && orderPayload.new.status === 'paid') {
              toast.success(`Payment Confirmed! Table: ${orderPayload.new.table_identifier}`)
            }
            return prev.map(o => o.id === orderPayload.new.id ? { ...o, ...orderPayload.new } : o)
          })
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
        filter: `location_id=eq.${locationId}`
      }, (payload: unknown) => {
        const srPayload = payload as ServiceRequestPayload
        if (srPayload.eventType === 'INSERT') {
          setServiceRequests((prev) => [...prev, srPayload.new])
        } else if (srPayload.eventType === 'UPDATE') {
          setServiceRequests((prev) => prev.map(r => r.id === srPayload.new.id ? srPayload.new : r))
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
      }, (payload: unknown) => {
        const itemPayload = payload as MenuItemPayload
        setMenuItems((prev) => prev.map(item => item.id === itemPayload.new.id ? { ...item, ...itemPayload.new } : item))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(ordersSubscription)
      supabase.removeChannel(serviceRequestsSubscription)
      supabase.removeChannel(menuSubscription)
    }
  }, [organizationId, locationId, supabase])  

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
      toast.error('Failed to update stock status: ' + (error as Error).message)
    } else {
      toast.success(`Item marked as ${newStatus === 'available' ? 'Available' : 'Sold Out'}`)
    }
  }

  const handleClaimOrder = async (orderId: string) => {
    const timeInput = window.prompt('Estimated time to prepare (in minutes)?', '15')
    if (!timeInput) return

    const minutes = parseInt(timeInput, 10)
    if (isNaN(minutes)) {
      toast.error('Please enter a valid number of minutes.')
      return
    }

    const { data, error } = await supabase.rpc('claim_order', {
      p_order_id: orderId,
      p_prep_time_minutes: minutes
    })

    if (error) {
      toast.error('Failed to claim order: ' + (error as Error).message)
      return
    }

    if (data === false) {
      toast.error('Order was already claimed by another staff member, or limit reached.')
    } else {
      toast.success('Order claimed successfully!')
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
          <ServiceRequestsPanel 
            pendingRequests={pendingRequests} 
            onResolve={async (id) => { await supabase.from('service_requests').update({ status: 'resolved' }).eq('id', id) }} 
          />
          <ActiveOrdersGrid 
            activeOrders={activeOrders} 
            currentUserId={currentUserId} 
            billingMode={billingMode} 
            onClaimOrder={handleClaimOrder} 
          />
        </div>
      ) : (
        <StockManagementView 
          menuItems={menuItems} 
          onToggleStock={toggleStock} 
        />
      )}
    </div>
  )
}
