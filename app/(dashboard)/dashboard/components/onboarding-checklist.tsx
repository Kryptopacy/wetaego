'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, ArrowRight, X } from 'lucide-react'
import Link from 'next/link'

interface OnboardingProps {
  hasOrg: boolean
  hasLocation: boolean
  hasMenu: boolean
  hasQR: boolean
  templateType: string
}

export function OnboardingChecklist({ hasOrg, hasLocation, hasMenu, hasQR, templateType }: OnboardingProps) {
  const [dismissed, setDismissed] = useState(true) // Default true to avoid SSR flicker
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isDismissed = localStorage.getItem('ourmenu_onboarding_dismissed_v1') === 'true'
    setDismissed(isDismissed)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('ourmenu_onboarding_dismissed_v1', 'true')
    setDismissed(true)
  }

  // Dynamic terminology mapping
  let itemNoun = 'menu items'
  let itemTitle = 'Create your catalog'
  let itemDesc = 'Add your first menu items, products, or services.'
  let qrTitle = 'Generate QR codes'
  let qrDesc = 'Print QR codes for your tables or storefront.'

  if (templateType === 'rate_card') {
    itemNoun = 'services'
    itemTitle = 'Create your rate card'
    itemDesc = 'Add your service offerings and consulting packages.'
    qrTitle = 'Share your digital card'
    qrDesc = 'Get your personal QR code for networking.'
  } else if (templateType === 'booking') {
    itemNoun = 'bookable services'
    itemTitle = 'Set up services'
    itemDesc = 'Add your available services and booking durations.'
  } else if (templateType === 'listing') {
    itemNoun = 'listings'
    itemTitle = 'Create listings'
    itemDesc = 'Add your available properties, vehicles, or items.'
    qrTitle = 'Print listing signs'
    qrDesc = 'Generate QR codes for physical property signs.'
  }

  const steps = [
    {
      id: 'org',
      title: 'Set up your organization',
      description: 'Create your business profile to get started.',
      isComplete: hasOrg,
      href: '/dashboard/settings',
    },
    {
      id: 'location',
      title: 'Add a location',
      description: 'Where is your business located?',
      isComplete: hasLocation,
      href: '/dashboard/properties',
    },
    {
      id: 'menu',
      title: itemTitle,
      description: itemDesc,
      isComplete: hasMenu,
      href: '/dashboard/menu',
    },
    {
      id: 'qr',
      title: qrTitle,
      description: qrDesc,
      isComplete: hasQR,
      href: '/dashboard/qr',
    },
  ]

  const completedCount = steps.filter((s) => s.isComplete).length
  const progress = (completedCount / steps.length) * 100

  // Hide entirely if fully complete, not mounted yet, or user dismissed it (only if they have an org)
  if (!mounted || completedCount === steps.length || (dismissed && hasOrg)) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-800/80 rounded-2xl p-6 md:p-8 mb-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          {hasOrg && (
            <button 
              onClick={handleDismiss}
              className="absolute top-0 right-0 text-zinc-500 hover:text-white bg-zinc-900 hover:bg-zinc-800 p-2 rounded-full transition-colors flex items-center justify-center gap-2 group"
              title="Skip for now"
            >
              <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute right-10 whitespace-nowrap">Skip for now</span>
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="mb-6 pr-12">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Welcome to OurMenu OS</h2>
            <p className="text-zinc-400">
              {hasOrg 
                ? `Complete these final steps to launch your digital storefront. You can always dismiss this and finish later.` 
                : `Just one quick step to create your workspace. You can complete the rest of the setup at your own pace.`}
            </p>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-zinc-300">Setup Progress</span>
              <span className="text-sm font-bold text-violet-400">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((step, index) => {
              const isActive = index === completedCount // The current step to focus on
              return (
                <Link key={step.id} href={step.href}>
                  <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 ${
                    step.isComplete 
                      ? 'bg-emerald-950/20 border-emerald-900/30 opacity-70' 
                      : isActive 
                        ? 'bg-violet-950/20 border-violet-500/30 hover:border-violet-500/60 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                        : 'bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700'
                  }`}>
                    <div className="mt-0.5 flex-shrink-0">
                      {step.isComplete ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <Circle className={`w-6 h-6 ${isActive ? 'text-violet-400' : 'text-zinc-600'}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-1 ${step.isComplete ? 'text-emerald-100' : isActive ? 'text-white' : 'text-zinc-300'}`}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-zinc-500">{step.description}</p>
                    </div>
                    {!step.isComplete && isActive && (
                      <ArrowRight className="w-5 h-5 text-violet-400 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
