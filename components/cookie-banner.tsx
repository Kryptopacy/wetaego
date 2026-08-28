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
      <div className="bg-[#0c0d0e]/95 border border-emerald-500/20 rounded-2xl p-5 shadow-2xl shadow-black/90 backdrop-blur-xl ring-1 ring-emerald-500/10">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 className="text-sm font-bold text-white tracking-tight">Cookie & Privacy Preferences</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We use essential cookies to maintain your session, secure checkout, and enable offline queueing. We also collect anonymized analytics to improve platform performance.
            </p>
          </div>
          <button 
            onClick={handleAcceptEssential}
            className="text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-lg transition-colors p-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 pt-3.5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link href="/privacy" className="text-xs text-zinc-400 hover:text-emerald-400 underline underline-offset-4 decoration-zinc-700 transition-colors">
            Read Privacy Policy
          </Link>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleAcceptEssential}
              className="w-full sm:w-auto px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
            >
              Essential Only
            </button>
            <button
              onClick={handleAcceptAll}
              className="w-full sm:w-auto px-4 py-1.5 text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
