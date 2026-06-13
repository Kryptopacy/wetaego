/* eslint-disable react/no-unescaped-entities, @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell } from 'lucide-react'
import Link from 'next/link'

export function NotificationCenter() {
  const supabase = createClient()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [pendingOrders, setPendingOrders] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)

  // Initial fetch and Realtime sync
  useEffect(() => {
    supabase.auth.getUser().then(({ data }: any) => {
      if (data?.user?.id) {
        supabase.from('organizations').select('id').eq('created_by', data.user.id).single()
          .then(({ data: orgData }: any) => {
            if (orgData?.id) {
              setOrgId(orgData.id)
              
              // Initial Data Fetch
              supabase.from('orders').select('*').eq('organization_id', orgData.id).eq('status', 'pending')
                .then(({ data }: any) => setPendingOrders(data || []))
              
              supabase.from('service_requests').select('*').eq('organization_id', orgData.id).eq('status', 'pending')
                .then(({ data }: any) => setPendingRequests(data || []))
            }
          })
      }
    })
  }, [supabase])

  useEffect(() => {
    if (!orgId) return

    const channel = supabase.channel('notification-center')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `organization_id=eq.${orgId}` }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          if (payload.new.status === 'pending') setPendingOrders(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          if (payload.new.status === 'pending') {
             // Handle if it transitioned to pending (rare) or updated while pending
             setPendingOrders(prev => {
                const exists = prev.find(o => o.id === payload.new.id)
                return exists ? prev.map(o => o.id === payload.new.id ? payload.new : o) : [payload.new, ...prev]
             })
          } else {
             // Removed from pending
             setPendingOrders(prev => prev.filter(o => o.id !== payload.new.id))
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests', filter: `organization_id=eq.${orgId}` }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          if (payload.new.status === 'pending') setPendingRequests(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          if (payload.new.status === 'pending') {
             setPendingRequests(prev => {
                const exists = prev.find(r => r.id === payload.new.id)
                return exists ? prev.map(r => r.id === payload.new.id ? payload.new : r) : [payload.new, ...prev]
             })
          } else {
             setPendingRequests(prev => prev.filter(r => r.id !== payload.new.id))
          }
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId, supabase])

  // PWA App Badge API Sync
  const totalCount = pendingOrders.length + pendingRequests.length
  useEffect(() => {
    if ('setAppBadge' in navigator) {
      if (totalCount > 0) {
        (navigator as any).setAppBadge(totalCount).catch(console.error)
      } else {
        (navigator as any).clearAppBadge().catch(console.error)
      }
    }
  }, [totalCount])

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
      >
        <Bell className="w-5 h-5" />
        {totalCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse border border-zinc-950"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-3 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center">
              <span className="font-bold text-sm text-white">Notifications</span>
              <span className="text-xs font-medium text-zinc-500">{totalCount} Unread</span>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto">
              {totalCount === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">
                  You&apos;re all caught up!
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {pendingRequests.map(r => (
                    <Link 
                      key={r.id} href="/dashboard/orders" onClick={() => setIsOpen(false)}
                      className="block p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors"
                    >
                      <div className="text-xs font-bold text-yellow-400 mb-1">TABLE {r.table_identifier}</div>
                      <div className="text-sm text-white font-medium">Needs {r.request_type}</div>
                    </Link>
                  ))}
                  {pendingOrders.map(o => (
                    <Link 
                      key={o.id} href="/dashboard/orders" onClick={() => setIsOpen(false)}
                      className="block p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                    >
                      <div className="text-xs font-bold text-blue-400 mb-1">NEW ORDER</div>
                      <div className="text-sm text-white font-medium">Table {o.table_identifier || 'Takeaway'} - ₦{(o.total_amount_minor/100).toLocaleString()}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link 
              href="/dashboard/orders" 
              onClick={() => setIsOpen(false)}
              className="block p-3 text-center text-xs font-bold text-emerald-400 bg-zinc-950 hover:bg-zinc-900 transition-colors border-t border-zinc-800"
            >
              OPEN LIVE FULFILLMENT →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
