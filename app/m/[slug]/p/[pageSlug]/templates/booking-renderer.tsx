'use client'

import { useState, useTransition, useEffect } from 'react'
import { BackButton } from '../../../components/back-button'
import { InfoStrip } from '../../../components/info-strip'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

import { formatCurrency } from '@/lib/utils/currency'
import { DatePicker } from '@/app/components/date-picker'
import { Search, X } from 'lucide-react'

interface PageItem {
  id: string
  title: string
  subtitle?: string
  description?: string
  price_minor?: number
  price_display?: string
  availability_status: string
  payment_mode: string
  deposit_percentage?: number
  images?: string[]
}

interface BookingRendererProps {
  location: {
    id: string
    name: string
    organization_id: string
    portal_display_name?: string
    theme_color?: string
    cover_image_url?: string
    ai_name?: string
    ai_enabled?: boolean
    whatsapp_number?: string
    phone_number?: string
    manual_payment_enabled?: boolean
    manual_payment_bank_name?: string
    manual_payment_account_name?: string
    manual_payment_account_number?: string
    manual_payment_instructions?: string
    organizations?: { logo_url?: string }
    instagram_handle?: string
    x_handle?: string
    tiktok_handle?: string
    currency?: string
  }
  page: {
    id: string
    title: string
    content?: string
    billing_enabled?: boolean
    billing_mode?: string
    payment_mode?: string
    deposit_percentage?: number
    business_type_preset?: string
    slug?: string
  }
  items: PageItem[]
  locationSlug: string
  referralSource?: string
  paymentIsLive: boolean
}

const AVAILABILITY_LABELS: Record<string, { label: string; color: string }> = {
  available: { label: 'Available', color: 'text-emerald-400' },
  unavailable: { label: 'Unavailable', color: 'text-zinc-500' },
  sold_out: { label: 'Fully Booked', color: 'text-red-400' },
  coming_soon: { label: 'Coming Soon', color: 'text-blue-400' },
}

