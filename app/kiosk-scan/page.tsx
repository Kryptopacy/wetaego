'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Loader2, QrCode } from 'lucide-react'
import { clockInWithQr } from '../(dashboard)/dashboard/shifts/kiosk-actions'
import { createClient } from '@/lib/supabase/client'

type State = 'loading' | 'clocking_in' | 'success' | 'already_clocked_in' | 'error' | 'needs_auth'

export default function KioskScanPage() {
  const params = useSearchParams()
  const router = useRouter()
  const [state, setState] = useState<State>('loading')
  const [errorMsg, setErrorMsg] = useState('')


  useEffect(() => {
    const token = params.get('t')
    const locationId = params.get('l')

    if (!token || !locationId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState('error')
      setErrorMsg('Invalid QR code. Please scan again.')
      return
    }

    const run = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Store the scan URL so we can redirect after login
        sessionStorage.setItem('kiosk_redirect', window.location.href)
        setState('needs_auth')
        return
      }

      // Check if already clocked in at this location
      const { data: existing } = await supabase
        .from('staff_shifts')
        .select('id')
        .eq('user_id', user.id)
        .eq('location_id', locationId)
        .eq('status', 'active')
        .maybeSingle()

      if (existing) {
        setState('already_clocked_in')

        return
      }

      setState('clocking_in')
      const res = await clockInWithQr({ locationId, token })

      if (res?.serverError) {
        setState('error')
        setErrorMsg(res.serverError || 'Failed to clock in. Please try again.')
      } else {
        setState('success')
        setTimeout(() => router.push('/dashboard'), 3000)
      }
    }

    run()
  }, [params, router])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.07)_0%,transparent_70%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm"
      >
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center">
          {state === 'loading' || state === 'clocking_in' ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
              <h1 className="text-white text-xl font-bold mb-2">
                {state === 'clocking_in' ? 'Clocking You In…' : 'Verifying…'}
              </h1>
              <p className="text-zinc-500 text-sm">Hold tight, we're verifying your QR code</p>
            </>
          ) : state === 'success' ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </motion.div>
              <h1 className="text-white text-xl font-bold mb-2">You're Clocked In!</h1>
              <p className="text-zinc-500 text-sm">Your shift has started. Have a great one 👋</p>
              <p className="text-zinc-600 text-xs mt-4">Redirecting to dashboard…</p>
            </>
          ) : state === 'already_clocked_in' ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-blue-400" />
              </div>
              <h1 className="text-white text-xl font-bold mb-2">Already On Shift</h1>
              <p className="text-zinc-500 text-sm mb-6">You're already clocked in at this location.</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-3 rounded-xl bg-zinc-800 text-white font-medium text-sm hover:bg-zinc-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </>
          ) : state === 'needs_auth' ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-amber-400" />
              </div>
              <h1 className="text-white text-xl font-bold mb-2">Sign In Required</h1>
              <p className="text-zinc-500 text-sm mb-6">You need to be signed in to clock in via QR.</p>
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 transition-colors"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-rose-400" />
              </div>
              <h1 className="text-white text-xl font-bold mb-2">Clock-In Failed</h1>
              <p className="text-zinc-500 text-sm mb-6">{errorMsg}</p>
              <button
                onClick={() => router.back()}
                className="w-full py-3 rounded-xl bg-zinc-800 text-white font-medium text-sm hover:bg-zinc-700 transition-colors"
              >
                Try Again
              </button>
            </>
          )}
        </div>

        {/* OurMenu branding */}
        <p className="text-zinc-600 text-xs text-center mt-6">Powered by OurMenu OS</p>
      </motion.div>
    </div>
  )
}
