'use client'

import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(() => {
    if (typeof window !== 'undefined') return !window.navigator.onLine
    return false
  })

  useEffect(() => {

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-red-600 border-b border-red-700 text-white shadow-xl shadow-red-900/20"
        >
          <div className="max-w-md mx-auto flex items-center justify-center gap-3 px-4 py-3">
            <div className="bg-red-700/50 p-1.5 rounded-full">
              <WifiOff className="w-4 h-4" />
            </div>
            <p className="text-sm font-bold tracking-wide">
              You are currently offline. Checkout is disabled.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