export function BookingRenderer({ location, page, items, locationSlug, paymentIsLive }: BookingRendererProps) {
  const themeColor = location.theme_color || '#7c3aed'
  const _availableItems = items.filter(i => i.availability_status === 'available')
  const [selectedItems, setSelectedItems] = useState<PageItem[]>([])
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    // @ts-expect-error item_data is loosely typed from JSON column
    const category = item.item_data?.category?.toLowerCase() || 'services';
    return item.title.toLowerCase().includes(query) || 
           item.description?.toLowerCase().includes(query) || 
           category.includes(query);
  });

  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    booking_date: '',
    booking_end_date: '',
    booking_time: '',
    booking_end_time: '',
    number_of_guests: '1',
    booking_notes: '',
  })

  const [availableSlots, setAvailableSlots] = useState<{ slotStart: string, available: number }[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)

  useEffect(() => {
    if (!form.booking_date) {
      queueMicrotask(() => setAvailableSlots([]))
      return
    }

    let isMounted = true
    setIsLoadingSlots(true)

    // Calculate requested capacity
    const capacityNeeded = parseInt(form.number_of_guests) || 1

    fetch(`/api/locations/${location.id}/availability?date=${form.booking_date}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return
        if (data.slots) {
          // Filter out slots that do not have enough capacity
          const validSlots = data.slots.filter((s: { slotStart: string, available: number }) => s.available >= capacityNeeded)
          setAvailableSlots(validSlots)
        } else {
          setAvailableSlots([])
        }
      })
      .catch(err => {
        console.error('Error fetching slots:', err)
        if (isMounted) setAvailableSlots([])
      })
      .finally(() => {
        if (isMounted) setIsLoadingSlots(false)
      })

    return () => { isMounted = false }
  }, [form.booking_date, form.number_of_guests, location.id])

  function handleToggleItem(item: PageItem) {
    setSelectedItems(prev => {
      if (prev.find(i => i.id === item.id)) {
        return prev.filter(i => i.id !== item.id)
      }
      return [...prev, item]
    })
  }

  function handleProceed() {
    if (selectedItems.length === 0) return
    setShowBookingForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
          ...form,
          number_of_guests: parseInt(form.number_of_guests),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.payment_url) {
          window.location.href = data.payment_url
        } else {
          setFormSuccess(true)
        }
      }
    })
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans" style={{ backgroundColor: (page as { background_color?: string }).background_color || undefined }}>
      {/* Hero */}
      <div className="relative w-full h-[40vh] min-h-65 max-h-95 overflow-hidden">
        {location.cover_image_url ? (
          <>
            <div className="absolute inset-0 bg-cover bg-top" style={{ backgroundImage: `url(${location.cover_image_url})` }} />
            <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${themeColor}40 0%, #0a0a0f 100%)` }} />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-2xl mx-auto">
          {location.organizations?.logo_url && (
            <Image src={location.organizations.logo_url} alt="Logo" width={100} height={48} className="h-12 w-auto object-contain mb-3 drop-shadow-lg" />
          )}
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-lg">{page.title}</h1>
          {page.content && (
            <p className="text-white/70 text-sm mt-2 max-w-md leading-relaxed">{page.content}</p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back link */}
        <BackButton href={`/m/${locationSlug}`} className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {location.portal_display_name || location.name}
        </BackButton>

        {/* Search Bar */}
        {!showBookingForm && !formSuccess && (
          <div className="mb-8 relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services, categories..."
              className="w-full pl-12 pr-12 py-3.5 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-[15px] outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all text-white placeholder:text-zinc-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Booking form overlay */}
        <AnimatePresence>
          {showBookingForm && !formSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: 20, height: 0 }} 
              animate={{ opacity: 1, y: 0, height: 'auto' }} 
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {selectedItems.length > 1 ? `Booking ${selectedItems.length} Services` : `Book: ${selectedItems[0]?.title}`}
                </h2>
                {selectedItems.length === 1 && selectedItems[0]?.subtitle && (
                  <p className="text-xs text-zinc-500 mt-0.5">{selectedItems[0].subtitle}</p>
                )}
              </div>
              <button onClick={() => setShowBookingForm(false)} className="text-zinc-500 hover:text-white p-1">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Your Name *</label>
                  <input
                    value={form.customer_name}
                    onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                    required
                    placeholder="Full name"
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
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Email (optional)</label>
                <input
                  value={form.customer_email}
                  onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))}
                  type="email"
                  placeholder="for booking confirmation"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {['accommodation', 'hotel', 'short_stay'].includes(page.business_type_preset || '') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <DatePicker
                      label="Check-in Date *"
                      date={form.booking_date ? new Date(form.booking_date) : undefined}
                      setDate={(d: Date | undefined) => setForm(f => ({ ...f, booking_date: d ? d.toISOString().split('T')[0] : '' }))}
                      minDate={new Date()}
                    />
                  </div>
                  <div>
                    <DatePicker
                      label="Check-out Date *"
                      date={form.booking_end_date ? new Date(form.booking_end_date) : undefined}
                      setDate={(d: Date | undefined) => setForm(f => ({ ...f, booking_end_date: d ? d.toISOString().split('T')[0] : '' }))}
                      minDate={form.booking_date ? new Date(form.booking_date) : new Date()}
                    />
                  </div>
                </div>
              )}

              {['salon', 'spa_wellness'].includes(page.business_type_preset || '') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <DatePicker
                      label="Date *"
                      date={form.booking_date ? new Date(form.booking_date) : undefined}
                      setDate={(d: Date | undefined) => setForm(f => ({ ...f, booking_date: d ? d.toISOString().split('T')[0] : '' }))}
                      minDate={new Date()}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Available Times *</label>
                    {isLoadingSlots ? (
                      <div className="text-sm text-zinc-500 py-4 text-center border border-zinc-800 rounded-xl">Loading slots...</div>
                    ) : !form.booking_date ? (
                      <div className="text-sm text-zinc-500 py-4 text-center border border-zinc-800 rounded-xl">Select a date to view times</div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-sm text-red-400 py-4 text-center bg-red-500/10 border border-red-500/20 rounded-xl">No slots available</div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                        {availableSlots.map(slot => (
                          <button
                            key={slot.slotStart}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, booking_time: slot.slotStart }))}
                            className={`py-2 px-1 text-sm font-medium rounded-lg border transition-all ${
                              form.booking_time === slot.slotStart
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-emerald-500/50'
                            }`}
                          >
                            {slot.slotStart}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(!page.business_type_preset || !['accommodation', 'hotel', 'short_stay', 'salon', 'spa_wellness', 'event'].includes(page.business_type_preset)) && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <DatePicker
                        label="Start Date"
                        date={form.booking_date ? new Date(form.booking_date) : undefined}
                        setDate={(d: Date | undefined) => setForm(f => ({ ...f, booking_date: d ? d.toISOString().split('T')[0] : '' }))}
                        minDate={new Date()}
                      />
                    </div>
                    <div>
                      <DatePicker
                        label="End Date (Optional)"
                        date={form.booking_end_date ? new Date(form.booking_end_date) : undefined}
                        setDate={(d: Date | undefined) => setForm(f => ({ ...f, booking_end_date: d ? d.toISOString().split('T')[0] : '' }))}
                        minDate={form.booking_date ? new Date(form.booking_date) : new Date()}
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Select Start Time</label>
                    {isLoadingSlots ? (
                      <div className="text-sm text-zinc-500 py-4 text-center border border-zinc-800 rounded-xl">Loading slots...</div>
                    ) : !form.booking_date ? (
                      <div className="text-sm text-zinc-500 py-4 text-center border border-zinc-800 rounded-xl">Select a date to view times</div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-sm text-red-400 py-4 text-center bg-red-500/10 border border-red-500/20 rounded-xl">No slots available</div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                        {availableSlots.map(slot => (
                          <button
                            key={slot.slotStart}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, booking_time: slot.slotStart }))}
                            className={`py-2 px-1 text-sm font-medium rounded-lg border transition-all ${
                              form.booking_time === slot.slotStart
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-emerald-500/50'
                            }`}
                          >
                            {slot.slotStart}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      {/* Placeholder to keep layout consistent if needed */}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">End Time (Optional)</label>
                      <input
                        value={form.booking_end_time}
                        onChange={e => setForm(f => ({ ...f, booking_end_time: e.target.value }))}
                        type="time"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}


              {!['salon', 'spa_wellness'].includes(page.business_type_preset || '') && (
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    {page.business_type_preset === 'event' ? 'Quantity' : ['hotel', 'short_stay', 'accommodation'].includes(page.business_type_preset || '') ? 'Guests' : 'Guests'}
                  </label>
                  <select
                    value={form.number_of_guests}
                    onChange={e => setForm(f => ({ ...f, number_of_guests: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none appearance-none"
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              )}


              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Special Requests (optional)</label>
                <textarea
                  value={form.booking_notes}
                  onChange={e => setForm(f => ({ ...f, booking_notes: e.target.value }))}
                  rows={2}
                  placeholder="Any special requirements?"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>

              {/* Price summary */}
              {selectedItems.some(i => i.price_minor) && (
                <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-4 space-y-2">
                  {(() => {
                    let multiplier = 1;
                    if (form.booking_date && form.booking_end_date && form.booking_date !== form.booking_end_date) {
                      const start = new Date(form.booking_date);
                      const end = new Date(form.booking_end_date);
                      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                        const diffTime = Math.abs(end.getTime() - start.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays > 0) multiplier = diffDays;
                      }
                    }
                    
                    const subtotalBase = selectedItems.reduce((sum, i) => sum + (i.price_minor || 0), 0);
                    const totalAmount = subtotalBase * multiplier;
                    const maxDepositPct = Math.max(...selectedItems.map(i => i.deposit_percentage || 0), page.deposit_percentage || 30);

                    return (
                      <>
                        {selectedItems.map((i, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-zinc-400">{i.title}</span>
                            {(i.price_minor !== undefined && i.price_minor !== null) && (
                            <span className="text-white font-semibold">{formatCurrency(i.price_minor, location.currency || 'NGN')}</span>
                          )}</div>
                        ))}
                        
                        <div className="flex justify-between text-sm border-t border-zinc-700 pt-2 mb-1">
                          <span className="text-zinc-400">Total {multiplier > 1 ? `(${multiplier} nights/days)` : ''}</span>
                          <span className="text-white">{formatCurrency(totalAmount, location.currency || 'NGN')}</span>
                        </div>

                        {(selectedItems.some(i => i.payment_mode === 'deposit') || page.payment_mode === 'deposit') && (
                          <div className="flex justify-between text-sm border-t border-zinc-700 pt-2">
                            <span className="text-amber-400 font-medium">
                              Due now ({maxDepositPct}% deposit)
                            </span>
                            <span className="text-amber-400 font-bold">
                              {formatCurrency(Math.round(totalAmount * (maxDepositPct / 100)), location.currency || 'NGN')}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending || !form.customer_name || !form.customer_phone}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition-all"
                style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}
              >
                {isPending ? 'Processing…' : (page.billing_enabled && paymentIsLive) ? (
                  (selectedItems.some(i => i.payment_mode === 'deposit') || page.payment_mode === 'deposit')
                    ? `Pay Deposit & Confirm Booking`
                    : `Pay & Confirm Booking`
                ) : 'Confirm Booking'}
              </button>


              {/* Manual payment fallback */}
              {location.manual_payment_enabled && page.billing_enabled && (
                <div className={`rounded-xl border p-4 text-xs space-y-1 ${!paymentIsLive ? 'border-amber-500/30 bg-amber-500/10 text-amber-100/70' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}`}>
                  <p className={`font-bold text-sm mb-2 ${!paymentIsLive ? 'text-amber-400' : 'text-zinc-300'}`}>
                    {paymentIsLive ? '💳 Or pay via bank transfer' : '💳 Manual Bank Transfer Required'}
                  </p>
                  {location.manual_payment_bank_name && <p>Bank: <span className="text-white">{location.manual_payment_bank_name}</span></p>}
                  {location.manual_payment_account_name && <p>Account Name: <span className="text-white">{location.manual_payment_account_name}</span></p>}
                  {location.manual_payment_account_number && <p>Account Number: <span className="text-white font-mono">{location.manual_payment_account_number}</span></p>}
                  {location.manual_payment_instructions && <p className="mt-2 text-zinc-500 opacity-80">{location.manual_payment_instructions}</p>}
                  <p className="text-amber-400 mt-2 font-medium">⏳ Your booking is held for 24 hours pending payment confirmation.</p>
                </div>
              )}
            </form>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Success state */}
        <AnimatePresence>
          {formSuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className="mb-8 rounded-2xl border border-theme/30 bg-theme/10 p-8 text-center backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ type: 'spring', delay: 0.1 }}
                className="text-4xl mb-4"
              >✅</motion.div>
              <h1 className="text-3xl font-black text-white">{page.title}</h1>
              {page.content && <p className="text-white/60 text-sm mt-1 max-w-lg">{page.content}</p>}
              <InfoStrip location={location} />
              <p className="text-zinc-400 text-sm mb-4">
              We&apos;ll confirm your booking shortly. Check your phone for updates from {location.name}.
            </p>
            <button onClick={() => { setFormSuccess(false); setShowBookingForm(false); setSelectedItems([]) }} className="text-zinc-400 text-sm hover:text-white transition-colors">
              ← View other services
            </button>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Services grid */}
        {!showBookingForm && (
          <div className="space-y-8">
            {Object.entries(
              filteredItems.reduce((acc, item) => {
                // @ts-expect-error item_data is loosely typed from JSON column
                const cat = item.item_data?.category?.trim() || 'Services'
                if (!acc[cat]) acc[cat] = []
                acc[cat].push(item)
                return acc
              }, {} as Record<string, PageItem[]>)
            ).map(([categoryName, categoryItems]) => (
              <div key={categoryName} className="space-y-4">
                <h2 className="text-xs font-bold text-zinc-500 tracking-widest mb-4">
                  {categoryName}
                </h2>

                <motion.div 
                  initial="hidden" animate="show" 
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
                  className="space-y-4"
                >

                {categoryItems.map(item => {
              const avail = AVAILABILITY_LABELS[item.availability_status] || AVAILABILITY_LABELS.available
              const isAvailable = item.availability_status === 'available'

              return (
                <motion.div 
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                  whileHover={isAvailable ? { y: -4, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)", scale: 1.01 } : {}}
                  key={item.id} 
                  className={`rounded-2xl border transition-all ${isAvailable ? 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 backdrop-blur-sm' : 'border-zinc-800/50 bg-zinc-900/20 opacity-60'}`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      {item.images?.[0] && (
                        <div className="w-18 h-18 shrink-0 rounded-xl overflow-hidden bg-zinc-800 relative block">
                          <Image src={item.images[0]} alt={item.title} fill className="object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white">{item.title}</h3>
                          <span className={`text-xs font-bold ${avail.color}`}>{avail.label}</span>
                        </div>
                        {item.subtitle && <p className="text-xs text-zinc-500 mb-2">{item.subtitle}</p>}
                        {item.description && <p className="text-sm text-zinc-400 leading-relaxed">{item.description}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        {item.price_display ? (
                          <div className="text-base font-bold text-white">{item.price_display}</div>
                        ) : item.price_minor ? (
                          <div className="text-base font-bold text-white">{formatCurrency(item.price_minor, location.currency || 'NGN')}</div>
                        ) : null}
                        {item.payment_mode === 'deposit' && item.deposit_percentage && (
                          <div className="text-xs text-amber-400 mt-0.5">{item.deposit_percentage}% deposit</div>
                        )}
                      </div>
                    </div>

                    {isAvailable && (
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          onClick={() => handleToggleItem(item)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${selectedItems.some(i => i.id === item.id) ? 'bg-white text-black border-white' : 'border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700'}`}
                        >
                          {selectedItems.some(i => i.id === item.id) ? 'Selected ✓' : 'Select Service'}
                        </button>
                
                        <Link
                          href={`/m/${locationSlug}/p/${page.slug || page.id}/${item.id}`}
                          className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all text-zinc-300 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 whitespace-nowrap"
                        >
                          Details
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
            </motion.div>
            </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-zinc-600">
                <p className="text-sm">
                  {searchQuery ? `No services found matching "${searchQuery}"` : 'No services listed yet.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Floating Proceed Bar */}
        {!showBookingForm && selectedItems.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-[calc(100%-3rem)] sm:max-w-md">
            <button
              onClick={handleProceed}
              className="w-full shadow-2xl flex items-center justify-between px-6 py-4 rounded-2xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 px-3 py-1 rounded-lg text-sm">{selectedItems.length}</div>
                <span>Proceed to Book</span>
              </div>
              <span className="opacity-90">
                {formatCurrency(selectedItems.reduce((sum, i) => sum + (i.price_minor || 0), 0), location.currency || 'NGN')} →
              </span>
            </button>
          </div>
        )}

        {/* Contact strip */}
        {(location.whatsapp_number || location.phone_number || location.instagram_handle || location.x_handle || location.tiktok_handle) && (
          <div className="mt-10 pt-6 border-t border-zinc-800 flex flex-wrap gap-3 justify-center">
            {location.whatsapp_number && (
              <a
                href={`https://wa.me/${location.whatsapp_number.replace(/[^0-9]/g, '')}?text=Hi, I'd like to enquire about booking`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.97 0C5.36 0 0 5.361 0 11.971c0 2.639.851 5.08 2.308 7.09L.432 24l5.068-1.834A11.933 11.933 0 0011.97 23.94c6.61 0 11.971-5.36 11.971-11.97C23.94 5.36 18.58 0 11.97 0z"/></svg>
                WhatsApp us
              </a>
            )}
            {location.phone_number && (
              <a href={`tel:${location.phone_number}`} className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors">
                📞 Call to book
              </a>
            )}
            {location.instagram_handle && (
              <a
                href={`https://instagram.com/${location.instagram_handle.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors"
              >
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
        )}

        {/* OurMenu badge */}
        <div className="mt-10 text-center">
          <a href="https://ourmenuos.online" className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors">
            Powered by OurMenu OS
          </a>
        </div>
      </div>
    </div>
  )
}
