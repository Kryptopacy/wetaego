'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
const PaymentRouletteModal = dynamic(() => import('@/components/payment-roulette-modal').then(mod => mod.PaymentRouletteModal), { ssr: false })

export function RouletteFAB() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setIsMounted(true), [])

  if (!isMounted) return null

  return (
    <>
      {isOpen && <PaymentRouletteModal isOpen={isOpen} onClose={() => setIsOpen(false)} />}
      
      <motion.button 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-[45] h-14 w-14 rounded-full bg-zinc-900 border border-zinc-700 shadow-xl flex items-center justify-center text-purple-400 transition-colors group"
        aria-label={isOpen ? "Close roulette" : "Open roulette"}
      >
        <span className="absolute right-[115%] whitespace-nowrap bg-zinc-800 text-white font-semibold text-[13px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          Roulette
        </span>
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        )}
      </motion.button>
    </>
  )
}
