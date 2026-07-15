'use client'



import { useState, useEffect, useOptimistic, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Database } from '@/lib/supabase/types'
import { ServiceRequestsPanel } from './components/service-requests-panel'
import { ActiveOrdersGrid } from './components/active-orders-grid'
import { StockManagementView } from './components/stock-management-view'
import { OrderHistoryView } from './components/order-history-view'
import { mapSupabaseOrderToUI } from '@/lib/utils/transformers'
import { UIOrder } from '@/lib/types/frontend'
import { useOfflineSync } from '@/hooks/use-offline-sync'
import { QueuedAction } from '@/lib/stores/offline-queue-store'
import { completeOrderAction, markOrderPaidOffline, cancelOrderAction, sendPaymentLinkAction, voidOrderAction, refundOrderAction } from './actions'
import { OfflineIndicator } from './components/offline-indicator'
import { HardwareSettingsView } from './components/hardware-settings-view'
import { usePrinterStore } from '@/lib/stores/printer-store'
import { printOrder } from '@/lib/utils/printer'

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
  templateType?: string
  realtimeKdsEnabled?: boolean
}

export function OrdersClient({ organizationId, locationId, initialOrders, initialServiceRequests, initialMenuItems = [], currentUserId, billingMode = 'standard_checkout', templateType = 'catalog', realtimeKdsEnabled = true }: OrdersClientProps) {
  const supabase = createClient()
  const [orders, setOrders] = useState(initialOrders)
  const [serviceRequests, setServiceRequests] = useState(initialServiceRequests)
  const [menuItems, setMenuItems] = useState(initialMenuItems)
  const [activeTab, setActiveTab] = useState<'orders' | 'history' | 'stock' | 'hardware'>('orders')
  const [socketStatus, setSocketStatus] = useState<string>('CONNECTING')
  const { mode, ipAddress, autoPrintReceipts } = usePrinterStore()
  const t = useTranslations('Dashboard')

  const onSyncAction = async (action: QueuedAction) => {
    switch (action.type) {
      case 'toggleStock':
        const { error } = await supabase.from('menu_items').update({ availability_status: action.payload.newStatus }).eq('id', action.payload.itemId)
        return !error
      case 'claimOrder':
        const { error: claimError } = await supabase.rpc('claim_order', { p_order_id: action.payload.orderId, p_prep_time_minutes: action.payload.minutes })
        return !claimError
      case 'resolveServiceRequest':
        const { error: srError } = await supabase.from('service_requests').update({ status: 'resolved' }).eq('id', action.payload.id)
        return !srError
      case 'markOrderPaid':
        const resPaid = await markOrderPaidOffline({ orderId: action.payload.orderId })
        return !resPaid?.serverError && !resPaid?.validationErrors
      case 'completeOrder':
        const resComp = await completeOrderAction({ orderId: action.payload.orderId })
        return !resComp?.serverError && !resComp?.validationErrors
      default:
        return true
    }
  }

  const { executeOrQueue } = useOfflineSync(onSyncAction)

  const handleClaimOrderFast = useCallback(async (orderId: string) => {
    // Fast path for hotkey
    await executeOrQueue(
      { type: 'claimOrder', payload: { orderId, minutes: 15 } },
      () => {},
      async () => {
        const { data, error } = await supabase.rpc('claim_order', {
          p_order_id: orderId,
          p_prep_time_minutes: 15
        })
        if (error) return false
        if (data !== false) toast.success('Order claimed successfully!')
        return true
      }
    )
  }, [executeOrQueue, supabase])

  const handleCompleteOrder = useCallback(async (orderId: string) => {
    await executeOrQueue(
      { type: 'completeOrder', payload: { orderId } },
      () => {}, // Handled optimistically inside ActiveOrdersGrid
      async () => {
        const res = await completeOrderAction({ orderId })
        if (res?.serverError || res?.validationErrors) {
          toast.error('Failed to complete order')
          return false
        }
        toast.success('Order completed! Feedback email sent.')
        
        // Auto-print receipt if hardware is configured
        if (autoPrintReceipts) {
          const order = orders.find(o => o.id === orderId)
          if (order) {
            printOrder(order, { mode, ipAddress, businessName: 'OurMenu OS' })
          }
        }
        return true
      }
    )
  }, [executeOrQueue, autoPrintReceipts, orders, mode, ipAddress])

  useEffect(() => {
    if (!realtimeKdsEnabled) {
      setSocketStatus('POLLING')
      const interval = setInterval(() => {
        // Fallback polling for orders and service requests to save Realtime connection limits
        const fetchUpdates = async () => {
          const { data: ordersData } = await supabase.from('orders').select('*, order_items(*), order_milestones(*), order_payments(*)').eq('location_id', locationId)
          if (ordersData) {
            setOrders(ordersData.map((d) => mapSupabaseOrderToUI(d as any)))
          }
          const { data: srData } = await supabase.from('service_requests').select('*').eq('location_id', locationId)
          if (srData) {
            setServiceRequests(srData as ServiceRequestRow[])
          }
        }
        fetchUpdates()
      }, 10000)
      return () => clearInterval(interval)
    }

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
            .select('*, order_items(*), order_milestones(*), order_payments(*)')
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
            return prev.map(o => o.id === orderPayload.new.id ? { ...o, ...(orderPayload.new as unknown as Partial<UIOrder>) } : o)
          })
        }
      })
      .subscribe((status) => {
        setSocketStatus(status)
      })

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
        setMenuItems((prev: MenuItemRow[]) => prev.map((item: MenuItemRow) => item.id === itemPayload.new.id ? { ...item, ...itemPayload.new } : item))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(ordersSubscription)
      supabase.removeChannel(serviceRequestsSubscription)
      supabase.removeChannel(menuSubscription)
    }
  }, [organizationId, locationId, supabase])  

  // Global KDS Hotkeys (Only for restaurant template)
  useEffect(() => {
    if (templateType !== 'restaurant') return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return
      
      switch (e.key) {
        case 'm':
        case 'M':
          e.preventDefault()
          setActiveTab('stock')
          break
        case 'o':
        case 'O':
          e.preventDefault()
          setActiveTab('orders')
          break
        case 'p':
        case 'P':
          e.preventDefault()
          // Automatically print the oldest active order
          const printOrderObj = orders.find(o => o.status !== 'completed' && o.status !== 'cancelled')
          if (printOrderObj) {
            printOrder(printOrderObj, { mode, ipAddress, businessName: 'OurMenu OS' })
          }
          break
        case ' ': // Spacebar
          e.preventDefault()
          // Fast Claim / Complete oldest pending/preparing order
          const claimable = orders.find(o => o.status === 'pending' || (o.status === 'paid' && !o.assigned_staff_id) || (o.status === 'preparing' && o.assigned_staff_id === currentUserId))
          if (claimable) {
            if (claimable.status === 'preparing') {
               handleCompleteOrder(claimable.id)
            } else {
               // Simulate button click to prompt for time (or default to 15m for hotkey)
               handleClaimOrderFast(claimable.id)
            }
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [templateType, orders, currentUserId, mode, ipAddress, handleClaimOrderFast, handleCompleteOrder])

  const urgencyWeight: Record<string, number> = { 'critical': 3, 'standard': 2, 'low': 1 }
  const basePendingRequests = serviceRequests
    .filter(r => r.status === 'pending')
    .sort((a, b) => {
      const weightA = urgencyWeight[a.urgency_tier || 'standard'] || 0
      const weightB = urgencyWeight[b.urgency_tier || 'standard'] || 0
      return weightB - weightA // Critical first
    })

  const [optimisticRequests, addOptimisticResolve] = useOptimistic(
    basePendingRequests,
    (state, resolvedId: string) => state.filter(r => r.id !== resolvedId)
  )

  const activeOrders = orders.filter(o => o.status !== 'completed')
  const completedOrders = orders.filter(o => o.status === 'completed')

  const toggleStock = async (itemId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'available' ? 'sold_out' : 'available'
    const previousItems = [...menuItems]

    await executeOrQueue(
      { type: 'toggleStock', payload: { itemId, newStatus } },
      () => setMenuItems((prev: MenuItemRow[]) => prev.map((i: MenuItemRow) => i.id === itemId ? { ...i, availability_status: newStatus } : i)),
      async () => {
        const { error } = await supabase.from('menu_items').update({ availability_status: newStatus }).eq('id', itemId)
        if (error) {
          setMenuItems(previousItems)
          toast.error('Failed to update stock status: ' + (error as Error).message)
          return false
        }
        toast.success(`Item marked as ${newStatus === 'available' ? 'Available' : 'Sold Out'}`)
        return true
      }
    )
  }

  const handleClaimOrder = async (orderId: string) => {
    const timeInput = window.prompt('Estimated time to prepare (in minutes)?', '15')
    if (!timeInput) return

    const minutes = parseInt(timeInput, 10)
    if (isNaN(minutes)) {
      toast.error('Please enter a valid number of minutes.')
      return
    }

    await executeOrQueue(
      { type: 'claimOrder', payload: { orderId, minutes } },
      () => {}, // Handled optimistically inside ActiveOrdersGrid
      async () => {
        const { data, error } = await supabase.rpc('claim_order', {
          p_order_id: orderId,
          p_prep_time_minutes: minutes
        })
        if (error) {
          toast.error('Failed to claim order: ' + (error as Error).message)
          return false
        }
        if (data === false) {
          toast.error('Order was already claimed by another staff member, or limit reached.')
        } else {
          toast.success('Order claimed successfully!')
        }
        return true
      }
    )
  }

  const handleMarkPaidOffline = async (orderId: string) => {
    await executeOrQueue(
      { type: 'markOrderPaid', payload: { orderId } },
      () => {}, // Handled optimistically inside ActiveOrdersGrid
      async () => {
        const res = await markOrderPaidOffline({ orderId })
        if (res?.serverError || res?.validationErrors) {
          toast.error('Failed to confirm payment')
          return false
        }
        toast.success('Payment confirmed!')
        return true
      }
    )
  }

  const handleSendPaymentLink = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    if (!order?.customer_email) {
      toast.error('Customer email is required to send a payment link')
      return
    }
    
    toast.loading('Generating payment link...', { id: `link-${orderId}` })
    
    await executeOrQueue(
      { type: 'sendPaymentLink', payload: { orderId } },
      () => {},
      async () => {
        try {
          const res = await sendPaymentLinkAction({ orderId })
          if (res?.serverError || res?.validationErrors) {
            toast.error(res.serverError || 'Failed to send payment link', { id: `link-${orderId}` })
            return false
          }
          toast.success('Payment link sent to customer!', { id: `link-${orderId}` })
          return true
        } catch (e: unknown) {
          toast.error((e as Error).message || 'Error sending link', { id: `link-${orderId}` })
          return false
        }
      }
    )
  }

  const handleCancelOrder = async (orderId: string, reason: string, restock: boolean) => {
    await executeOrQueue(
      { type: 'cancelOrder', payload: { orderId, reason, restock } },
      () => {}, 
      async () => {
        const res = await cancelOrderAction({ orderId, reason, restock })
        if (res?.serverError || res?.validationErrors) {
          toast.error('Failed to cancel order')
          return false
        }
        toast.success(`Order cancelled. ${restock ? 'Inventory restocked.' : ''}`)
        return true
      }
    )
  }

  const handleVoidOrder = async (orderId: string, pin: string) => {
    try {
      const res = await voidOrderAction({ orderId, pin, restock: true })
      if (res?.serverError || res?.validationErrors) {
        return { success: false, error: res.serverError || 'Failed to void order' }
      }
      toast.success('Order voided successfully.')
      return { success: true }
    } catch (e: unknown) {
      return { success: false, error: (e as Error).message || 'Error voiding order' }
    }
  }

  const handleRefundOrder = async (orderId: string, pin: string) => {
    toast.loading('Processing refund...', { id: `refund-${orderId}` })
    try {
      const res = await refundOrderAction({ orderId, pin })
      if (res?.serverError || res?.validationErrors) {
        toast.error(res.serverError || 'Failed to refund order', { id: `refund-${orderId}` })
        return { success: false, error: res.serverError || 'Failed to refund order' }
      }
      toast.success('Order refunded successfully.', { id: `refund-${orderId}` })
      return { success: true }
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Error processing refund', { id: `refund-${orderId}` })
      return { success: false, error: (e as Error).message || 'Error processing refund' }
    }
  }

  return (
    <div className="flex-1 flex flex-col mt-8">
      <OfflineIndicator socketStatus={socketStatus} />
      <div className="flex space-x-2 mb-6">
        <button 
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-md' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-700/50'}`}
        >
          Active Orders
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-md' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-700/50'}`}
        >
          History
        </button>
        <button 
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'stock' ? 'bg-blue-600 text-white shadow-md' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-700/50'}`}
        >
          <span className={`w-2 h-2 rounded-full ${menuItems.some((i: MenuItemRow) => i.availability_status === 'sold_out') ? 'bg-red-500' : 'bg-green-500'}`}></span>
          Live Stock
        </button>
        <button 
          onClick={() => setActiveTab('hardware')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'hardware' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
        >
          {t('hardwareSettings')}
        </button>
      </div>

      {activeTab === 'orders' ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          <ServiceRequestsPanel 
            pendingRequests={optimisticRequests} 
            onResolve={async (id) => { 
              await executeOrQueue(
                { type: 'resolveServiceRequest', payload: { id } },
                () => addOptimisticResolve(id),
                async () => {
                  const { error } = await supabase.from('service_requests').update({ status: 'resolved' }).eq('id', id)
                  return !error
                }
              )
            }} 
          />
          <ActiveOrdersGrid 
            activeOrders={activeOrders} 
            currentUserId={currentUserId} 
            billingMode={billingMode} 
            templateType={templateType}
            onClaimOrder={handleClaimOrder} 
            onMarkPaidOffline={handleMarkPaidOffline}
            onCompleteOrder={handleCompleteOrder}
            onCancelOrder={handleCancelOrder}
            onSendPaymentLink={handleSendPaymentLink}
            onVoidOrder={handleVoidOrder}
            onRefundOrder={handleRefundOrder}
          />
        </div>
      ) : activeTab === 'history' ? (
        <OrderHistoryView 
          organizationId={organizationId} 
          locationId={locationId} 
          initialOrders={completedOrders} 
        />
      ) : activeTab === 'hardware' ? (
        <HardwareSettingsView />
      ) : (
        <StockManagementView 
          menuItems={menuItems} 
          onToggleStock={toggleStock} 
        />
      )}
    </div>
  )
}
