'use client'

import { useState, useTransition } from 'react'
import { BackButton } from '../../../components/back-button'
import { InfoStrip } from '../../../components/info-strip'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils/currency'

interface PageItem {
  id: string
  title: string
  subtitle?: string
  description?: string
  price_minor?: number
  price_display?: string
  availability_status: string
  payment_mode?: string
  deposit_percentage?: number
  images?: string[]
  item_data?: {
    category?: string     // 'basic' | 'standard' | 'premium' | 'addon'
    includes?: string     // comma-separated list
    turnaround?: string   // e.g. "3-5 days"
    note?: string
  }
}

interface RateCardRendererProps {
  location: {
    id: string
    name: string
    theme_color?: string
    cover_image_url?: string
    instagram_handle?: string
    x_handle?: string
    tiktok_handle?: string
    whatsapp_number?: string
    phone_number?: string
    organizations?: { logo_url?: string }
    manual_payment_enabled?: boolean
    manual_payment_bank_name?: string
    manual_payment_account_name?: string
    manual_payment_account_number?: string
    manual_payment_instructions?: string
    currency?: string
  }
  page: {
    id: string
    title: string
    content?: string
    billing_enabled?: boolean
    payment_mode?: string
    deposit_percentage?: number
  }
  items: PageItem[]
  locationSlug: string
  referralSource?: string
  paymentIsLive?: boolean
}

const CATEGORY_ORDER = ['basic', 'standard', 'premium', 'addon']
const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  basic: { label: 'Basic', color: 'text-zinc-300', bg: 'bg-zinc-800/60' },
  standard: { label: 'Standard', color: 'text-blue-300', bg: 'bg-blue-500/10' },
  premium: { label: 'Premium', color: 'text-amber-300', bg: 'bg-amber-500/10' },
  addon: { label: 'Add-on', color: 'text-emerald-300', bg: 'bg-emerald-500/10' },
}

