'use client'

import { use } from 'react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { submitFeedbackAndTip } from './actions'
import { openSeamlessCheckout, preloadBachsSdk } from '@/components/bachs-overlay-checkout'
import { 
  Star, 
  Sparkles, 
  CheckCircle2, 
  Heart, 
  Receipt, 
  MessageCircle, 
  ExternalLink,
  Copy,
  ShieldCheck,
  Award
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const SENTIMENT_LABELS: Record<number, { text: string; color: string; emoji: string }> = {
  1: { text: 'Needs Improvement', color: 'text-rose-400', emoji: '😕' },
  2: { text: 'Fair Experience', color: 'text-amber-400', emoji: '😐' },
  3: { text: 'Good & Enjoyable', color: 'text-yellow-400', emoji: '🙂' },
  4: { text: 'Great Experience!', color: 'text-emerald-400', emoji: '😊' },
  5: { text: 'Exceptional & Flawless!', color: 'text-emerald-300', emoji: '🌟' },
}

const TAG_OPTIONS = [
  '✨ Exceptional Food Quality',
  '⚡ Lightning-Fast Service',
  '🍸 Delicious Drinks & Cocktails',
  '👋 Friendly & Attentive Staff',
  '🎵 Perfect Atmosphere & Music',
  '💎 Beautiful Presentation',
  '💰 Great Value for Money',
  '🧼 Sparkling Clean & Hygienic',
  '⏳ Could Be Faster',
  '🔊 Music Too Loud',
]

interface OrderSummary {
  id: string
  total_amount_minor: number
  table_identifier?: string | null
  assigned_staff_id?: string | null
  customer_name?: string | null
  order_items?: { item_name: string; quantity: number }[]
}

interface VenueDetails {
  id: string
  name: string
  theme_color?: string
  currency?: string
  google_maps_url?: string | null
  whatsapp_number?: string | null
  phone_number?: string | null
}

export default function FeedbackPage({
  params
}: {
  params: Promise<{ slug: string; order_id: string }>
}) {
  const { slug, order_id } = use(params)
  const isGeneral = order_id === 'general'
  
  const [venue, setVenue] = useState<VenueDetails | null>(null)
  const [orderDetails, setOrderDetails] = useState<OrderSummary | null>(null)
  
  const [businessRating, setBusinessRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [businessFeedback, setBusinessFeedback] = useState('')
  
  const [staffRating, setStaffRating] = useState(0)
  const [staffHoverRating, setStaffHoverRating] = useState(0)
  const [serverName, setServerName] = useState('')
  const [staffFeedback, setStaffFeedback] = useState('')

  const [tipSelection, setTipSelection] = useState<'0' | string>('0')
  const [customTip, setCustomTip] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [copiedReview, setCopiedReview] = useState(false)
  const [locationId, setLocationId] = useState<string | null>(null)

  const currencySymbol = venue?.currency === 'USD' ? '$' : '₦'

  useEffect(() => {
    preloadBachsSdk()
    const supabase = createClient()
    
    // 1. Fetch Venue Info
    supabase
      .from('locations')
      .select('id, name, portal_display_name, theme_color, currency_code, google_maps_url, whatsapp_number, phone_number')
      .eq('slug', slug)
      .single()
      .then(({ data }) => {
        if (data) {
          setVenue({
            id: data.id,
            name: data.portal_display_name || data.name,
            theme_color: data.theme_color || '#0f7b55',
            currency: data.currency_code || 'NGN',
            google_maps_url: (data as Record<string, unknown>).google_maps_url as string | null,
            whatsapp_number: (data as Record<string, unknown>).whatsapp_number as string | null,
            phone_number: (data as Record<string, unknown>).phone_number as string | null
          })
          if (!locationId) setLocationId(data.id)
        }
      })

    // 2. If Order-Linked, Fetch Order Breakdown
    if (!isGeneral) {
      supabase
        .from('orders')
        .select('id, total_amount_minor, table_identifier, assigned_staff_id, customer_name, order_items(item_name, quantity)')
        .eq('id', order_id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setOrderDetails(data as unknown as OrderSummary)
          }
        })
    }
  }, [slug, order_id, isGeneral, locationId])

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

  // Calculate live computed tip
  const calculatedTipAmount = (): number => {
    if (tipSelection === '0') return 0
    if (tipSelection === 'custom') {
      return parseFloat(customTip || '0') || 0
    }
    if (orderDetails && ['10', '15', '20'].includes(tipSelection)) {
      return Math.round((orderDetails.total_amount_minor / 100) * (parseInt(tipSelection) / 100))
    }
    return parseFloat(tipSelection) || 0
  }

  const handleFeedbackSubmit = async () => {
    if (businessRating === 0 && staffRating === 0 && tipSelection === '0' && selectedTags.length === 0 && !businessFeedback.trim()) {
      toast.error('Please select a star rating or feedback tag before submitting.')
      return
    }

    setIsSubmitting(true)
    try {
      const formattedFeedback = [
        selectedTags.length > 0 ? `[Tags: ${selectedTags.join(', ')}]` : '',
        serverName.trim() ? `[Staff: ${serverName.trim()}]` : '',
        businessFeedback.trim()
      ].filter(Boolean).join(' ')

      const combinedStaffFeedback = [
        serverName.trim() ? `Staff Named: ${serverName.trim()}` : '',
        staffFeedback.trim()
      ].filter(Boolean).join(' - ')

      const { checkoutUrl, error } = await submitFeedbackAndTip(
        slug,
        isGeneral ? null : order_id,
        locationId,
        staffRating,
        combinedStaffFeedback,
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

  const handleCopyReview = () => {
    const textToCopy = businessFeedback.trim() || `5-star experience at ${venue?.name || 'this venue'}! Highly recommended.`
    navigator.clipboard.writeText(textToCopy)
    setCopiedReview(true)
    toast.success('Review text copied to clipboard!')
    setTimeout(() => setCopiedReview(false), 3000)
  }

  const themeColor = venue?.theme_color || '#0f7b55'
  const activeTip = calculatedTipAmount()

  // ── Post-Submission Success State ──────────────────────────────────────────
  if (submitted) {
    const isFiveStar = businessRating === 5 || staffRating === 5
    const isLowRating = (businessRating > 0 && businessRating <= 2) || (staffRating > 0 && staffRating <= 2)

    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: themeColor }}
        />

        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md bg-zinc-900/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl text-center space-y-6 relative z-10"
        >
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">Review Received!</h1>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Your feedback for <span className="text-white font-semibold">{venue?.name || 'our team'}</span> is logged. Every detail helps us maintain extraordinary hospitality.
            </p>
          </div>

          {/* 🌟 5-Star Viral Elevation: 1-Tap Google Review */}
          {isFiveStar && venue?.google_maps_url && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3 text-left"
            >
              <div className="flex items-center gap-2 text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Share the Love Publicly</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Loved your visit? Help other guests discover <span className="text-white font-medium">{venue.name}</span> by pasting your review on Google Maps!
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleCopyReview}
                  className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-zinc-700 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedReview ? 'Copied!' : 'Copy Review'}
                </button>
                <a
                  href={venue.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-md shadow-amber-500/20"
                >
                  Open Google <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          )}

          {/* 💬 1-2 Star Private Management Recovery */}
          {isLowRating && (venue?.whatsapp_number || venue?.phone_number) && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-3 text-left"
            >
              <div className="flex items-center gap-2 text-rose-400">
                <Heart className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Direct Management Care</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                We sincerely apologize that your experience fell short. Our general manager is available directly to make things right for you immediately.
              </p>
              {venue.whatsapp_number && (
                <a
                  href={`https://wa.me/${venue.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I just left feedback for my visit at ${venue.name} and would like to speak with management.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat Directly on WhatsApp
                </a>
              )}
            </motion.div>
          )}

          <button 
            onClick={() => window.location.href = `/m/${slug}`}
            className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm border border-white/10 transition-all cursor-pointer"
          >
            Return to Storefront
          </button>
        </motion.div>
      </div>
    )
  }

  // ── Main Review & Tip Form ──────────────────────────────────────────────────
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
        className="w-full max-w-lg bg-zinc-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl relative z-10 space-y-7"
      >
        {/* Header with Venue Info & Verified Badge */}
        <div className="text-center space-y-2 pb-5 border-b border-white/5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-400 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Verified Guest Review &amp; Gratuity</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            How was your visit?
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm">
            Reviewing <span className="text-white font-semibold">{venue?.name || 'Venue'}</span>
          </p>

          {/* Order Details Badge if Linked */}
          {orderDetails && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-xs text-zinc-300">
              <Receipt className="w-3.5 h-3.5 text-emerald-400" />
              <span>Order #{orderDetails.id.slice(0, 8)}</span>
              {orderDetails.table_identifier && <span>• Table {orderDetails.table_identifier}</span>}
              <span className="font-semibold text-white">
                • {currencySymbol}{(orderDetails.total_amount_minor / 100).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* ── 1. Overall Rating with Dynamic Sentiment ── */}
        <div className="space-y-3 text-center">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 block">
            Overall Experience
          </label>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const activeVal = hoverRating || businessRating
              const isFilled = activeVal >= star
              return (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setBusinessRating(star)}
                  className="p-1.5 sm:p-2 transition-transform hover:scale-125 active:scale-95 cursor-pointer"
                  aria-label={`Rate ${star} star`}
                >
                  <Star
                    className={`w-7 h-7 sm:w-8 sm:h-8 transition-all ${
                      isFilled
                        ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                        : 'text-zinc-700 hover:text-zinc-500'
                    }`}
                  />
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            {(hoverRating > 0 || businessRating > 0) && (
              <motion.div
                key={hoverRating || businessRating}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 ${
                  SENTIMENT_LABELS[hoverRating || businessRating]?.color || 'text-zinc-300'
                }`}
              >
                <span>{SENTIMENT_LABELS[hoverRating || businessRating]?.emoji}</span>
                <span>{SENTIMENT_LABELS[hoverRating || businessRating]?.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 2. 1-Click Highlights & Tags ── */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 block text-center">
            What Stood Out?
          </label>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
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

        {/* ── 3. Written Suggestions / Praise ── */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 block">
            Detailed Thoughts (Optional)
          </label>
          <textarea
            rows={3}
            value={businessFeedback}
            onChange={(e) => setBusinessFeedback(e.target.value)}
            placeholder="Tell us what you loved, or how we can make your next visit even more unforgettable..."
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl px-4 py-3 text-white text-xs sm:text-sm outline-none focus:border-emerald-500 transition-colors resize-none placeholder:text-zinc-600"
            maxLength={1000}
          />
        </div>

        {/* ── 4. Staff Rating & Tip Card ── */}
        <div className="p-5 bg-zinc-950/70 border border-white/5 rounded-2xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white">
                Staff &amp; Service Care
              </h3>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> 100% direct to service staff (0% platform fee)
            </span>
          </div>

          {/* Staff Attentiveness Stars */}
          <div className="space-y-2 text-center">
            <span className="text-xs text-zinc-400 block">
              Attendant / Specialist Friendliness &amp; Service
            </span>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const activeVal = staffHoverRating || staffRating
                return (
                  <button
                    key={`staff-${star}`}
                    type="button"
                    onMouseEnter={() => setStaffHoverRating(star)}
                    onMouseLeave={() => setStaffHoverRating(0)}
                    onClick={() => setStaffRating(star)}
                    className="p-1 transition-transform hover:scale-120 active:scale-95 cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 transition-all ${
                        activeVal >= star
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'text-zinc-800 hover:text-zinc-600'
                      }`}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Optional Staff / Attendant Name Shoutout */}
          <div>
            <input
              type="text"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="Attendant, Stylist, Specialist, or Server name (optional)"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500 transition"
              maxLength={100}
            />
          </div>

          {/* Tip Selection Grid */}
          <div className="space-y-2.5 pt-1">
            <span className="text-xs font-semibold text-zinc-300 block">
              Add a Gratuity / Tip
            </span>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {(orderDetails
                ? [
                    { val: '0', label: 'None' },
                    { 
                      val: '10', 
                      label: '10%', 
                      sub: `${currencySymbol}${Math.round((orderDetails.total_amount_minor / 100) * 0.1).toLocaleString()}` 
                    },
                    { 
                      val: '15', 
                      label: '15%', 
                      sub: `${currencySymbol}${Math.round((orderDetails.total_amount_minor / 100) * 0.15).toLocaleString()}` 
                    },
                    { 
                      val: '20', 
                      label: '20%', 
                      sub: `${currencySymbol}${Math.round((orderDetails.total_amount_minor / 100) * 0.2).toLocaleString()}` 
                    },
                    { val: 'custom', label: 'Custom' }
                  ]
                : [
                    { val: '0', label: 'None' },
                    { val: venue?.currency === 'USD' ? '5' : '500', label: venue?.currency === 'USD' ? '$5' : '₦500' },
                    { val: venue?.currency === 'USD' ? '10' : '1000', label: venue?.currency === 'USD' ? '$10' : '₦1k' },
                    { val: venue?.currency === 'USD' ? '25' : '2500', label: venue?.currency === 'USD' ? '$25' : '₦2.5k' },
                    { val: 'custom', label: 'Custom' }
                  ]
              ).map(btn => (
                <button
                  key={btn.val}
                  type="button"
                  onClick={() => setTipSelection(btn.val)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center cursor-pointer ${
                    tipSelection === btn.val
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/25 scale-[1.02]'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <span>{btn.label}</span>
                  {'sub' in btn && (
                    <span className={`text-[10px] font-normal ${tipSelection === btn.val ? 'text-emerald-100' : 'text-zinc-500'}`}>
                      {btn.sub}
                    </span>
                  )}
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
                placeholder={`Enter custom amount (${currencySymbol})`}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500 transition"
              />
            )}

            {activeTip > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between text-xs px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400"
              >
                <span>Selected Tip Amount:</span>
                <span className="font-bold">{currencySymbol}{activeTip.toLocaleString()}</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Submit Action Bar ── */}
        <div className="space-y-3 pt-2">
          <button 
            type="button"
            onClick={handleFeedbackSubmit}
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <span>Processing...</span>
            ) : activeTip > 0 ? (
              <span>Submit Feedback &amp; Pay {currencySymbol}{activeTip.toLocaleString()} Staff Tip</span>
            ) : (
              <span>Submit Feedback</span>
            )}
          </button>
          <button 
            type="button"
            onClick={() => window.location.href = `/m/${slug}`}
            className="w-full py-2 text-zinc-500 text-xs font-medium hover:text-zinc-300 transition-colors cursor-pointer"
          >
            Skip &amp; Return to Storefront
          </button>
        </div>
      </motion.div>
    </div>
  )
}
