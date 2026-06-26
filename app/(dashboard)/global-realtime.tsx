
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

function playChime(type: 'order' | 'service') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioContextClass()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'order') {
      // Cash register-esque sequence
      osc.type = 'square'
      osc.frequency.setValueAtTime(400, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    } else {
      // Simple Bell Ding
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
      gain.gain.setValueAtTime(0.5, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 1.0)
    }
  } catch (e) {
    console.error("Audio synthesis failed:", e)
  }
}

export function GlobalRealtime() {
  const supabase = createClient()
  const router = useRouter()
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) {
        supabase.from('organizations').select('id').eq('created_by', data.user.id).single()
          .then(({ data: orgData }) => {
            if (orgData?.id) setOrgId(orgData.id)
          })
      }
    })
  }, [supabase])

  useEffect(() => {
    if (!orgId) return

    // Wake Lock Request
    let wakeLock: WakeLockSentinel | null = null
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen')
        }
      } catch (err: unknown) {
        console.warn(`Wake Lock error: ${(err as Error).name}, ${(err as Error).message}`)
      }
    }
    requestWakeLock()
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !wakeLock) {
        requestWakeLock()
      }
    })

    const channel = supabase.channel('global-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `organization_id=eq.${orgId}` }, (payload: { new: Record<string, unknown> }) => {
        playChime('order')
        toast.success(`New Order Received!`, {
          description: `Table: ${payload.new.table_identifier || 'Takeaway'}`,
          duration: 10000,
        })
        router.refresh()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'service_requests', filter: `organization_id=eq.${orgId}` }, (payload: { new: Record<string, unknown> }) => {
        playChime('service')
        toast.error(`Service Request!`, {
          description: `Table ${payload.new.table_identifier} needs ${payload.new.request_type}`,
          duration: 10000,
        })
        router.refresh()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `organization_id=eq.${orgId}` }, () => router.refresh())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'service_requests', filter: `organization_id=eq.${orgId}` }, () => router.refresh())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (wakeLock) wakeLock.release().then(() => { wakeLock = null })
    }
  }, [orgId, supabase, router])

  return null
}