export function RateCardRenderer({ location, page, items, locationSlug, paymentIsLive }: RateCardRendererProps) {
  const themeColor = location.theme_color || '#7c3aed'

  const [selectedItems, setSelectedItems] = useState<PageItem[]>([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    booking_notes: '',
  })

  function handleToggleItem(item: PageItem) {
    setSelectedItems(prev => {
      if (prev.find(i => i.id === item.id)) return prev.filter(i => i.id !== item.id)
      return [...prev, item]
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedItems.length === 0 || !form.customer_name || !form.customer_phone) return

    startTransition(async () => {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_id: page.id,
          item_ids: selectedItems.map(i => i.id as string),
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          customer_phone: form.customer_phone,
          booking_notes: form.booking_notes,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.payment_url) {
          window.location.href = data.payment_url
        } else {
          setFormSuccess(true)
          setShowCheckout(false)
        }
      } else {
        toast.error('Something went wrong submitting your project request.')
      }
    })
  }

  // Calculate combined turnaround time safely
  const combinedTurnaround = selectedItems
    .map(i => i.item_data?.turnaround)
    .filter(Boolean)
    .join(' + ')

  // Group items by category dynamically
  const grouped: Record<string, PageItem[]> = {}
  const uncategorized: PageItem[] = []

  for (const item of items) {
    const cat = item.item_data?.category?.trim()
    if (cat) {
      grouped[cat] = [...(grouped[cat] || []), item]
    } else {
      uncategorized.push(item)
    }
  }

  // Sort groups: predefined first in CATEGORY_ORDER, then custom categories sorted alphabetically
  const customCategories = Object.keys(grouped)
    .filter(c => !CATEGORY_ORDER.includes(c))
    .sort()

  const sections = [
    ...CATEGORY_ORDER.filter(c => grouped[c]?.length > 0).map(c => ({ key: c, items: grouped[c] })),
    ...customCategories.map(c => ({ key: c, items: grouped[c] })),
    ...(uncategorized.length > 0 ? [{ key: 'other', items: uncategorized }] : []),
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans" style={{ backgroundColor: (page as any).background_color || undefined }}>
      {/* Hero */}
      <div className="relative w-full h-[40vh] min-h-[260px] max-h-[420px] overflow-hidden">
        {location.cover_image_url ? (
          <>
            <div className="absolute inset-0 bg-cover bg-top" style={{ backgroundImage: `url(${location.cover_image_url})` }} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${themeColor}30, #0a0a0f 60%)` }}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:30px_30px]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-2xl mx-auto flex items-end gap-4">
          {location.organizations?.logo_url && (
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black/40 p-1 border border-white/10">
              <Image src={location.organizations.logo_url} alt="" fill className="object-contain" sizes="64px" priority />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-lg">{page.title}</h1>
            <div className="flex gap-3 mt-2">
              {location.instagram_handle && (
                <a href={`https://instagram.com/${location.instagram_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-white/60 hover:text-white transition-colors">
                  @{location.instagram_handle.replace('@', '')}
                </a>
              )}
              {location.x_handle && (
                <a href={`https://x.com/${location.x_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-white/60 hover:text-white transition-colors">
                  𝕏 {location.x_handle}
                </a>
              )}
              {location.tiktok_handle && (
                <a href={`https://tiktok.com/@${location.tiktok_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-white/60 hover:text-white transition-colors">
                  🎵 {location.tiktok_handle}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <BackButton href={`/m/${locationSlug}`} className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {location.name}
          </BackButton>
          <button 
            onClick={() => window.print()}
            className="print:hidden inline-flex items-center gap-1.5 text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors border border-zinc-700 shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Save PDF / Print
          </button>
        </div>

        {/* Bio */}
        {page.content && (
          <div className="mb-8 text-zinc-400 text-sm leading-relaxed whitespace-pre-line">
            {page.content}
          </div>
        )}
        <InfoStrip location={location} />

        {/* Success state */}
        {formSuccess && (
          <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-white mb-2">Project Requested!</h2>
            <p className="text-zinc-400 text-sm mb-4">
              We have received your project requirements. We&apos;ll be in touch shortly.
            </p>
            <button onClick={() => { setFormSuccess(false); setSelectedItems([]) }} className="text-zinc-400 text-sm hover:text-white">
              ← View rate card
            </button>
          </div>
        )}

        {/* Rate sections */}
        <div className="space-y-8">
          {sections.map(({ key, items: sectionItems }) => {
            const isBuiltIn = CATEGORY_LABELS[key.toLowerCase()]
            const meta = isBuiltIn || { label: key, color: 'text-zinc-300', bg: 'bg-zinc-800/40' }
            return (
              <div key={key}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${meta.color} ${meta.bg} border border-white/5 capitalize`}>
                    {meta.label}
                  </span>
                  <div className="h-px flex-1 bg-zinc-800" />
                </div>
                <div className="space-y-3">
                  {sectionItems.map(item => {
                    const isSelected = selectedItems.some(i => i.id === item.id)
                    const isAvail = item.availability_status === 'available'
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => isAvail && handleToggleItem(item)}
                        className={`flex items-start gap-4 rounded-xl border transition-all p-4 ${!isAvail ? 'opacity-50 cursor-not-allowed border-zinc-800 bg-zinc-900/10' : isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 cursor-pointer'}`}
                      >
                        <div className={`mt-0.5 shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600 bg-zinc-800'}`}>
                          {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:justify-between gap-4">
                          <div className="flex gap-4 items-start">
                            {item.images?.[0] && (
                              <div className="w-[60px] h-[60px] shrink-0 rounded-lg overflow-hidden bg-zinc-800 relative block">
                                <Image src={item.images[0]} alt={item.title} fill className="object-cover" />
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-white text-sm">{item.title}</div>
                              {item.subtitle && <div className="text-xs text-zinc-500 mt-0.5">{item.subtitle}</div>}
                              {item.description && <div className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{item.description}</div>}
                              {item.item_data?.includes && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {item.item_data.includes.split(',').map((inc, i) => (
                                    <span key={i} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">✓ {inc.trim()}</span>
                                  ))}
                                </div>
                              )}
                              {item.item_data?.turnaround && (
                                <div className="text-xs text-zinc-500 mt-1.5">⏱ {item.item_data.turnaround}</div>
                              )}
                            </div>
                          </div>
                          <div className="text-left sm:text-right shrink-0">
                            {item.price_display ? (
                              <div className="font-bold text-white">{item.price_display}</div>
                            ) : item.price_minor ? (
                              <div className="font-bold text-white">{formatCurrency(item.price_minor, location.currency || 'NGN')}</div>
                            ) : (
                              <div className="text-xs text-zinc-500 italic">Price on request</div>
                            )}
                            {item.payment_mode === 'deposit' && item.deposit_percentage && (
                              <div className="text-[10px] text-amber-400 mt-0.5">{item.deposit_percentage}% deposit req.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Contact Strip */}
        {(location.whatsapp_number || location.phone_number || location.instagram_handle || location.x_handle || location.tiktok_handle) && (
          <div className="mt-12 pt-8 border-t border-zinc-800/50">
            <h3 className="text-sm font-bold text-white mb-4 text-center">Connect with us</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {location.whatsapp_number && (
                <a
                  href={`https://wa.me/${location.whatsapp_number.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.97 0C5.36 0 0 5.361 0 11.971c0 2.639.851 5.08 2.308 7.09L.432 24l5.068-1.834A11.933 11.933 0 0011.97 23.94c6.61 0 11.971-5.36 11.971-11.97C23.94 5.36 18.58 0 11.97 0z"/></svg>
                  WhatsApp
                </a>
              )}
              {location.phone_number && (
                <a href={`tel:${location.phone_number}`} className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors">
                  📞 Call
                </a>
              )}
              {location.instagram_handle && (
                <a href={`https://instagram.com/${location.instagram_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors">
                  Instagram
                </a>
              )}
              {location.x_handle && (
                <a href={`https://x.com/${location.x_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors">
                  𝕏 Twitter
                </a>
              )}
              {location.tiktok_handle && (
                <a href={`https://tiktok.com/@${location.tiktok_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors">
                  🎵 TikTok
                </a>
              )}
            </div>
          </div>
        )}

        {/* Floating Proceed Bar */}
        <AnimatePresence>
        {!showCheckout && !formSuccess && selectedItems.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-[calc(100%-3rem)] sm:max-w-md"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCheckout(true)}
              className="w-full shadow-2xl flex items-center justify-between px-6 py-4 rounded-2xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 px-3 py-1 rounded-lg text-sm">{selectedItems.length}</div>
                <span>Start Project</span>
              </div>
              <span className="opacity-90">
                {formatCurrency(selectedItems.reduce((sum, i) => sum + (i.price_minor || 0), 0), location.currency || 'NGN')} →
              </span>
            </motion.button>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Checkout Modal */}
        <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => setShowCheckout(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl"
            >
              <button onClick={() => setShowCheckout(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">✕</button>
              
              <h2 className="text-xl font-bold text-white mb-4">Project Requirements</h2>
              
              <div className="mb-6 bg-zinc-800/50 rounded-xl p-4 border border-zinc-700 space-y-2">
                <div className="flex justify-between text-sm text-zinc-300">
                  <span>Selected Packages:</span>
                  <span className="text-white font-bold">{selectedItems.length}</span>
                </div>
                {combinedTurnaround && (
                  <div className="flex justify-between text-sm text-zinc-300">
                    <span>Est. Turnaround:</span>
                    <span className="text-white font-bold">{combinedTurnaround}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-zinc-300 pt-2 border-t border-zinc-700">
                  <span>Total Base Price:</span>
                  <span className="text-white font-bold">{formatCurrency(selectedItems.reduce((sum, i) => sum + (i.price_minor || 0), 0), location.currency || 'NGN')}</span>
                </div>
                {(selectedItems.some(i => i.payment_mode === 'deposit') || page.payment_mode === 'deposit') && (
                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-amber-400 font-medium">Deposit to start:</span>
                    <span className="text-amber-400 font-bold">
                      {formatCurrency(Math.round(selectedItems.reduce((sum, i) => sum + (i.price_minor || 0), 0) * (Math.max(...selectedItems.map(i => i.deposit_percentage || 0), page.deposit_percentage || 30) / 100)), location.currency || 'NGN')}
                    </span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Your Name *</label>
                  <input
                    value={form.customer_name}
                    onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                    required
                    placeholder="Full name or Company"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Phone Number *</label>
                  <input
                    value={form.customer_phone}
                    onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))}
                    required
                    type="tel"
                    placeholder="+234 800 000 0000"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Email *</label>
                  <input
                    value={form.customer_email}
                    onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))}
                    required
                    type="email"
                    placeholder="Email address"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Project Details (Optional)</label>
                  <textarea
                    value={form.booking_notes}
                    onChange={e => setForm(f => ({ ...f, booking_notes: e.target.value }))}
                    rows={3}
                    placeholder="Briefly describe your project goals..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending || !form.customer_name || !form.customer_phone || !form.customer_email}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition-all"
                  style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}
                >
                  {isPending ? 'Processing…' : (page.billing_enabled && paymentIsLive) ? (
                    (selectedItems.some(i => i.payment_mode === 'deposit') || page.payment_mode === 'deposit')
                      ? `Pay Deposit & Start`
                      : `Pay & Start Project`
                  ) : 'Submit Request'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
        </AnimatePresence>

        <div className="mt-10 text-center">
          <a href="https://ourmenuos.online" className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors">
            Powered by OurMenu OS
          </a>
        </div>
      </div>
    </div>
  )
}
