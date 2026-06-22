'use client'

import { motion } from 'framer-motion'

interface GlobalDiscountBannerProps {
  bannerText: string
  percentage: number
}

export function GlobalDiscountBanner({ bannerText, percentage }: GlobalDiscountBannerProps) {
  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }} 
      transition={{ type: 'spring', damping: 20 }}
      className="mb-6 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 p-4 shadow-lg flex items-center gap-4 text-white"
    >
      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      </div>
      <div>
        <h3 className="font-bold text-lg leading-tight">{bannerText}</h3>
        {percentage > 0 && (
          <p className="text-white/80 text-sm">{percentage}% off applied automatically at checkout.</p>
        )}
      </div>
    </motion.div>
  )
}

