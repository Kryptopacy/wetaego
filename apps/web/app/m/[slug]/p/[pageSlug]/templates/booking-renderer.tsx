'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'

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
  const availableItems = items.filter(i => i.availability_status === 'available')
  const [selectedItem, setSelectedItem] = useState<PageItem | null>(null)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

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

  function handleSelectItem(item: PageItem) {
    setSelectedItem(item)
    setShowBookingForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedItem || !form.customer_name || !form.customer_phone) return

    startTransition(async () => {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_id: page.id,
          item_id: selectedItem.id,
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
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      {/* Hero */}
      <div className="relative w-full h-[40vh] min-h-[260px] max-h-[380px] overflow-hidden">
        {location.cover_image_url ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${location.cover_image_url})` }} />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${themeColor}40 0%, #0a0a0f 100%)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-2xl mx-auto">
          {location.organizations?.logo_url && (
            <img src={location.organizations.logo_url} alt="Logo" className="h-12 w-auto object-contain mb-3 drop-shadow-lg" />
          )}
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-lg">{page.title}</h1>
          {page.content && (
            <p className="text-white/70 text-sm mt-2 max-w-md leading-relaxed">{page.content}</p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link href={`/m/${locationSlug}`} className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {location.name}
        </Link>

        {/* Booking form overlay */}
        {showBookingForm && !formSuccess && (
          <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">Book: {selectedItem?.title}</h2>
                {selectedItem?.subtitle && <p className="text-xs text-zinc-500 mt-0.5">{selectedItem.subtitle}</p>}
              </div>
              <button onClick={() => { setShowBookingForm(false); setSelectedItem(null) }} className="text-zinc-500 hover:text-white p-1">✕</button>
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
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-violet-500 focus:outline-none"
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
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-violet-500 focus:outline-none"
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
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Start Date</label>
                  <input
                    value={form.booking_date}
                    onChange={e => setForm(f => ({ ...f, booking_date: e.target.value }))}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">End Date (Optional)</label>
                  <input
                    value={form.booking_end_date}
                    onChange={e => setForm(f => ({ ...f, booking_end_date: e.target.value }))}
                    type="date"
                    min={form.booking_date || new Date().toISOString().split('T')[0]}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Start Time</label>
                  <input
                    value={form.booking_time}
                    onChange={e => setForm(f => ({ ...f, booking_time: e.target.value }))}
                    type="time"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">End Time (Optional)</label>
                  <input
                    value={form.booking_end_time}
                    onChange={e => setForm(f => ({ ...f, booking_end_time: e.target.value }))}
                    type="time"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Guests</label>
                <select
                  value={form.number_of_guests}
                  onChange={e => setForm(f => ({ ...f, number_of_guests: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-violet-500 focus:outline-none appearance-none"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Special Requests (optional)</label>
                <textarea
                  value={form.booking_notes}
                  onChange={e => setForm(f => ({ ...f, booking_notes: e.target.value }))}
                  rows={2}
                  placeholder="Any special requirements?"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:border-violet-500 focus:outline-none resize-none"
                />
              </div>

              {/* Price summary */}
              {selectedItem?.price_minor && (
                <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">{selectedItem.title}</span>
                    <span className="text-white font-semibold">₦{(selectedItem.price_minor / 100).toLocaleString()}</span>
                  </div>
                  {(selectedItem.payment_mode === 'deposit' || page.payment_mode === 'deposit') && (
                    <div className="flex justify-between text-sm border-t border-zinc-700 pt-2">
                      <span className="text-amber-400 font-medium">
                        Due now ({selectedItem.deposit_percentage || page.deposit_percentage || 30}% deposit)
                      </span>
                      <span className="text-amber-400 font-bold">
                        ₦{Math.round(selectedItem.price_minor * ((selectedItem.deposit_percentage || page.deposit_percentage || 30) / 100) / 100).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending || !form.customer_name || !form.customer_phone}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition-all"
                style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}
              >
                {isPending ? 'Processing…' : (page.billing_enabled && paymentIsLive) ? (
                  (selectedItem?.payment_mode === 'deposit' || page.payment_mode === 'deposit')
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
          </div>
        )}

        {/* Success state */}
        {formSuccess && (
          <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-white mb-2">Booking Requested!</h2>
            <p className="text-zinc-400 text-sm mb-4">
              We'll confirm your booking shortly. Check your phone for updates from {location.name}.
            </p>
            <button onClick={() => { setFormSuccess(false); setShowBookingForm(false); setSelectedItem(null) }} className="text-zinc-400 text-sm hover:text-white">
              ← View other services
            </button>
          </div>
        )}

        {/* Services grid */}
        {!showBookingForm && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-zinc-400 uppercase tracking-wider text-xs">
              {availableItems.length > 0 ? 'Our Services' : 'Services'}
            </h2>

            {items.map(item => {
              const avail = AVAILABILITY_LABELS[item.availability_status] || AVAILABILITY_LABELS.available
              const isAvailable = item.availability_status === 'available'

              return (
                <div key={item.id} className={`rounded-2xl border transition-all ${isAvailable ? 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700' : 'border-zinc-800/50 bg-zinc-900/20 opacity-60'}`}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
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
                          <div className="text-base font-bold text-white">₦{(item.price_minor / 100).toLocaleString()}</div>
                        ) : null}
                        {item.payment_mode === 'deposit' && item.deposit_percentage && (
                          <div className="text-xs text-amber-400 mt-0.5">{item.deposit_percentage}% deposit</div>
                        )}
                      </div>
                    </div>

                    {isAvailable && (
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          onClick={() => handleSelectItem(item)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all text-white"
                          style={{ background: `linear-gradient(135deg, ${themeColor}cc, ${themeColor}88)` }}
                        >
                          Book Now
                        </button>
                        <Link
                          href={`/m/${locationSlug}/p/${page.slug || page.id}/${item.id}`}
                          className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all text-zinc-300 bg-zinc-800 hover:bg-zinc-700 whitespace-nowrap"
                        >
                          Details
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {items.length === 0 && (
              <div className="text-center py-12 text-zinc-600">
                <p className="text-sm">No services listed yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Contact strip */}
        {(location.whatsapp_number || location.phone_number) && (
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
