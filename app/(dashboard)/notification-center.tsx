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

export function NotificationCenter() {
  const supabase = createClient()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [items, setItems] = useState<StaffNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const { playChime } = useAudioAlert()

  // ── Initial org fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user?.id) return
      supabase
        .from('organization_members')
        .select('organizations(id)')
        .eq('user_id', data.user.id)
        .single()
        .then(({ data: m }) => {
          const id = m?.organizations?.id
          if (id) { setOrgId(id); return }
          // Fallback: owner who is not a member record
          supabase
            .from('organizations')
            .select('id')
            .eq('created_by', data.user.id)
            .single()
            .then(({ data: org }) => { if (org?.id) setOrgId(org.id) })
        })
    })
  }, [supabase]) 

  // ── Initial data fetch ───────────────────────────────────────────────────────
  const fetchAll = useCallback(async (id: string) => {
    // We cast to any to bypass the type error in case types.ts isn't fully updated on IDE side
    const { data } = await (supabase as any)
      .from('staff_notifications')
      .select('*')
      .eq('organization_id', id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(20)

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

    const channel = supabase
      .channel(`staff-notifications-${orgId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_notifications', filter: `organization_id=eq.${orgId}` }, (payload: any) => {
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
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId, supabase, playChime]) 

  // ── App Badge API ────────────────────────────────────────────────────────────
  useEffect(() => {
    if ('setAppBadge' in navigator) {
      if (items.length > 0) {
        (navigator as any).setAppBadge(items.length).catch(console.error)
      } else {
        (navigator as any).clearAppBadge().catch(console.error)
      }
    }
  }, [items.length])

  const markAsRead = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
    await (supabase as any).from('staff_notifications').update({ is_read: true }).eq('id', id)
  }

  const markAllAsRead = async () => {
    if (!orgId || items.length === 0) return
    setItems([])
    await (supabase as any).from('staff_notifications').update({ is_read: true }).eq('organization_id', orgId).eq('is_read', false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
      >
        <Bell className="w-5 h-5" />
        {items.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse border border-zinc-950" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-3 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center">
              <span className="font-bold text-sm text-white">Notifications</span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-zinc-500">{items.length} unread</span>
                {items.length > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                    <Check className="w-3 h-3" /> All Read
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">
                  You&apos;re all caught up!
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className="group block p-3 rounded-lg border bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-800/50 transition-colors relative"
                    >
                      <button 
                        onClick={() => markAsRead(item.id)}
                        className="absolute top-2 right-2 p-1 rounded-md text-zinc-500 hover:text-emerald-400 hover:bg-zinc-700 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <div className="text-sm font-bold text-emerald-400 mb-0.5 pr-6">
                        {item.title}
                      </div>
                      <div className="text-xs text-zinc-300 font-medium mb-2 whitespace-pre-wrap">{item.body}</div>
                      
                      {item.action_url && (
                        <Link 
                          href={item.action_url}
                          onClick={() => {
                            markAsRead(item.id)
                            setIsOpen(false)
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300"
                        >
                          View Details <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="block p-3 text-center text-xs font-bold text-zinc-400 bg-zinc-950 hover:bg-zinc-900 transition-colors border-t border-zinc-800"
            >
              View Dashboard →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
