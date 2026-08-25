'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

const DISMISSAL_KEY = 'ourmenu_pwa_prompt_dismissed_until'
const COOLDOWN_DAYS = 30

export function PwaInstallPrompt() {
  const pathname = usePathname()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  // Don't show intrusive prompts on guest storefronts or the dedicated download page
  const isExcludedRoute = pathname?.startsWith('/m/') || pathname === '/download'

  useEffect(() => {
    if (isExcludedRoute) return

    // Detect if already installed / running in standalone mode
    if (
      window.matchMedia('(display-mode: standalone)').matches || 
      ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone)
    ) {
      Promise.resolve().then(() => setIsStandalone(true))
      return
    }

    // Check 30-day dismissal cooldown
    try {
      const dismissedUntil = localStorage.getItem(DISMISSAL_KEY)
      if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
        return
      }
    } catch {
      // Storage blocked
    }

    // Detect iOS
    const ua = window.navigator.userAgent
    const ios = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window)
    Promise.resolve().then(() => setIsIos(ios))

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      const timer = setTimeout(() => setShowPrompt(true), 5000)
      return () => clearTimeout(timer)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Discreet timer for iOS
    let iosTimer: NodeJS.Timeout | null = null
    if (ios) {
      iosTimer = setTimeout(() => setShowPrompt(true), 6000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      if (iosTimer) clearTimeout(iosTimer)
    }
  }, [isExcludedRoute])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      dismiss(365) // Dismiss for 1 year if accepted
    } else {
      dismiss(COOLDOWN_DAYS)
    }
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const dismiss = (days = COOLDOWN_DAYS) => {
    setShowPrompt(false)
    try {
      const expiry = Date.now() + days * 24 * 60 * 60 * 1000
      localStorage.setItem(DISMISSAL_KEY, String(expiry))
    } catch {}
  }

  if (isStandalone || !showPrompt || isExcludedRoute) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 150, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 150, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl p-4 flex gap-4"
      >
        <button
          onClick={() => dismiss()}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          aria-label="Dismiss installation prompt"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        
        <div className="w-11 h-11 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-inner shrink-0 text-white">
          <Download className="w-5 h-5" />
        </div>
        
        <div className="flex-1 space-y-2">
          <div>
            <h3 className="text-sm font-bold text-white">Install OurMenu OS</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Launch faster with offline resilience, push notifications, and zero browser chrome.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {!isIos && deferredPrompt ? (
              <button
                onClick={handleInstallClick}
                className="flex-1 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200 transition-colors text-center"
              >
                Install Now
              </button>
            ) : null}
            <Link
              href="/download"
              onClick={() => dismiss(7)}
              className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium rounded-lg transition-colors text-center"
            >
              View Instructions
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
