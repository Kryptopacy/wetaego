'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Check, ExternalLink } from 'lucide-react'
import { useAudioAlert } from '@/lib/hooks/use-audio'
import Link from 'next/link'

type StaffNotification = {
  id: string
  organization_id: string
  title: string
  body: string
  action_url: string | null
  is_read: boolean
  created_at: string
}

type NotificationCategory = 'all' | 'intercom' | 'orders' | 'stock'

function getCategory(item: StaffNotification): 'intercom' | 'orders' | 'stock' {
  const text = (item.title + ' ' + item.body + ' ' + (item.action_url || '')).toLowerCase()
  if (text.includes('table') || text.includes('waiter') || text.includes('intercom') || text.includes('call') || text.includes('service') || text.includes('chat') || text.includes('complaint')) {
    return 'intercom'
  }
  if (text.includes('stock') || text.includes('inventory') || text.includes('sold out') || text.includes('low')) {
    return 'stock'
  }
  return 'orders'
}

export function NotificationCenter() {
  const supabase = createClient()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [items, setItems] = useState<StaffNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<NotificationCategory>('all')
  const { playChime } = useAudioAlert()

  // ── Initial org fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user?.id) return
      supabase
        .from('organization_members')
        .select('organizations(id)')
        .eq('user_id', data.user.id).limit(1).maybeSingle()
        .then(({ data: m }) => {
          const id = m?.organizations?.id
          if (id) { setOrgId(id); return }
          // Fallback: owner who is not a member record
          supabase
            .from('organizations')
            .select('id')
            .eq('created_by', data.user.id).limit(1).maybeSingle()
            .then(({ data: org }) => { if (org?.id) setOrgId(org.id) })
        })
    })
  }, [supabase]) 

  // ── Initial data fetch ───────────────────────────────────────────────────────
  const fetchAll = useCallback(async (id: string) => {
    const { data } = await (supabase as ReturnType<typeof supabase.from> extends never ? never : typeof supabase)
      .from('staff_notifications')
      .select('*')
      .eq('organization_id', id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(30)

    if (data) {
      setItems(data as StaffNotification[])
    }
  }, [supabase])  

  useEffect(() => {
    if (!orgId) return
    Promise.resolve().then(() => fetchAll(orgId))
  }, [orgId, fetchAll])

  // ── Realtime subscriptions ───────────────────────────────────────────────────
  useEffect(() => {
    if (!orgId) return

    const channelName = `staff-notifications-${orgId}-${Math.random().toString(36).substring(2, 9)}`
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_notifications', filter: `organization_id=eq.${orgId}` }, (payload: { eventType: string, new: Record<string, unknown>, old?: Record<string, unknown> }) => {
        if (payload.eventType === 'INSERT') {
          if (!payload.new.is_read) {
            playChime()
            setItems(prev => [payload.new as StaffNotification, ...prev])
          }
        } else if (payload.eventType === 'UPDATE') {
          if (payload.new.is_read) {
            setItems(prev => prev.filter(i => i.id !== payload.new.id))
          } else {
            setItems(prev => {
              const exists = prev.find(i => i.id === payload.new.id)
              return exists
                ? prev.map(i => i.id === payload.new.id ? (payload.new as StaffNotification) : i)
                : [payload.new as StaffNotification, ...prev]
            })
          }
        }
      })
      
    channel.subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId, supabase, playChime]) 

  // ── App Badge API ────────────────────────────────────────────────────────────
  useEffect(() => {
    if ('setAppBadge' in navigator) {
      if (items.length > 0) {
        (navigator as Navigator & { setAppBadge?: (count: number) => Promise<void> }).setAppBadge?.(items.length).catch(console.error)
      } else {
        (navigator as Navigator & { clearAppBadge?: () => Promise<void> }).clearAppBadge?.().catch(console.error)
      }
    }
  }, [items.length])

  const markAsRead = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
    await (supabase as ReturnType<typeof supabase.from> extends never ? never : typeof supabase).from('staff_notifications').update({ is_read: true }).eq('id', id)
  }

  const markAllAsRead = async () => {
    if (!orgId || items.length === 0) return
    setItems([])
    await (supabase as ReturnType<typeof supabase.from> extends never ? never : typeof supabase).from('staff_notifications').update({ is_read: true }).eq('organization_id', orgId).eq('is_read', false)
  }

  const filteredItems = items.filter(item => {
    if (activeTab === 'all') return true
    return getCategory(item) === activeTab
  })

  const intercomCount = items.filter(i => getCategory(i) === 'intercom').length
  const ordersCount = items.filter(i => getCategory(i) === 'orders').length
  const stockCount = items.filter(i => getCategory(i) === 'stock').length

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
        aria-label="Open notifications"
      >
        <Bell className="w-5 h-5" />
        {items.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse border-2 border-zinc-950" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-white">
            {/* Header */}
            <div className="p-3.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-center">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400" />
                Notifications Center
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-zinc-500">{items.length} unread</span>
                {items.length > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-semibold">
                    <Check className="w-3 h-3" /> Mark All Read
                  </button>
                )}
              </div>
            </div>

            {/* Categorized Filter Tabs */}
            <div className="p-1.5 bg-black/40 border-b border-zinc-800 flex gap-1 text-[11px] font-semibold overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All ({items.length})
              </button>
              <button
                onClick={() => setActiveTab('intercom')}
                className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap ${
                  activeTab === 'intercom' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                🛎️ Intercom {intercomCount > 0 && `(${intercomCount})`}
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap ${
                  activeTab === 'orders' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                🛒 Orders {ordersCount > 0 && `(${ordersCount})`}
              </button>
              <button
                onClick={() => setActiveTab('stock')}
                className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap ${
                  activeTab === 'stock' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                ⚠️ Stock {stockCount > 0 && `(${stockCount})`}
              </button>
            </div>

            {/* Notifications Feed */}
            <div className="max-h-[55vh] overflow-y-auto custom-scrollbar">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  No unread notifications in this category.
                </div>
              ) : (
                <div className="p-2 space-y-1.5">
                  {filteredItems.map(item => {
                    const cat = getCategory(item)
                    const targetUrl = item.action_url || (cat === 'intercom' ? '/dashboard/intercom' : '/dashboard/orders')

                    return (
                      <div
                        key={item.id}
                        className="group block p-3 rounded-xl border bg-zinc-800/40 border-zinc-800 hover:bg-zinc-800/80 transition-colors relative"
                      >
                        <button 
                          onClick={() => markAsRead(item.id)}
                          className="absolute top-2.5 right-2.5 p-1 rounded-md text-zinc-500 hover:text-emerald-400 hover:bg-zinc-700 transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <div className="text-xs font-bold text-emerald-400 mb-0.5 pr-6 flex items-center gap-1.5">
                          {cat === 'intercom' && '🛎️'}
                          {cat === 'orders' && '🛒'}
                          {cat === 'stock' && '⚠️'}
                          {item.title}
                        </div>
                        <div className="text-[11px] text-zinc-300 font-normal mb-2 whitespace-pre-wrap leading-relaxed">{item.body}</div>
                        
                        <Link 
                          href={targetUrl}
                          onClick={() => {
                            markAsRead(item.id)
                            setIsOpen(false)
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Handle Request <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer Direct Links */}
            <div className="p-2.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs font-bold text-zinc-400">
              <Link
                href="/dashboard/intercom"
                onClick={() => setIsOpen(false)}
                className="hover:text-emerald-400 transition-colors"
              >
                Open Intercom Hub →
              </Link>
              <Link
                href="/dashboard/orders"
                onClick={() => setIsOpen(false)}
                className="hover:text-white transition-colors"
              >
                View Orders →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
