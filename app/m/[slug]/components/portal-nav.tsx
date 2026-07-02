'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Grid, ChevronLeft } from 'lucide-react'
import { useEffect, useState } from 'react'

interface PortalNavProps {
  slug: string
  portalName: string
}

export function PortalNav({ slug, portalName }: PortalNavProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)

  useEffect(() => {
    // Small delay before showing it so it doesn't jarringly pop in immediately on load
    const timer = setTimeout(() => setIsVisible(true), 1000)
    
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 100)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-4 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4"
        >
          <Link
            href={`/m/${slug}`}
            className={`
              pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full 
              backdrop-blur-xl border shadow-lg transition-all duration-300
              ${hasScrolled 
                ? 'bg-black/60 border-white/10 text-white shadow-black/50 hover:bg-black/80' 
                : 'bg-white/90 border-black/5 text-black shadow-black/10 hover:bg-white'}
            `}
          >
            <ChevronLeft className="w-4 h-4 opacity-70" />
            <Grid className="w-4 h-4" />
            <span className="text-sm font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] sm:max-w-[200px]">
              {portalName}
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
