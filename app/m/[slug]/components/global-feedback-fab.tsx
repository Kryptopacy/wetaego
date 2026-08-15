'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquareHeart } from 'lucide-react'

export function GlobalFeedbackFAB({ locationId, slug }: { locationId: string, slug: string }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    queueMicrotask(() => setIsMounted(true))
  }, [])

  if (!isMounted) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed bottom-24 right-6 z-40 pointer-events-none"
      >
        <button
          onClick={() => window.location.href = `/m/${slug}/feedback/general?location_id=${locationId}`}
          className="pointer-events-auto bg-zinc-950/80 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-white/10 hover:border-white/25 shadow-2xl backdrop-blur-xl rounded-full p-3.5 hover:scale-105 active:scale-95 transition-all group flex items-center justify-center relative overflow-hidden"
          aria-label="Leave Feedback or Tip"
          title="Share Feedback"
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <MessageSquareHeart className="w-5 h-5 relative z-10 text-rose-400/90 group-hover:text-rose-300 transition-colors" />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
