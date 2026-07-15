'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DynamicQR } from '@/components/qr/DynamicQR'
import { generateKioskToken } from './kiosk-actions'
import { X, Shield, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

const TOKEN_TTL = 30 // seconds — must match server-side TOKEN_TTL_SECONDS

interface KioskDisplayProps {
  locationId: string
  locationName: string
  businessName: string
  logoUrl?: string | null
  exitPin: string // 4-digit PIN required to exit kiosk mode
}

export function KioskDisplay({
  locationId,
  locationName,
  businessName,
  logoUrl,
  exitPin
}: KioskDisplayProps) {
  const [token, setToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [timeLeft, setTimeLeft] = useState(TOKEN_TTL)
  const [isLoading, setIsLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [enteredPin, setEnteredPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [time, setTime] = useState('')
  const router = useRouter()
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchToken = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await generateKioskToken({ locationId })
      if (res?.data?.token) {
        setToken(res.data.token)
        setExpiresAt(new Date(res.data.expiresAt))
        setTimeLeft(TOKEN_TTL)
        setIsOffline(false)
      }
    } catch {
      setIsOffline(true)
    } finally {
      setIsLoading(false)
    }
  }, [locationId])

  // Initial fetch
  useEffect(() => {
    fetchToken()
  }, [fetchToken])

  // Auto-refresh countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          fetchToken()
          return TOKEN_TTL
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [fetchToken])

  // Wall clock
  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }))
    update()
    const t = setInterval(update, 10000)
    return () => clearInterval(t)
  }, [])

  // Keep screen awake (wake lock API where supported)
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then(lock => {
        wakeLock = lock
      }).catch(() => {})
    }
    return () => { wakeLock?.release() }
  }, [])

  const handlePinDigit = (digit: string) => {
    const next = enteredPin + digit
    setEnteredPin(next)
    if (next.length === 4) {
      if (next === exitPin) {
        router.push('/dashboard')
      } else {
        setPinError(true)
        setTimeout(() => {
          setEnteredPin('')
          setPinError(false)
        }, 800)
      }
    }
  }

  // Build the QR payload: a URL staff open in their browser
  // Format: /kiosk-scan?token=XXX&location=YYY
  // The TimeclockWidget scans this and auto-submits
  const qrUrl = token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/kiosk-scan?t=${token}&l=${locationId}`
    : ''

  const circumference = 2 * Math.PI * 18
  const strokeDashoffset = circumference - (timeLeft / TOKEN_TTL) * circumference

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.08)_0%,_transparent_70%)] pointer-events-none" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 pt-8">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={businessName} className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
          )}
          <div>
            <p className="text-white font-bold text-sm leading-tight">{businessName}</p>
            <p className="text-zinc-500 text-xs">{locationName}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isOffline ? (
            <div className="flex items-center gap-1.5 text-rose-400 text-xs">
              <WifiOff className="w-3.5 h-3.5" /> No Connection
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
              <Wifi className="w-3.5 h-3.5" /> Live
            </div>
          )}
          <p className="text-white text-2xl font-black tabular-nums tracking-tight">{time}</p>
          <button
            onClick={() => setShowExitModal(true)}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-8"
      >
        <div className="text-center">
          <h1 className="text-white text-3xl font-black tracking-tight">Scan to Clock In / Out</h1>
          <p className="text-zinc-400 text-sm mt-2">Open the OurMenu app and scan this code</p>
        </div>

        {/* QR + Timer Ring */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {isLoading || !token ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-64 h-64 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center"
              >
                <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
              </motion.div>
            ) : (
              <motion.div
                key={token}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/10"
              >
                <DynamicQR value={qrUrl} size={260} color="#059669" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Countdown ring */}
          <div className="absolute -bottom-4 -right-4 w-12 h-12">
            <svg viewBox="0 0 40 40" className="w-12 h-12 -rotate-90">
              <circle cx="20" cy="20" r="18" fill="none" stroke="#27272a" strokeWidth="3" />
              <circle
                cx="20" cy="20" r="18"
                fill="none"
                stroke={timeLeft <= 5 ? '#f43f5e' : '#10b981'}
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold tabular-nums rotate-0">
              {timeLeft}s
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-full px-4 py-2">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <p className="text-zinc-400 text-xs">Code refreshes every {TOKEN_TTL} seconds — sharing it won't work</p>
        </div>
      </motion.div>

      {/* Exit PIN Modal */}
      <AnimatePresence>
        {showExitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-80 shadow-2xl"
            >
              <button
                onClick={() => { setShowExitModal(false); setEnteredPin('') }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
              <h2 className="text-white text-lg font-bold mb-1">Exit Kiosk Mode</h2>
              <p className="text-zinc-500 text-sm mb-6">Enter the manager PIN to exit</p>

              {/* PIN Dots */}
              <div className="flex justify-center gap-3 mb-6">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full transition-all ${
                      i < enteredPin.length
                        ? pinError ? 'bg-rose-500' : 'bg-emerald-500'
                        : 'bg-zinc-700'
                    }`}
                  />
                ))}
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-2">
                {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      if (d === '⌫') setEnteredPin(p => p.slice(0, -1))
                      else if (d !== '') handlePinDigit(d)
                    }}
                    className={`h-12 rounded-xl text-white font-bold text-lg transition-all ${
                      d === '' ? 'invisible' : 'bg-zinc-800 hover:bg-zinc-700 active:scale-95'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
