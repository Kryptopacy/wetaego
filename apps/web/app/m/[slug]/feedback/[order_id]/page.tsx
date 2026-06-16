'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { submitFeedbackAndTip } from './actions'

export default function FeedbackPage({
  params
}: {
  params: { slug: string, order_id: string }
}) {
  const isGeneral = params.order_id === 'general'
  
  const [staffRating, setStaffRating] = useState(0)
  const [staffFeedback, setStaffFeedback] = useState('')
  
  const [businessRating, setBusinessRating] = useState(0)
  const [businessFeedback, setBusinessFeedback] = useState('')

  const [tipSelection, setTipSelection] = useState<'0' | '10' | '15' | '20' | 'custom'>('0')
  const [customTip, setCustomTip] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Quick info logic
  const [locationId, setLocationId] = useState<string | null>(null)

  useEffect(() => {
    if (isGeneral) {
      const urlParams = new URLSearchParams(window.location.search)
      setLocationId(urlParams.get('location_id'))
    }
  }, [isGeneral])

  const handleFeedbackSubmit = async () => {
    if (!isGeneral && staffRating === 0 && businessRating === 0 && tipSelection === '0') {
      toast.error('Please leave a rating or a tip to submit.')
      return
    }
    if (isGeneral && businessRating === 0) {
      toast.error('Please select a star rating for the business.')
      return
    }

    setIsSubmitting(true)
    try {
      const { checkoutUrl, error } = await submitFeedbackAndTip(
        params.slug,
        isGeneral ? null : params.order_id,
        locationId,
        staffRating,
        staffFeedback,
        businessRating,
        businessFeedback,
        tipSelection,
        customTip
      )

      if (error) {
        toast.error(error)
        return
      }

      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        setSubmitted(true)
        toast.success('Thank you for your feedback!')
      }
    } catch (e) {
      toast.error('Something went wrong submitting your review.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Thank You!</h1>
        <p className="text-zinc-400 text-center max-w-sm mb-8">
          Your feedback has been submitted successfully. We appreciate your business and hope to see you again soon.
        </p>
        <button 
          onClick={() => window.location.href = `/m/${params.slug}`}
          className="px-6 py-3 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors"
        >
          Return to Menu
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white">How was your experience?</h2>
          <p className="text-zinc-400 mt-2">Your honest feedback helps us improve.</p>
        </div>

        <div className="space-y-10">
          
          {/* BUSINESS RATING */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 text-center">Rate the Food & Restaurant</h3>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={`biz-${star}`}
                  onClick={() => setBusinessRating(star)}
                  className={`text-4xl transition-transform hover:scale-110 ${businessRating >= star ? 'text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'text-zinc-800'}`}
                >
                  ★
                </button>
              ))}
            </div>
            {businessRating > 0 && (
              <motion.textarea
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                value={businessFeedback}
                onChange={(e) => setBusinessFeedback(e.target.value)}
                placeholder="What did you love? What could be better?"
                className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 resize-none text-sm"
              />
            )}
          </div>

          {/* STAFF RATING & TIPPING (Only if tied to an order) */}
          {!isGeneral && (
            <div className="space-y-4 pt-6 border-t border-zinc-800/50">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 text-center">Rate your Waiter</h3>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={`staff-${star}`}
                    onClick={() => setStaffRating(star)}
                    className={`text-4xl transition-transform hover:scale-110 ${staffRating >= star ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'text-zinc-800'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {staffRating > 0 && (
                <motion.textarea
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  value={staffFeedback}
                  onChange={(e) => setStaffFeedback(e.target.value)}
                  placeholder="Any specific feedback for your waiter? (Optional)"
                  className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-500 resize-none text-sm"
                />
              )}

              <div className="pt-6">
                <label className="block text-sm font-medium text-zinc-300 mb-3 text-center">Leave a Tip for Flawless Service?</label>
                <div className="grid grid-cols-5 gap-2 mb-2">
                  {[
                    { val: '0', label: 'None' },
                    { val: '10', label: '10%' },
                    { val: '15', label: '15%' },
                    { val: '20', label: '20%' },
                    { val: 'custom', label: 'Custom' }
                  ].map(btn => (
                    <button
                      key={btn.val}
                      onClick={() => setTipSelection(btn.val as any)}
                      className={`py-2 text-sm rounded-lg font-medium transition-colors border ${tipSelection === btn.val ? 'bg-zinc-100 border-zinc-100 text-black' : 'bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
                {tipSelection === 'custom' && (
                  <motion.input 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    type="number" 
                    min="0"
                    step="100"
                    value={customTip}
                    onChange={(e) => setCustomTip(e.target.value)}
                    placeholder="Enter custom amount (₦)"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-zinc-500 mt-2"
                  />
                )}
              </div>
            </div>
          )}

          <div className="pt-6">
            <button 
              onClick={handleFeedbackSubmit}
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center disabled:opacity-50 hover:bg-blue-500 transition-colors"
            >
              {isSubmitting ? 'Submitting...' : (tipSelection !== '0' ? 'Submit & Pay Tip' : 'Submit Feedback')}
            </button>
            <button 
              onClick={() => window.location.href = `/m/${params.slug}`}
              className="w-full py-4 text-zinc-500 text-sm font-medium hover:text-zinc-300 transition-colors mt-2"
            >
              Skip & Return to Menu
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
