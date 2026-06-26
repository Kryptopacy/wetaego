import { useOfflineQueueStore } from '@/lib/stores/offline-queue-store'
import { WifiOff, Activity } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

export function OfflineIndicator() {
  const queue = useOfflineQueueStore(state => state.queue)
  const pendingActions = queue.length
  const [isOffline, setIsOffline] = useState(() => 
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  )

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
      {(isOffline || pendingActions > 0) && (
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-full bg-black/40 backdrop-blur-md border border-zinc-700/50 shadow-2xl overflow-hidden"
        >
          {/* Subtle animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 animate-[pulse_3s_ease-in-out_infinite]" />
          
          <div className="relative flex items-center gap-3">
            {isOffline ? (
              <WifiOff className="w-4 h-4 text-orange-400 animate-pulse" />
            ) : (
              <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
            )}
            
            <span className="text-sm font-medium text-zinc-200">
              {isOffline ? 'Offline Mode' : 'Restoring Connection'}
            </span>
            
            {pendingActions > 0 && (
              <>
                <div className="w-1 h-1 rounded-full bg-zinc-600" />
                <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                  {pendingActions} action{pendingActions === 1 ? '' : 's'} pending
                </span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
