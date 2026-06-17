'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Detect if already installed/standalone
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsStandalone(true)
      return
    }

    // Detect iOS for manual instruction fallback
    const ua = window.navigator.userAgent
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
    setIsIos(ios)

    // Listen for the install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Don't show immediately every time, maybe delay or check session
      if (!sessionStorage.getItem('pwa_prompt_dismissed')) {
        setTimeout(() => setShowPrompt(true), 3000) // Show after 3 seconds
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Also show for iOS users since they don't get the beforeinstallprompt event natively on Safari
    if (ios && !sessionStorage.getItem('pwa_prompt_dismissed')) {
      setTimeout(() => setShowPrompt(true), 3000)
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('User accepted the A2HS prompt')
    }
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const dismiss = () => {
    setShowPrompt(false)
    sessionStorage.setItem('pwa_prompt_dismissed', 'true')
  }

  if (isStandalone || !showPrompt) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 150, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 150, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-4 flex gap-4"
      >
        <button
          onClick={dismiss}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
        
        <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-inner shrink-0">
          <Download className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white mb-1">Install OurMenu App</h3>
          {isIos ? (
            <p className="text-xs text-zinc-400 leading-relaxed mb-2">
              Tap the <b>Share</b> icon below and select <b>"Add to Home Screen"</b> for the full experience.
            </p>
          ) : (
            <p className="text-xs text-zinc-400 leading-relaxed mb-3">
              Install the app for faster access, offline support, and push notifications.
            </p>
          )}

          {!isIos && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="w-full py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Install Now
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
