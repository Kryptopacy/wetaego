'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Play, Square } from 'lucide-react'
import { GemstoneSpinner } from '@/components/ui/gemstone-spinner'
import { clockIn, clockOut } from './dashboard/shifts/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'

export function TimeclockWidget({ locationId }: { locationId: string }) {
  const [loading, setLoading] = useState(false)
  const [time, setTime] = useState('')
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const updateTime = () => setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchShift = async () => {
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
    }
    fetchShift()
  }, [supabase])

  const handleAction = async () => {
    setLoading(true)
    try {
      if (activeShiftId) {
        const res = await clockOut({ shiftId: activeShiftId })
        if (res?.serverError || res?.validationErrors) {
          toast.error(res?.serverError || 'Failed to clock out')
          return
        }
        setActiveShiftId(null)
      } else {
        let lat, lng;
        if ('geolocation' in navigator) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
            })
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
          } catch (err) {
            console.warn('Geolocation failed:', err)
            toast.error('Could not determine your location. Clock-in might be rejected if a geofence is required.')
          }
        }
        
        const res = await clockIn({ locationId, latitude: lat, longitude: lng })
        if (res?.serverError || res?.validationErrors) {
          toast.error(res?.serverError || 'Failed to clock in')
          return
        }
        // Refresh shift
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('staff_shifts')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle()
          if (data) setActiveShiftId(data.id)
        }
      }
      router.refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
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
        ) : activeShiftId ? (
          <>
            <Square className="w-3 h-3 fill-current" />
            Clock Out
          </>
        ) : (
          <>
            <Play className="w-3 h-3 fill-current" />
            Clock In
          </>
        )}
      </motion.button>
    </div>
  )
}
