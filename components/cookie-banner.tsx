'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    try {
      const consent = localStorage.getItem('ourmenu_cookie_consent')
      if (!consent) {
        const timer = setTimeout(() => setIsVisible(true), 1500)
        return () => clearTimeout(timer)
      }
    } catch {
      // Storage unavailable (e.g. strict incognito)
    }
  }, [])

  const handleAcceptAll = () => {
    try {
      localStorage.setItem('ourmenu_cookie_consent', JSON.stringify({
        essential: true,
        analytics: true,
        timestamp: new Date().toISOString(),
      }))
    } catch {}
    setIsVisible(false)
  }

  const handleAcceptEssential = () => {
    try {
      localStorage.setItem('ourmenu_cookie_consent', JSON.stringify({
        essential: true,
        analytics: false,
        timestamp: new Date().toISOString(),
      }))
    } catch {}
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <aside 
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[999] animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-5 shadow-2xl shadow-black/80 backdrop-blur-xl">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 className="text-sm font-semibold text-white">Cookie & Privacy Preferences</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We use essential cookies to maintain your session, secure checkout, and enable offline queueing. We also collect anonymized analytics to improve platform performance.
            </p>
          </div>
          <button 
            onClick={handleAcceptEssential}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <Link href="/privacy" className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2">
            Read Privacy Policy
          </Link>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleAcceptEssential}
              className="w-full sm:w-auto px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Essential Only
            </button>
            <button
              onClick={handleAcceptAll}
              className="w-full sm:w-auto px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
