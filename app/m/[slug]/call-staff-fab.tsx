'use client'

import { useState, useEffect } from 'react'
import { submitServiceRequest } from './actions'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Megaphone, X } from 'lucide-react'

interface CallStaffFABProps {
  organizationId: string
  locationId: string
  tableIdentifier?: string
}

export function CallStaffFAB({ organizationId, locationId, tableIdentifier }: CallStaffFABProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [requestText, setRequestText] = useState('')
  const [tableNumber, setTableNumber] = useState(tableIdentifier || '')
  const [isCalling, setIsCalling] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    queueMicrotask(() => setIsMounted(true))
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Demo mode — skip server, show simulated feedback
    if (organizationId === 'demo-org') {
      toast.success('Demo: Staff has been notified (simulated) 🔊')
      setIsOpen(false)
      setRequestText('')
      return
    }

    if (!navigator.onLine) {
      toast.error("You're offline. Reconnect to call staff.", { id: 'offline-staff' })
      return
    }
    setIsCalling(true)
    
    const tableId = tableNumber || "Bar"
    
    try {
      // 1. Hybrid Triage: Check local keywords first to save AI costs
      let urgency_tier = 'standard'
      const request_type = 'custom'
      
      const emergencyKeywords = /spill|broken|fire|sick|emergency|hurt|cut|blood|glass|urgent/i
      const lowUrgencyKeywords = /napkin|water|menu|bill|check|plate|fork|knife|spoon|ketchup|salt|pepper|sauce/i

      if (emergencyKeywords.test(requestText)) {
        urgency_tier = 'critical'
      } else if (lowUrgencyKeywords.test(requestText)) {
        urgency_tier = 'low'
      } else if (requestText.split(/\\s+/).length > 3) {
        // Fallback to AI only for ambiguous, complex requests
        const triageRes = await fetch('/api/ai/triage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestText })
        })

        if (triageRes.ok) {
          const data = await triageRes.json()
          if (data.urgency_tier) urgency_tier = data.urgency_tier
        }
      }

      const formData = new FormData()
      formData.append('organization_id', organizationId)
      formData.append('location_id', locationId)
      formData.append('table_identifier', tableId)
      formData.append('request_type', request_type)
      formData.append('custom_request_text', requestText)
      formData.append('urgency_tier', urgency_tier)

      const res = await submitServiceRequest(formData)
      if (res?.serverError || res?.validationErrors) {
        throw new Error(res?.serverError || 'Failed to submit request')
      }
      
      if (urgency_tier === 'critical') {
        toast.error('Emergency request sent. Staff is rushing over!')
      } else {
        toast.success('Staff has been notified and is on the way.')
      }
      
      setIsOpen(false)
      setRequestText('')
    } catch (e) {
      console.error(e)
      toast.error('Failed to submit request. Please try again.')
    } finally {
      setIsCalling(false)
    }
  }

  if (!isMounted) return null

  return (
    <div className="pointer-events-auto relative z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9, x: 0 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 20, scale: 0.9, x: 0 }}
            className="fixed bottom-24 right-6 w-80 max-w-[calc(100vw-3rem)] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-5 overflow-hidden z-50"
            id="call-staff-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="call-staff-title"
          >
            <h3 id="call-staff-title" className="text-white font-bold mb-2">Request Service</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <textarea 
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                placeholder="How can we help? (e.g. Spill on table, Need bill)"
                required
                className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-blue-500 placeholder-zinc-600"
              />
              <input 
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Table Number (Optional)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-zinc-600"
              />
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isCalling || !requestText}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center transition-colors"
                >
                  {isCalling ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close Call Staff Menu" : "Call Staff"}
        aria-expanded={isOpen}
        aria-controls="call-staff-dialog"
        className="relative z-30 h-14 w-14 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl flex items-center justify-center text-[#17201b] dark:text-white transition-colors group"
      >
        <span className="absolute right-[115%] whitespace-nowrap bg-zinc-800 dark:bg-zinc-100 text-white dark:text-black font-semibold text-[13px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          Call Staff
        </span>
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Megaphone className="w-6 h-6" />
        )}
      </motion.button>
    </div>
  )
}
