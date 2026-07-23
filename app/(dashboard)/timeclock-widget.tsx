'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Play, Square, QrCode, Monitor, MapPin } from 'lucide-react'
import { GemstoneSpinner } from '@/components/ui/gemstone-spinner'
import { clockIn, clockOut } from './dashboard/shifts/actions'
import { clockInWithQr } from './dashboard/shifts/kiosk-actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface TimeclockWidgetProps {
  locationId: string
  clockInMode?: 'geofence' | 'qr_kiosk' | 'both'
  isManager?: boolean
  fullWidth?: boolean
}

export function TimeclockWidget({ 
  locationId, 
  clockInMode = 'geofence',
  isManager = false,
  fullWidth = false
}: TimeclockWidgetProps) {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [time, setTime] = useState('')
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null)
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [qrInput, setQrInput] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    const updateTime = () => setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  const refreshShift = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('staff_shifts')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()
    if (data) setActiveShiftId(data.id)
    else setActiveShiftId(null)
  }, [supabase])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshShift()
  }, [refreshShift])

  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      subscription = supabase
        .channel(`timeclock_user_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'staff_shifts',
          },
          (payload) => {
            const p = payload as unknown as { new?: { user_id: string } }
            if (p.new && p.new.user_id === user.id) {
              refreshShift()
            }
          }
        )
        .subscribe()
    }

    setupRealtime()

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [supabase, refreshShift, router])

  const handleGeofenceClockIn = async () => {
    setLoading(true)
    try {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by your browser')
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await clockIn({
              locationId,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            })
            if (res?.serverError || res?.validationErrors) {
              toast.error(res?.serverError || 'Failed to clock in via GPS')
              return
            }
            await refreshShift()
            toast.success('Clocked in via GPS!')
            router.refresh()
          } finally {
            setLoading(false)
          }
        },
        async (err) => {
          if (clockInMode === 'both') {
            toast.info('GPS unavailable or denied. Please scan the Kiosk QR instead.')
            setShowQrScanner(true)
            setLoading(false)
          } else {
            toast.error('Location access denied or unavailable: ' + err.message)
            setLoading(false)
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } catch (_e) {
      setLoading(false)
    }
  }

  const handleQrClockIn = async (token: string) => {
    setLoading(true)
    setShowQrScanner(false)
    try {
      const res = await clockInWithQr({ locationId, token })
      if (res?.serverError) {
        toast.error(res.serverError)
        return
      }
      await refreshShift()
      toast.success('Clocked in via QR!')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const handleClockOut = async () => {
    if (!activeShiftId) return
    setLoading(true)
    try {
      const res = await clockOut({ shiftId: activeShiftId })
      if (res?.serverError || res?.validationErrors) {
        toast.error(res?.serverError || 'Failed to clock out')
        return
      }
      setActiveShiftId(null)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (activeShiftId) {
      await handleClockOut()
      return
    }
    // Clock-in: decide flow based on mode
    if (clockInMode === 'qr_kiosk') {
      setShowQrScanner(true)
    } else if (clockInMode === 'both') {
      setShowQrScanner(true) // Show QR by default; geofence available as fallback in modal
    } else {
      await handleGeofenceClockIn()
    }
  }



  if (!mounted) {
    if (fullWidth) {
      return (
        <div className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/5 text-zinc-500 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-500 font-bold text-xs leading-tight">--:--</span>
                <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-600">Off Duty</span>
              </div>
            </div>
            {isManager && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-zinc-600">
                <Monitor className="w-3 h-3" />
                <span>Kiosk</span>
              </div>
            )}
          </div>
          <div className="w-full py-2 rounded-lg bg-zinc-800/50 border border-zinc-800 flex items-center justify-center gap-2 text-xs font-bold text-zinc-500 animate-pulse">
            <span>Clock In</span>
          </div>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-3 bg-zinc-950/50 border border-white/5 rounded-full p-1 pr-4">
        <div className="w-10 h-10 rounded-full bg-white/5 text-zinc-500 flex items-center justify-center">
          <Clock className="w-5 h-5 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-zinc-500 font-bold text-sm leading-tight">--:--</span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-600">Off Duty</span>
        </div>
      </div>
    )
  }

  const clockInLabel = activeShiftId ? (
    <><Square className="w-3 h-3 fill-current" /> Clock Out</>
  ) : clockInMode === 'qr_kiosk' || clockInMode === 'both' ? (
    <><QrCode className="w-3 h-3" /> Scan QR</>
  ) : (
    <><Play className="w-3 h-3 fill-current" /> Clock In</>
  )

  const qrScannerModal = showQrScanner ? (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-400" />
              Scan Clock-In QR
            </h3>
            <button 
              onClick={() => setShowQrScanner(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-zinc-400">
            Point your device camera or scan token from the dynamic QR code displayed on the company Kiosk or manager device.
          </p>

          <div className="bg-black rounded-xl overflow-hidden border border-zinc-800 aspect-square flex flex-col items-center justify-center p-4 text-center relative">
            <QrCode className="w-16 h-16 text-emerald-500/40 animate-pulse mb-3" />
            <p className="text-xs text-zinc-500 font-medium">Camera scan active</p>
            <p className="text-[10px] text-zinc-600 mt-1">Or enter manual token code below if camera is unavailable</p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 8A3F9C"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value.toUpperCase())}
              className="bg-zinc-800/80 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500 flex-1 uppercase tracking-wider font-mono"
            />
            <button
              onClick={() => handleQrClockIn(qrInput)}
              disabled={!qrInput.trim() || loading}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all"
            >
              Submit
            </button>
          </div>

          {clockInMode === 'both' && (
            <div className="pt-2 border-t border-zinc-800/80 flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowQrScanner(false)
                  handleGeofenceClockIn()
                }}
                className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Clock in via GPS Geofence instead
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  ) : null

  if (fullWidth) {
    // Sidebar card layout
    return (
      <>
        <div className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 flex flex-col gap-3">
          {/* Status row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeShiftId ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-zinc-500'}`}>
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-xs leading-tight">{time || '--:--'}</span>
                <span className={`text-[9px] uppercase font-bold tracking-wider ${activeShiftId ? 'text-emerald-500' : 'text-zinc-600'}`}>
                  {activeShiftId ? 'On Shift' : 'Off Duty'}
                </span>
              </div>
            </div>

            {/* Kiosk link for managers */}
            {isManager && (
              <Link
                href="/dashboard/kiosk"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-semibold transition-all border border-zinc-700/50 shadow-xs"
                title="Open Kiosk Mode on company device"
              >
                <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kiosk Mode</span>
              </Link>
            )}
          </div>

          {/* Action button — full width */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAction}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              activeShiftId
                ? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 hover:border-rose-500'
                : 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-400'
            }`}
          >
            {loading ? <GemstoneSpinner size="xs" className="w-3 h-3" /> : clockInLabel}
          </motion.button>
        </div>
        {qrScannerModal}
      </>
    )
  }

  // Compact pill layout (original — kept for any future header use)
  return (
    <>
      <div className="flex items-center gap-3 bg-zinc-950/50 backdrop-blur-xl border border-white/5 rounded-full p-1 pr-4 shadow-lg shadow-black/20">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeShiftId ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-zinc-400'}`}>
          <Clock className="w-5 h-5" />
        </div>
        
        <div className="flex flex-col">
          <span className="text-white font-bold text-sm leading-tight">{time || '--:--'}</span>
          <span className={`text-[10px] uppercase font-bold tracking-wider ${activeShiftId ? 'text-emerald-500' : 'text-zinc-500'}`}>
            {activeShiftId ? 'On Shift' : 'Off Duty'}
          </span>
        </div>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAction}
          disabled={loading}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeShiftId 
              ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white' 
              : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400'
          }`}
        >
          {loading ? (
            <GemstoneSpinner size="xs" className="w-3 h-3" />
          ) : clockInLabel}
        </motion.button>

        {isManager && (
          <>
            <div className="w-px h-6 bg-white/10" />
            <Link
              href="/dashboard/kiosk"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
              title="Open Kiosk Mode"
            >
              <Monitor className="w-3.5 h-3.5" />
              Kiosk
            </Link>
          </>
        )}
      </div>


      {qrScannerModal}
    </>
  )
}

/** Sidebar variant — full-width card */
export function TimeclockSidebarCard(props: Omit<TimeclockWidgetProps, 'fullWidth'>) {
  return (
    <div className="w-full">
      <TimeclockWidget {...props} fullWidth />
    </div>
  )
}
