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
        className="fixed bottom-40 right-6 z-40 pointer-events-none"
      >
        <button
          onClick={() => window.location.href = `/m/${slug}/feedback/general?location_id=${locationId}`}
          className="pointer-events-auto bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border border-zinc-800 dark:border-zinc-200 shadow-xl rounded-full p-4 hover:scale-105 active:scale-95 transition-all group flex items-center justify-center relative overflow-hidden"
          aria-label="Leave Feedback or Tip"
        >
          <div className="absolute inset-0 bg-theme/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <MessageSquareHeart className="w-6 h-6 relative z-10" />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
