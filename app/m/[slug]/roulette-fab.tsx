'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useCartStore } from '@/lib/store/cart'

const PaymentRouletteModal = dynamic(() => import('@/components/payment-roulette-modal').then(mod => mod.PaymentRouletteModal), { ssr: false })

export function RouletteFAB() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const setSplit = useCartStore((state) => state.setSplit)
  
  useEffect(() => { Promise.resolve().then(() => setIsMounted(true)) }, [])

  if (!isMounted) return null

  return (
    <>
      {isOpen && (
        <PaymentRouletteModal 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)} 
          onSpinComplete={(count, type, shares) => setSplit(count, type, shares)}
        />
      )}
      
      <motion.button 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-45 h-14 w-14 rounded-full bg-zinc-900 border border-zinc-700 shadow-xl flex items-center justify-center text-emerald-400 transition-colors group"
        aria-label={isOpen ? "Close roulette" : "Open roulette"}
        aria-expanded={isOpen}
        aria-controls="payment-roulette-modal"
      >
        <span className="absolute right-[115%] whitespace-nowrap bg-zinc-800 text-white font-semibold text-[13px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          Roulette
        </span>
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
        )}
      </motion.button>
    </>
  )
}
