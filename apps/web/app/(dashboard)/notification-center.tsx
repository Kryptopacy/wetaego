/* eslint-disable react/no-unescaped-entities */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell } from 'lucide-react'
import Link from 'next/link'

type NotificationItem = {
  id: string
  type: 'order' | 'service_request' | 'booking' | 'inquiry'
  title: string
  subtitle: string
  href: string
  color: 'blue' | 'yellow' | 'violet' | 'emerald'
  timestamp: string
}

export function NotificationCenter() {
  const supabase = createClient()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  // ── Initial org fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }: any) => {
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Convert raw rows into NotificationItems ──────────────────────────────────
  const toOrderItem = (o: Record<string, unknown>): NotificationItem => ({
    id: o.id as string,
    type: 'order',
    title: 'New Order',
    subtitle: `Table ${o.table_identifier || 'Takeaway'} · ₦${((o.total_amount_minor as number || 0) / 100).toLocaleString()}`,
    href: '/dashboard/orders',
    color: 'blue',
    timestamp: o.created_at as string,
  })

  const toRequestItem = (r: Record<string, unknown>): NotificationItem => ({
    id: r.id as string,
    type: 'service_request',
    title: `Table ${r.table_identifier}`,
    subtitle: `Needs ${r.request_type}`,
    href: '/dashboard/orders',
    color: 'yellow',
    timestamp: r.created_at as string,
  })

  const toBookingItem = (b: Record<string, unknown>): NotificationItem => ({
    id: b.id as string,
    type: 'booking',
    title: 'New Booking',
    subtitle: `${b.customer_name} · ${(b.location_pages as { title: string })?.title || 'Booking'}`,
    href: '/dashboard/manage/bookings',
    color: 'violet',
    timestamp: b.created_at as string,
  })

  const toInquiryItem = (i: Record<string, unknown>): NotificationItem => ({
    id: i.id as string,
    type: 'inquiry',
    title: 'New Enquiry',
    subtitle: `${i.customer_name} · ${(i.location_pages as { title: string })?.title || 'Page'}`,
    href: '/dashboard/manage/properties',
    color: 'emerald',
    timestamp: i.created_at as string,
  })

  // ── Initial data fetch ───────────────────────────────────────────────────────
  const fetchAll = useCallback(async (id: string) => {
    const [ordersRes, requestsRes, bookingsRes, inquiriesRes] = await Promise.all([
      supabase
        .from('orders')
        .select('id, table_identifier, total_amount_minor, created_at')
        .eq('organization_id', id)
        .in('status', ['pending', 'paid'])
        .order('created_at', { ascending: false })
        .limit(10),

      supabase
        .from('service_requests')
        .select('id, table_identifier, request_type, created_at')
        .eq('organization_id', id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10),

      supabase
        .from('page_bookings')
        .select('id, customer_name, created_at, location_pages(title)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10),

      supabase
        .from('page_inquiries')
        .select('id, customer_name, created_at, location_pages(title)')
        .eq('status', 'new')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    const all: NotificationItem[] = [
      ...(ordersRes.data || []).map(toOrderItem),
      ...(requestsRes.data || []).map(toRequestItem),
      ...(bookingsRes.data || []).map(toBookingItem),
      ...(inquiriesRes.data || []).map(toInquiryItem),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    setItems(all)
  }, [supabase]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!orgId) return
    fetchAll(orgId)
  }, [orgId, fetchAll])

  // ── Realtime subscriptions ───────────────────────────────────────────────────
  useEffect(() => {
    if (!orgId) return

    const channel = supabase
      .channel(`notification-${orgId}-${Math.random()}`)
      // Orders
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `organization_id=eq.${orgId}` }, (payload: { eventType: string, new: Record<string, unknown> }) => {
        if (payload.eventType === 'INSERT') {
          if (['pending', 'paid'].includes(payload.new.status as string)) {
            setItems(prev => [toOrderItem(payload.new), ...prev])
          }
        } else if (payload.eventType === 'UPDATE') {
          if (['pending', 'paid'].includes(payload.new.status as string)) {
            setItems(prev => {
              const exists = prev.find(i => i.id === payload.new.id)
              return exists
                ? prev.map(i => i.id === payload.new.id ? toOrderItem(payload.new) : i)
                : [toOrderItem(payload.new), ...prev]
            })
          } else {
            setItems(prev => prev.filter(i => i.id !== payload.new.id))
          }
        }
      })
      // Service requests
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests', filter: `organization_id=eq.${orgId}` }, (payload: { eventType: string, new: Record<string, unknown> }) => {
        if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
          setItems(prev => [toRequestItem(payload.new), ...prev])
        } else if (payload.eventType === 'UPDATE') {
          if (payload.new.status === 'pending') {
            setItems(prev => {
              const exists = prev.find(i => i.id === payload.new.id)
              return exists ? prev.map(i => i.id === payload.new.id ? toRequestItem(payload.new) : i) : [toRequestItem(payload.new), ...prev]
            })
          } else {
            setItems(prev => prev.filter(i => i.id !== payload.new.id))
          }
        }
      })
      // Bookings — join via page_id → location → org
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'page_bookings' }, (payload: { new: { id: string } }) => {
        // We'll do a quick verify: fetch with org context
        supabase
          .from('page_bookings')
          .select('id, customer_name, created_at, location_pages(title, locations(organization_id))')
          .eq('id', payload.new.id)
          .single()
          .then(({ data }) => {
            if ((data as unknown as { location_pages?: { locations?: { organization_id?: string } } })?.location_pages?.locations?.organization_id === orgId) {
              setItems(prev => [toBookingItem(data as Record<string, unknown>), ...prev])
            }
          })
      })
      // Inquiries
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'page_inquiries' }, (payload: { new: { id: string } }) => {
        supabase
          .from('page_inquiries')
          .select('id, customer_name, created_at, location_pages(title, locations(organization_id))')
          .eq('id', payload.new.id)
          .single()
          .then(({ data }) => {
            if ((data as unknown as { location_pages?: { locations?: { organization_id?: string } } })?.location_pages?.locations?.organization_id === orgId) {
              setItems(prev => [toInquiryItem(data as Record<string, unknown>), ...prev])
            }
          })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── App Badge API ────────────────────────────────────────────────────────────
  useEffect(() => {
    if ('setAppBadge' in navigator) {
      if (items.length > 0) {
        (navigator as unknown as { setAppBadge: (v: number) => Promise<void> }).setAppBadge(items.length).catch(console.error)
      } else {
        (navigator as unknown as { clearAppBadge: () => Promise<void> }).clearAppBadge().catch(console.error)
      }
    }
  }, [items.length])

  const colorMap = {
    blue: 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/15',
    violet: 'bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/15',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15',
  }

  const labelColorMap = {
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
    violet: 'text-violet-400',
    emerald: 'text-emerald-400',
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
              <span className="text-xs font-medium text-zinc-500">{items.length} unread</span>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">
                  You&apos;re all caught up!
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {items.map(item => (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`block p-3 rounded-lg border transition-colors ${colorMap[item.color]}`}
                    >
                      <div className={`text-xs font-bold mb-0.5 uppercase tracking-wider ${labelColorMap[item.color]}`}>
                        {item.title}
                      </div>
                      <div className="text-sm text-white font-medium">{item.subtitle}</div>
                    </Link>
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
