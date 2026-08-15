'use client'

import { useState, useEffect } from 'react'
import { Database } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/utils/currency'
import { createClient } from '@/lib/supabase/client'
import { Package, Truck, CheckCircle, Clock, MapPin, User as UserIcon, Phone, Settings2, Sliders, X } from 'lucide-react'
import { toast } from 'sonner'
import { saveDeliveryRules } from './actions'

type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items: Database['public']['Tables']['order_items']['Row'][]
}

interface DeliveryRulesState {
  delivery_enabled: boolean
  delivery_fee_minor: number
  delivery_minimum_order_minor: number
  delivery_note: string
}

interface DeliveryClientProps {
  initialOrders: Order[]
  organizationId: string
  locationId: string
  currencyCode: string
  pageId?: string
  initialDeliverySettings?: DeliveryRulesState
}

type ColumnStatus = 'preparing' | 'out_for_delivery' | 'completed'

const COLUMNS: { id: ColumnStatus; label: string; icon: React.ElementType; color: string; border: string }[] = [
  { id: 'preparing', label: 'To Do', icon: Package, color: 'bg-amber-500/10 text-amber-500', border: 'border-amber-500/20' },
  { id: 'out_for_delivery', label: 'In Progress', icon: Truck, color: 'bg-indigo-500/10 text-indigo-400', border: 'border-indigo-500/20' },
  { id: 'completed', label: 'Completed', icon: CheckCircle, color: 'bg-emerald-500/10 text-emerald-500', border: 'border-emerald-500/20' }
]

