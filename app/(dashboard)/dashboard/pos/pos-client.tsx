'use client'

import { useState, useMemo, useTransition, useEffect } from 'react'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils/currency'
import { Search, ShoppingCart, Plus, Minus, X, CreditCard, Banknote, Landmark, Smartphone, CheckCircle2, MonitorSmartphone } from 'lucide-react'
import { DynamicQR } from '@/components/qr/DynamicQR'
import { submitPosOrder, unlinkResourceOrder, createRegisterAction } from './actions'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ItemImagePlaceholder } from '@/components/ui/item-placeholder'

interface PageItem {
  id: string
  page_id: string
  title: string
  price_minor: number
  availability_status: string
  images?: string[]
  item_data?: Record<string, unknown>
}

interface Register {
  id: string
  name: string
  type: string
  current_order_id: string | null
}

interface POSClientProps {
  items: PageItem[]
  pages: { id: string; title: string; [key: string]: unknown }[]
  currency: string
  locationId: string
  organizationId: string
  staffId: string
  slug: string
  registers: Register[]
}

interface CartItem extends PageItem {
  cartKey: string
  quantity: number
  selectedVariants?: Record<string, string>
  variantLabel?: string
}

export function POSClient({ items, pages, currency, locationId, organizationId, staffId, slug, registers }: POSClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activePageId, setActivePageId] = useState<string>('all')
  
  const [cart, setCart] = useState<CartItem[]>([])
  const [isPending, startTransition] = useTransition()
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'online'>('cash')
  const [amountTendered, setAmountTendered] = useState<string>('')
  
  // Terminal state & in-situ creation
  const [localRegisters, setLocalRegisters] = useState<Register[]>(registers)
  const [activeRegisterId, setActiveRegisterId] = useState<string>('')
  const [pushedOrderId, setPushedOrderId] = useState<string | null>(null)
  const [showAddTerminalModal, setShowAddTerminalModal] = useState(false)
  const [newTerminalName, setNewTerminalName] = useState('')
  const [newTerminalType, setNewTerminalType] = useState('register')
  const [isCreatingTerminal, setIsCreatingTerminal] = useState(false)
  
  const supabase = createClient()

  // Initialize register from local storage
  useEffect(() => {
    const saved = localStorage.getItem('pos_active_register')
    if (saved && localRegisters.some(r => r.id === saved)) {
      setActiveRegisterId(saved)
    } else if (localRegisters.length > 0) {
      setActiveRegisterId(localRegisters[0].id)
    }
  }, [localRegisters])

  const handleRegisterChange = (id: string) => {
    setActiveRegisterId(id)
    localStorage.setItem('pos_active_register', id)
  }

  // Real-time subscription to listen for online payment success
  useEffect(() => {
    if (!pushedOrderId) return

    const channel = supabase
      .channel(`order-${pushedOrderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${pushedOrderId}`
      }, (payload) => {
        if (payload.new.status === 'paid' || payload.new.status === 'completed') {
          toast.success('Payment completed successfully!')
          setPushedOrderId(null)
          setCart([])
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [pushedOrderId, supabase])

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (activePageId !== 'all' && item.page_id !== activePageId) return false
      if (!searchQuery) return true
      return item.title.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [items, searchQuery, activePageId])

  const addToCart = (item: PageItem) => {
    if (pushedOrderId) return // Locked
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { ...item, cartKey: item.id, quantity: 1 }]
    })
  }

  const updateQuantity = (cartKey: string, delta: number) => {
    if (pushedOrderId) return
    setCart(prev => prev.map(c => {
      if (c.cartKey === cartKey) {
        const newQ = c.quantity + delta
        if (newQ <= 0) return c
        return { ...c, quantity: newQ }
      }
      return c
    }).filter(c => c.quantity > 0))
  }

  const removeFromCart = (cartKey: string) => {
    if (pushedOrderId) return
    setCart(prev => prev.filter(c => c.cartKey !== cartKey))
  }

  const cartTotalMinor = cart.reduce((sum, item) => sum + ((item.price_minor || 0) * item.quantity), 0)
  
  const tenderedMinor = parseFloat(amountTendered || '0') * 100
  const changeMinor = Math.max(0, tenderedMinor - cartTotalMinor)

  const handleCheckout = () => {
    if (cart.length === 0) return
    if (paymentMethod === 'online' && !activeRegisterId) {
      toast.error('Please select an active Terminal/Register to use Desk Pay.')
      return
    }
    
    const orderPageId = cart[0].page_id

    startTransition(async () => {
      try {
        const res = await submitPosOrder({
          organizationId,
          locationId,
          pageId: orderPageId,
          staffId,
          paymentMethod,
          totalMinor: cartTotalMinor,
          resourceId: paymentMethod === 'online' ? activeRegisterId : undefined,
          items: cart.map(c => ({
            id: c.id,
            name: c.title,
            price_minor: c.price_minor,
            quantity: c.quantity,
            variants: c.selectedVariants,
            item_data: c.item_data
          }))
        })
        
        if (paymentMethod === 'online' && res?.orderId) {
          setPushedOrderId(res.orderId)
          toast.success('Pushed to terminal! Waiting for customer to pay.')
          return
        }
        
        toast.success('Order completed successfully!')
        setCart([])
        setAmountTendered('')
      } catch (err) {
        toast.error((err as Error).message || 'Failed to complete order.')
      }
    })
  }

  const handleRecall = async () => {
    if (!activeRegisterId || !pushedOrderId) return
    try {
      await unlinkResourceOrder(activeRegisterId)
      setPushedOrderId(null)
      toast.info('Order recalled from terminal. You can now edit the cart.')
    } catch {
      toast.error('Failed to recall order.')
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden bg-zinc-950 relative">
      
      {/* Waiting overlay for Desk Pay */}
      {pushedOrderId && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-sm w-full flex flex-col items-center shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-500/20 animate-pulse"></div>
              <Smartphone className="w-8 h-8 text-emerald-500" />
            </div>
            
            <h3 className="text-xl font-black text-white mb-2 text-center">Waiting for Customer</h3>
            <p className="text-zinc-400 text-sm text-center mb-6">
              The order has been pushed to the terminal. Ask the customer to scan the Desk QR to pay.
            </p>
            
            <p className="text-white font-bold text-3xl mb-8">
              {formatCurrency(cartTotalMinor, currency)}
            </p>

            <button
              onClick={handleRecall}
              className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" /> Recall / Edit Order
            </button>
          </div>
        </div>
      )}

      {/* Left Panel: Items Grid */}
      <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-zinc-800 lg:overflow-hidden h-[60vh] lg:h-auto">
        
        {/* Header / Filters */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex flex-col gap-4 shrink-0">
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search items..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Terminal Selector & In-situ Setup */}
            {localRegisters.length === 0 ? (
              <button
                type="button"
                onClick={() => setShowAddTerminalModal(true)}
                className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Setup Terminal
              </button>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-2 rounded-lg border border-zinc-700">
                  <MonitorSmartphone className="w-4 h-4 text-emerald-400" />
                  <select
                    value={activeRegisterId}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setShowAddTerminalModal(true)
                      } else {
                        handleRegisterChange(e.target.value)
                      }
                    }}
                    className="bg-transparent text-sm font-medium text-white focus:outline-none min-w-[120px] cursor-pointer"
                  >
                    {localRegisters.map(r => (
                      <option key={r.id} value={r.id} className="bg-zinc-900">{r.name}</option>
                    ))}
                    <option value="__add_new__" className="bg-zinc-900 font-bold text-emerald-400">+ Add Terminal...</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddTerminalModal(true)}
                  title="Add New Register Terminal"
                  className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button 
              onClick={() => setActivePageId('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors ${activePageId === 'all' ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
            >
              All Menus
            </button>
            {pages.map(p => (
              <button 
                key={p.id}
                onClick={() => setActivePageId(p.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors ${activePageId === p.id ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
              >
                {p.title}
              </button>
            ))}
            <Link
              href="/dashboard/menus"
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
            >
              <Plus className="w-3 h-3" /> New Menu
            </Link>
          </div>
        </div>
        
        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-zinc-950/50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredItems.map(item => (
              <button 
                key={item.id}
                onClick={() => addToCart(item)}
                disabled={item.availability_status !== 'available' || !!pushedOrderId}
                className={`text-left flex flex-col p-3 rounded-xl border transition-all active:scale-95 ${
                  item.availability_status === 'available' && !pushedOrderId
                    ? 'bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800' 
                    : 'bg-zinc-900/40 border-zinc-800/50 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="aspect-square w-full rounded-xl bg-zinc-800 mb-3 relative overflow-hidden shrink-0 border border-zinc-800/80 shadow-inner">
                  {item.images?.[0] ? (
                    <Image src={item.images[0]} alt={item.title} fill className="object-cover" sizes="120px" />
                  ) : (
                    <ItemImagePlaceholder title={item.title} />
                  )}
                </div>
                <div className="font-bold text-sm text-white line-clamp-2 leading-tight mb-1">{item.title}</div>
                <div className="text-emerald-400 text-xs font-bold mt-auto">
                  {formatCurrency(item.price_minor || 0, currency)}
                </div>
              </button>
            ))}
            
            {filteredItems.length === 0 && (
              <div className="col-span-full py-12 text-center text-zinc-500 text-sm">
                No items found.
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Right Panel: Cart */}
      <div className="w-full lg:w-[340px] xl:w-[400px] flex flex-col bg-zinc-900/80 shrink-0 border-l border-zinc-800 h-[40vh] lg:h-auto">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
          <h2 className="font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Current Order
          </h2>
          <span className="bg-zinc-800 text-zinc-300 text-xs font-bold px-2 py-1 rounded-md">{cart.length} items</span>
        </div>
        
        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2">
              <ShoppingCart className="w-12 h-12 opacity-20" />
              <p className="text-sm">Order is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.cartKey} className="flex flex-col gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded-xl relative group">
                <div className="flex justify-between items-start pr-6">
                  <div className="font-bold text-sm text-white">{item.title}</div>
                  <div className="font-bold text-sm text-emerald-400 shrink-0">
                    {formatCurrency((item.price_minor || 0) * item.quantity, currency)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <div className={`flex items-center gap-3 bg-zinc-900 rounded-lg p-1 border border-zinc-800 ${pushedOrderId ? 'opacity-50' : ''}`}>
                    <button 
                      onClick={() => updateQuantity(item.cartKey, -1)}
                      disabled={!!pushedOrderId}
                      className="p-1 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors disabled:cursor-not-allowed"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-bold text-white w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.cartKey, 1)}
                      disabled={!!pushedOrderId}
                      className="p-1 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                {!pushedOrderId && (
                  <button 
                    onClick={() => removeFromCart(item.cartKey)}
                    className="absolute top-3 right-3 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Checkout Panel */}
        <div className="border-t border-zinc-800 bg-zinc-950 p-4 shrink-0 flex flex-col gap-4">
          <div className="flex justify-between items-center text-lg">
            <span className="font-medium text-zinc-400">Total</span>
            <span className="font-black text-white text-2xl">{formatCurrency(cartTotalMinor, currency)}</span>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            <button 
              onClick={() => setPaymentMethod('cash')}
              disabled={!!pushedOrderId}
              className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-bold transition-all ${paymentMethod === 'cash' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'} disabled:opacity-50`}
            >
              <Banknote className="w-4 h-4" /> Cash
            </button>
            <button 
              onClick={() => setPaymentMethod('card')}
              disabled={!!pushedOrderId}
              className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-bold transition-all ${paymentMethod === 'card' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'} disabled:opacity-50`}
            >
              <CreditCard className="w-4 h-4" /> Card
            </button>
            <button 
              onClick={() => setPaymentMethod('transfer')}
              disabled={!!pushedOrderId}
              className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-bold transition-all ${paymentMethod === 'transfer' ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'} disabled:opacity-50`}
            >
              <Landmark className="w-4 h-4" /> Transfer
            </button>
            <button 
              onClick={() => setPaymentMethod('online')}
              disabled={!!pushedOrderId}
              className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-bold transition-all ${paymentMethod === 'online' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'} disabled:opacity-50`}
            >
              <Smartphone className="w-4 h-4" /> Desk Pay
            </button>
          </div>

          {paymentMethod === 'cash' && cartTotalMinor > 0 && (
            <div className="flex gap-2">
              <input 
                type="number" 
                placeholder="Amount Tendered" 
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                disabled={!!pushedOrderId}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
              <div className="flex items-center justify-center px-4 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-bold text-zinc-400 shrink-0 min-w-[100px]">
                Change: {changeMinor > 0 ? formatCurrency(changeMinor, currency) : '0'}
              </div>
            </div>
          )}
          
          <button 
            disabled={cart.length === 0 || isPending || !!pushedOrderId}
            onClick={handleCheckout}
            className="w-full py-4 rounded-xl font-black text-white flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-400"
          >
            {isPending ? 'Processing...' : paymentMethod === 'online' ? (
              <>
                <MonitorSmartphone className="w-5 h-5" />
                Push to Terminal
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Complete Payment
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Add Terminal Modal */}
      {showAddTerminalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <MonitorSmartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add POS Register Terminal</h3>
                  <p className="text-xs text-zinc-400">Quickly link a new counter terminal</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddTerminalModal(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Terminal / Register Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main Counter Register, Bar POS #1"
                  value={newTerminalName}
                  onChange={(e) => setNewTerminalName(e.target.value)}
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Terminal Type
                </label>
                <select
                  value={newTerminalType}
                  onChange={(e) => setNewTerminalType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="register">POS Register / Cash Desk</option>
                  <option value="reception">Reception / Front Desk Counter</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowAddTerminalModal(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCreatingTerminal || !newTerminalName.trim()}
                onClick={async () => {
                  if (!newTerminalName.trim()) return
                  setIsCreatingTerminal(true)
                  try {
                    const res = await createRegisterAction(locationId, newTerminalName, newTerminalType)
                    if (res.success && res.register) {
                      setLocalRegisters(prev => [...prev, res.register])
                      handleRegisterChange(res.register.id)
                      setShowAddTerminalModal(false)
                      setNewTerminalName('')
                      toast.success(`Terminal "${res.register.name}" created!`)
                    }
                  } catch (err: unknown) {
                    toast.error((err as Error)?.message || 'Failed to create terminal')
                  } finally {
                    setIsCreatingTerminal(false)
                  }
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isCreatingTerminal ? 'Creating...' : 'Create Terminal'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
