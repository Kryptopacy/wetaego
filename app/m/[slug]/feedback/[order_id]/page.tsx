'use client'

import { use } from 'react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { submitFeedbackAndTip } from './actions'
import { openSeamlessCheckout, preloadBachsSdk } from '@/components/bachs-overlay-checkout'
import { Star, MessageSquareHeart, Heart, Sparkles, CheckCircle2, ArrowLeft, ThumbsUp, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const SENTIMENT_LABELS: Record<number, string> = {
  1: 'Needs Improvement 😕',
  2: 'Fair Experience 😐',
  3: 'Good & Enjoyable 🙂',
  4: 'Great Experience! 😊',
  5: 'Exceptional & Flawless! 🌟',
}

const TAG_OPTIONS = [
  '✨ Exceptional Quality',
  '⚡ Fast Service',
  '🍸 Delicious Drinks',
  '👋 Friendly & Attentive Staff',
  '🎵 Great Atmosphere & Music',
  '💎 Beautiful Presentation',
  '💰 Great Value',
  '⏳ Could Be Faster',
  '🔊 Music Too Loud',
]

export default function FeedbackPage({
  params
}: {
  params: Promise<{ slug: string, order_id: string }>
}) {
  const { slug, order_id } = use(params)
  const isGeneral = order_id === 'general'
  
  const [venue, setVenue] = useState<{ name: string; theme_color?: string; currency?: string } | null>(null)
  const [businessRating, setBusinessRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [businessFeedback, setBusinessFeedback] = useState('')
  
  const [staffRating, setStaffRating] = useState(0)
  const [staffFeedback, setStaffFeedback] = useState('')

  const [tipSelection, setTipSelection] = useState<'0' | '10' | '15' | '20' | 'custom'>('0')
  const [customTip, setCustomTip] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [locationId, setLocationId] = useState<string | null>(null)

  useEffect(() => {
    preloadBachsSdk()
    const supabase = createClient()
    supabase
      .from('locations')
      .select('id, name, portal_display_name, theme_color, currency_code')
      .eq('slug', slug)
      .single()
      .then(({ data }) => {
        if (data) {
          setVenue({
            name: data.portal_display_name || data.name,
            theme_color: data.theme_color || '#10b981',
            currency: data.currency_code || 'USD'
          })
          if (!locationId) setLocationId(data.id)
        }
      })
  }, [slug, locationId])

  useEffect(() => {
    if (isGeneral) {
      const urlParams = new URLSearchParams(window.location.search)
      const loc = urlParams.get('location_id') || urlParams.get('loc')
      if (loc) setLocationId(loc)
    }
  }, [isGeneral])

  function toggleTag(tag: string) {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleFeedbackSubmit = async () => {
    if (businessRating === 0 && staffRating === 0 && tipSelection === '0' && selectedTags.length === 0 && !businessFeedback.trim()) {
      toast.error('Please select a star rating or feedback tag before submitting.')
      return
    }

    setIsSubmitting(true)
    try {
      const formattedFeedback = selectedTags.length > 0 
        ? `[Tags: ${selectedTags.join(', ')}] ${businessFeedback.trim()}`
        : businessFeedback.trim()

      const { checkoutUrl, error } = await submitFeedbackAndTip(
        slug,
        isGeneral ? null : order_id,
        locationId,
        staffRating,
        staffFeedback,
        businessRating,
        formattedFeedback,
        tipSelection,
        customTip
      )

      if (error) {
        toast.error(error)
        return
      }

      if (checkoutUrl) {
        openSeamlessCheckout(checkoutUrl)
      } else {
        setSubmitted(true)
        toast.success('Thank you for sharing your experience!')
      }
    } catch (_e) {
      toast.error('Something went wrong submitting your review.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const themeColor = venue?.theme_color || '#10b981'

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md bg-zinc-900/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl text-center space-y-6"
        >
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Thank You!</h1>
            <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
              Your feedback for <span className="text-white font-semibold">{venue?.name || 'our team'}</span> has been received. We take every note to heart to ensure an extraordinary experience.
            </p>
          </div>
          <button 
            onClick={() => window.location.href = `/m/${slug}`}
            className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/10 transition-all cursor-pointer"
          >
            Return to Storefront
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: themeColor }}
      />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg bg-zinc-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl relative z-10 space-y-8"
      >
        {/* Header with Venue Info */}
        <div className="text-center space-y-2 pb-6 border-b border-white/5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-400 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Verified Guest Review</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            How was your experience?
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm">
            Reviewing <span className="text-white font-semibold">{venue?.name || 'Venue'}</span>
          </p>
        </div>

        {/* ── 1. Star Rating with Dynamic Sentiment ── */}
        <div className="space-y-4 text-center">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 block">
            Overall Rating
          </label>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = (hoverRating || businessRating) >= star
              return (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setBusinessRating(star)}
                  className="p-2 transition-transform hover:scale-120 active:scale-95 cursor-pointer"
                  aria-label={`Rate ${star} star`}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      isFilled
                        ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                        : 'text-zinc-700'
                    }`}
                  />
                </button>
              )
            })}
          </div>
          {(hoverRating > 0 || businessRating > 0) && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-bold text-amber-400 tracking-wide"
            >
              {SENTIMENT_LABELS[hoverRating || businessRating]}
            </motion.p>
          )}
        </div>

        {/* ── 2. 1-Click Sentiment Tags ── */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 block text-center">
            Highlights & Feedback Tags
          </label>
          <div className="flex flex-wrap gap-2 justify-center">
            {TAG_OPTIONS.map((tag) => {
              const isSelected = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-700/60'
                  }`}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── 3. Written Review / Suggestions ── */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 block">
            Detailed Thoughts (Optional)
          </label>
          <textarea
            rows={3}
            value={businessFeedback}
            onChange={(e) => setBusinessFeedback(e.target.value)}
            placeholder="Tell us what you loved, or what we can do better next time..."
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl px-4 py-3 text-white text-xs sm:text-sm outline-none focus:border-emerald-500 transition-colors resize-none placeholder:text-zinc-600"
            maxLength={1000}
          />
        </div>

        {/* ── 4. Staff Rating & Tip (If linked to order) ── */}
        {!isGeneral && (
          <div className="space-y-5 pt-6 border-t border-white/5">
            <div className="text-center space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 block">
                Server / Staff Attentiveness
              </label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={`staff-${star}`}
                    type="button"
                    onClick={() => setStaffRating(star)}
                    className="p-1.5 transition-transform hover:scale-115 active:scale-95"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        staffRating >= star
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-zinc-800'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Tip Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 block text-center">
                Add a Tip for Exceptional Service
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { val: '0', label: 'None' },
                  { val: '10', label: '10%' },
                  { val: '15', label: '15%' },
                  { val: '20', label: '20%' },
                  { val: 'custom', label: 'Custom' }
                ].map(btn => (
                  <button
                    key={btn.val}
                    type="button"
                    onClick={() => setTipSelection(btn.val as typeof tipSelection)}
                    className={`py-2 text-xs rounded-xl font-bold transition-all border ${
                      tipSelection === btn.val
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20'
                        : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {tipSelection === 'custom' && (
                <input 
                  type="number" 
                  min="0"
                  step="1"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                  placeholder={`Enter amount in ${venue?.currency || 'USD'}`}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                />
              )}
            </div>
          </div>
        )}

        {/* ── Submit CTA Bar ── */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          <button 
            type="button"
            onClick={handleFeedbackSubmit}
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <span>Submitting Review...</span>
            ) : tipSelection !== '0' ? (
              <span>Submit Feedback & Pay Tip</span>
            ) : (
              <span>Submit Feedback</span>
            )}
          </button>
          <button 
            type="button"
            onClick={() => window.location.href = `/m/${slug}`}
            className="w-full py-2 text-zinc-500 text-xs font-medium hover:text-zinc-300 transition-colors"
          >
            Skip & Return to Storefront
          </button>
        </div>
      </motion.div>
    </div>
  )
}