export function DeliveryClient({
  initialOrders,
  organizationId,
  locationId,
  currencyCode,
  pageId,
  initialDeliverySettings
}: DeliveryClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All')
  const [isRulesOpen, setIsRulesOpen] = useState(false)
  const [isSavingRules, setIsSavingRules] = useState(false)
  const [rules, setRules] = useState<DeliveryRulesState>(initialDeliverySettings || {
    delivery_enabled: false,
    delivery_fee_minor: 0,
    delivery_minimum_order_minor: 0,
    delivery_note: ''
  })
  const supabase = createClient()
  
  const availableDepartments = Array.from(new Set(
    orders.flatMap(o => o.order_items.map(i => ((i as Record<string, unknown>).metadata as Record<string, unknown>)?.department)).filter(Boolean)
  )).sort() as string[]

  useEffect(() => {
    // Realtime updates for orders
    const channel = supabase.channel('delivery-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `organization_id=eq.${organizationId}`
      }, async (payload) => {
        if (payload.new && (payload.new as Record<string, unknown>).location_id === locationId) {
           // Refetch this order to get items
           const { data } = await supabase.from('orders').select('*, order_items(*)').eq('id', (payload.new as Record<string, unknown>).id as string).single()
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
  }, [organizationId, locationId, supabase])

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

  async function handleSaveRules(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSavingRules(true)
    const formData = new FormData()
    formData.append('locationId', locationId)
    if (pageId) formData.append('pageId', pageId)
    if (rules.delivery_enabled) formData.append('delivery_enabled', 'on')
    formData.append('delivery_fee_minor', rules.delivery_fee_minor.toString())
    formData.append('delivery_minimum_order_minor', rules.delivery_minimum_order_minor.toString())
    formData.append('delivery_note', rules.delivery_note || '')

    try {
      const res = await saveDeliveryRules(formData)
      if (res?.serverError || res?.validationErrors) {
        toast.error(res?.serverError || 'Validation error saving delivery rules')
      } else {
        toast.success('Delivery rules & dispatch rates updated!')
        setIsRulesOpen(false)
      }
    } catch {
      toast.error('Failed to update delivery rules')
    } finally {
      setIsSavingRules(false)
    }
  }

  return (
    <div className="flex flex-col h-full gap-4 relative">
      {/* Top Bar with Filters & Quick Delivery Settings */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-3">
          {availableDepartments.length > 0 && (
            <>
              <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Workstation:</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedDepartment('All')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    selectedDepartment === 'All' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  All
                </button>
                {availableDepartments.map(dept => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setSelectedDepartment(dept)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      selectedDepartment === dept 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsRulesOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-zinc-700 transition-all hover:border-zinc-500 shadow-sm ml-auto"
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          Delivery Rules & Dispatch Rates
          {rules.delivery_enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
        {COLUMNS.map(col => {
          const columnOrders = orders.filter(o => {
            // Filter by department routing first
            if (selectedDepartment !== 'All') {
              const hasDepartmentItems = o.order_items.some(i => ((i as Record<string, unknown>).metadata as Record<string, unknown>)?.department === selectedDepartment)
              if (!hasDepartmentItems) return false
            }

            if (col.id === 'preparing') return o.status === 'preparing' || o.status === 'paid'
            return o.status === col.id
          })

        return (
          <div 
            key={col.id} 
            className="shrink-0 w-80 md:w-96 flex flex-col bg-zinc-900/50 rounded-2xl border border-zinc-800/80 snap-center overflow-hidden"
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
                      {order.order_items
                        .filter(item => selectedDepartment === 'All' || ((item as Record<string, unknown>).metadata as Record<string, unknown>)?.department === selectedDepartment)
                        .map(item => (
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

    {/* ── Slide-Over Delivery Rules & Rates Drawer ── */}
    {isRulesOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full max-w-md h-full bg-zinc-900 border-l border-zinc-800 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Delivery Rules & Rates</h3>
                  <p className="text-xs text-zinc-400">Configure fulfillment terms for this venue.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRulesOpen(false)}
                className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="deliveryRulesForm" onSubmit={handleSaveRules} className="space-y-5">
              {/* Toggle Delivery */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-950/60">
                <div>
                  <label htmlFor="deliveryEnabledToggle" className="text-sm font-semibold text-white block">
                    Enable Customer Delivery
                  </label>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Allow guests to enter delivery addresses at checkout.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="deliveryEnabledToggle"
                  checked={rules.delivery_enabled}
                  onChange={(e) => setRules(r => ({ ...r, delivery_enabled: e.target.checked }))}
                  className="h-5 w-5 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer shrink-0"
                />
              </div>

              {/* Delivery Fee */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Flat Delivery Fee ({currencyCode})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={rules.delivery_fee_minor / 100}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0
                    setRules(r => ({ ...r, delivery_fee_minor: Math.round(val * 100) }))
                  }}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. 5.00"
                />
                <p className="text-xs text-zinc-500 mt-1.5">
                  Added automatically to the checkout subtotal when Delivery is selected.
                </p>
              </div>

              {/* Minimum Order */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Minimum Order Value ({currencyCode})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={rules.delivery_minimum_order_minor / 100}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0
                    setRules(r => ({ ...r, delivery_minimum_order_minor: Math.round(val * 100) }))
                  }}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. 20.00"
                />
                <p className="text-xs text-zinc-500 mt-1.5">
                  Guests cannot place a delivery order below this cart value.
                </p>
              </div>

              {/* Delivery Note */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Dispatch Delivery Notes & Instructions
                </label>
                <textarea
                  rows={3}
                  value={rules.delivery_note}
                  onChange={(e) => setRules(r => ({ ...r, delivery_note: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Estimated delivery 30-45 mins. Drivers dispatched from Main Island Hub."
                  maxLength={500}
                />
                <p className="text-xs text-zinc-500 mt-1.5">
                  Shown directly to the customer in the checkout delivery selection box.
                </p>
              </div>
            </form>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-800 mt-6">
            <button
              type="button"
              onClick={() => setIsRulesOpen(false)}
              className="px-4 py-2.5 text-zinc-400 hover:text-white font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="deliveryRulesForm"
              disabled={isSavingRules}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-1.5"
            >
              {isSavingRules ? 'Saving Changes...' : 'Save Delivery Rules'}
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  )
}
