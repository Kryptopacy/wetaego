'use client'



import { toast } from 'sonner';

import { useState, useTransition } from 'react';


import Link from 'next/link'
import type { BusinessTypePreset } from '@/lib/templates/presets'
import { createCustomPage } from '../../actions'

interface Item {
  id?: string
  title: string
  subtitle: string
  description: string
  price_minor: number | ''
  original_price_minor: number | ''
  price_display: string
  availability_status: string
  payment_mode: string
  deposit_percentage: number | ''
  item_data: Record<string, string>
}

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: '✅ Available', color: 'text-emerald-400' },
  { value: 'unavailable', label: '⏸️ Unavailable', color: 'text-zinc-400' },
  { value: 'sold_out', label: '🔴 Sold Out', color: 'text-red-400' },
  { value: 'coming_soon', label: '🔜 Coming Soon', color: 'text-blue-400' },
]

const ITEM_FIELD_LABELS: Record<string, Record<string, string>> = {
  booking: {
    subtitle: 'Duration / Details (e.g. "60 minutes")',
    description: "What's included in this service",
    price: 'Price (₦)',
  },
  hotel: {
    subtitle: 'Room type / Details (e.g. "King bed, sea view")',
    description: 'Amenities and room features',
    price: 'Price per night (₦)',
  },
  salon: {
    subtitle: 'Estimated time (e.g. "2-3 hours")',
    description: 'What this service includes',
    price: 'Price (₦)',
  },
  event_venue: {
    subtitle: 'Capacity / Details (e.g. "Up to 300 guests")',
    description: "What's included in this package",
    price: 'Package price (₦)',
  },
}

function getFieldLabels(businessType: string) {
  return ITEM_FIELD_LABELS[businessType] || ITEM_FIELD_LABELS.booking
}

const emptyItem = (): Item => ({
  title: '',
  subtitle: '',
  description: '',
  price_minor: '',
  original_price_minor: '',
  price_display: '',
  availability_status: 'available',
  payment_mode: 'full',
  deposit_percentage: '',
  item_data: {},
})

interface Props {
  preset: BusinessTypePreset
  businessType: string
  orgId: string
  orgName: string
  locationId: string
  locationSlug: string
  mode: string
  existingPage: Record<string, unknown> | null
  existingItems: unknown[]
  defaultTitle: string
}

export function BookingBuilderClient({
  preset,
  businessType,
  // orgId and orgName are passed from the parent but not used directly in this builder
  locationId,
  locationSlug,
  mode,
  existingPage,
  existingItems,
  defaultTitle,
}: Props) {
  const [isPending, startTransition] = useTransition()

  // Page-level state
  const [pageTitle, setPageTitle] = useState((existingPage?.title as string) || defaultTitle)
  const [slug, setSlug] = useState(
    (existingPage?.slug as string) || pageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  )
  const [pageDescription, setPageDescription] = useState((existingPage?.content as string) || '')
  const [billingEnabled, setBillingEnabled] = useState((existingPage?.billing_enabled as boolean) ?? preset.billing_enabled)
  const [paymentMode, setPaymentMode] = useState((existingPage?.payment_mode as string) || preset.payment_mode)
  const [depositPct, setDepositPct] = useState<number | ''>((existingPage?.deposit_percentage as number) || preset.deposit_percentage || '')
  const [isPrimary] = useState(mode === 'primary')

  // Global Settings State
  const [randomizerEnabled, setRandomizerEnabled] = useState(existingPage?.randomizer_enabled as boolean || false)
  const [milestonesEnabled, setMilestonesEnabled] = useState((existingPage?.template_data as Record<string, unknown>)?.milestones_enabled as boolean || false)
  const [refundPolicy, setRefundPolicy] = useState((existingPage?.template_data as Record<string, unknown>)?.refund_policy as string || '')
  const [paymentChannels, setPaymentChannels] = useState<string[]>((existingPage?.template_data as Record<string, unknown>)?.payment_channels as string[] || ['card', 'bank_transfer', 'ussd'])
  
  // Socials
  const [whatsapp, setWhatsapp] = useState((existingPage?.template_data as Record<string, unknown>)?.whatsapp_number as string || '')
  const [phone, setPhone] = useState((existingPage?.template_data as Record<string, unknown>)?.phone_number as string || '')
  const [instagram, setInstagram] = useState((existingPage?.template_data as Record<string, unknown>)?.instagram_handle as string || '')
  const [twitter, setTwitter] = useState((existingPage?.template_data as Record<string, unknown>)?.x_handle as string || '')
  const [tiktok, setTiktok] = useState((existingPage?.template_data as Record<string, unknown>)?.tiktok_handle as string || '')

  // Items state
  const [items, setItems] = useState<Item[]>(
    (existingItems as Record<string, unknown>[]).map((i) => ({
      id: i.id as string,
      title: i.title as string,
      subtitle: (i.subtitle as string) || '',
      description: (i.description as string) || '',
      price_minor: (i.price_minor as number) || '',
      original_price_minor: (i.original_price_minor as number) || '',
      price_display: (i.price_display as string) || '',
      availability_status: (i.availability_status as string) || 'available',
      payment_mode: (i.payment_mode as string) || 'full',
      deposit_percentage: (i.deposit_percentage as number) || '',
      item_data: (i.item_data as Record<string, string>) || {},
    })) || [emptyItem()]
  )
  const [editingIdx, setEditingIdx] = useState<number | null>(items.length === 0 ? 0 : null)
  const [activeSection, setActiveSection] = useState<'details' | 'services' | 'settings'>('details')

  const pageId = existingPage?.id as string | undefined

  const fieldLabels = getFieldLabels(businessType)

  function handleTitleChange(val: string) {
    setPageTitle(val)
    if (!pageId) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    }
  }

  function addNewItem() {
    setItems(prev => [...prev, emptyItem()])
    setEditingIdx(items.length)
  }

  function updateItem(idx: number, field: keyof Item, value: unknown) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  async function handleSavePage() {
    if (!pageTitle.trim()) return

    const formData = new FormData()
    formData.set('title', pageTitle)
    formData.set('slug', slug)
    formData.set('content', pageDescription)
    formData.set('location_id', locationId)
    formData.set('template_type', 'booking')
    formData.set('is_primary', isPrimary.toString())
    formData.set('billing_enabled', billingEnabled.toString())
    formData.set('billing_mode', 'standard_checkout')
    formData.set('payment_mode', paymentMode)
    formData.set('deposit_percentage', depositPct.toString())
    formData.set('business_type_preset', businessType)

    if (pageId) {
      formData.set('pageId', pageId)
      // Pass the updated settings
      formData.set('randomizer_enabled', randomizerEnabled ? 'true' : 'false')
      formData.set('milestones_enabled', milestonesEnabled ? 'true' : 'false')
      formData.set('hide_delivery', 'false') // not used in booking
      paymentChannels.forEach(c => formData.append('payment_channels', c))
      formData.set('refund_policy', refundPolicy)
      if (whatsapp) formData.set('whatsapp_number', whatsapp)
      if (phone) formData.set('phone_number', phone)
      if (instagram) formData.set('instagram_handle', instagram)
      if (twitter) formData.set('x_handle', twitter)
      if (tiktok) formData.set('tiktok_handle', tiktok)
      
      startTransition(async () => {
        const { updatePage } = await import('../../actions')
        const updateRes = await updatePage(formData);
        if (updateRes?.serverError || updateRes?.validationErrors) { toast.error(updateRes.serverError || 'Update failed'); return; }
      })
    } else {
      startTransition(async () => {
        const createRes = await createCustomPage(formData);
        if (createRes?.serverError || createRes?.validationErrors) { toast.error(createRes.serverError || 'Creation failed'); return; }
      })
    }
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ourmenu.os'}/m/${locationSlug}/p/${slug}`

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 md:px-12 h-16 bg-black/80 backdrop-blur-xl border-b border-white/[0.05]">
        <Link href="/dashboard/pages" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Your Pages
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-full">
            {preset.icon} {preset.label}
          </span>
        </div>
        <button
          onClick={handleSavePage}
          disabled={isPending || !pageTitle.trim()}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 transition-all shadow-lg shadow-emerald-900/30"
        >
          {isPending ? 'Saving…' : pageId ? 'Save Changes' : 'Publish Page'}
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-12 py-10">
        {/* Section tabs */}
        <div className="flex gap-1 mb-8 bg-zinc-900/50 p-1 rounded-xl w-fit">
          {(['details', 'services', 'settings'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                activeSection === s
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {s === 'services' ? `${preset.icon} Services` : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* ── DETAILS ─────────────────────────────────────────────────────── */}
        {activeSection === 'details' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Page Title</label>
              <input
                value={pageTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={defaultTitle}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>

            {!pageId && (
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">URL Slug</label>
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                  <span className="text-zinc-600 text-sm shrink-0">/m/{locationSlug}/p/</span>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1 bg-transparent text-white text-sm focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Page Description <span className="text-zinc-600 font-normal">(optional — shown to customers)</span>
              </label>
              <textarea
                value={pageDescription}
                onChange={(e) => setPageDescription(e.target.value)}
                rows={4}
                placeholder={`Tell customers about your ${preset.label.toLowerCase()} — what to expect, how to book, cancellation policy, etc.`}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Public URL preview */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Your public link</div>
              <div className="text-sm text-blue-400 font-mono break-all">{publicUrl}</div>
            </div>
          </div>
        )}

        {/* ── SERVICES ────────────────────────────────────────────────────── */}
        {activeSection === 'services' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-base font-bold text-white">Services & Offerings</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Each card shows as a bookable option on your public page</p>
              </div>
              <button
                onClick={addNewItem}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-300 hover:text-white hover:border-white/20 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Service
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className={`rounded-2xl border transition-all ${editingIdx === idx ? 'border-emerald-500/40 bg-emerald-900/5' : 'border-zinc-800 bg-zinc-900/30'}`}>
                {/* Collapsed row */}
                {editingIdx !== idx ? (
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => setEditingIdx(idx)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${item.availability_status === 'available' ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                      <div>
                        <span className="text-sm font-semibold text-white">{item.title || 'Untitled Service'}</span>
                        {item.subtitle && <span className="text-xs text-zinc-500 ml-2">{item.subtitle}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.price_minor !== '' && (
                        <div className="flex flex-col items-end">
                          <span className="font-medium text-white">₦{Number(item.price_minor / 100).toLocaleString()}</span>
                          {item.original_price_minor !== '' && Number(item.original_price_minor) > Number(item.price_minor) && (
                            <span className="text-xs text-zinc-500 line-through">₦{(Number(item.original_price_minor) / 100).toLocaleString()}</span>
                          )}
                        </div>
                      )}
                      <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  /* Expanded editor */
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Service Name *</label>
                        <input
                          value={item.title}
                          onChange={(e) => updateItem(idx, 'title', e.target.value)}
                          placeholder="e.g. Deep Tissue Massage"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                          {fieldLabels.subtitle || 'Duration / Details'}
                        </label>
                        <input
                          value={item.subtitle}
                          onChange={(e) => updateItem(idx, 'subtitle', e.target.value)}
                          placeholder="e.g. 60 minutes"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Category</label>
                      <input
                        value={item.item_data?.category || ''}
                        onChange={(e) => updateItem(idx, 'item_data', { ...item.item_data, category: e.target.value })}
                        placeholder="e.g. Haircuts, Massages, Main Course"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Description</label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        rows={3}
                        placeholder={fieldLabels.description || 'Describe this service...'}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                          {fieldLabels.price || 'Price (₦)'}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">₦</span>
                          <input
                            type="number"
                            value={item.price_minor !== '' ? Number(item.price_minor) / 100 : ''}
                            onChange={(e) => updateItem(idx, 'price_minor', e.target.value ? Math.round(parseFloat(e.target.value) * 100) : '')}
                            placeholder="0.00"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Display Price</label>
                        <input
                          value={item.price_display}
                          onChange={(e) => updateItem(idx, 'price_display', e.target.value)}
                          placeholder='e.g. "from ₦15,000"'
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Status</label>
                        <select
                          value={item.availability_status}
                          onChange={(e) => updateItem(idx, 'availability_status', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors appearance-none"
                        >
                          {AVAILABILITY_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Payment options per item */}
                    <div className="pt-2 border-t border-zinc-800">
                      <div className="flex items-center gap-4 mb-3">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Payment</label>
                        <div className="flex gap-2">
                          {(['full', 'deposit'] as const).map(m => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => updateItem(idx, 'payment_mode', m)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                item.payment_mode === m
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                              }`}
                            >
                              {m === 'full' ? 'Full Payment' : 'Deposit Only'}
                            </button>
                          ))}
                        </div>
                      </div>
                      {item.payment_mode === 'deposit' && (
                        <div className="flex items-center gap-3">
                          <label className="text-xs text-zinc-500">Deposit %</label>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={item.deposit_percentage}
                            onChange={(e) => updateItem(idx, 'deposit_percentage', parseInt(e.target.value))}
                            placeholder="30"
                            className="w-20 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                          />
                          <span className="text-xs text-zinc-500">% of total charged upfront</span>
                        </div>
                      )}
                    </div>

                    {/* Item actions */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => {
                          setItems(prev => prev.filter((_, i) => i !== idx))
                          setEditingIdx(null)
                        }}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove service
                      </button>
                      <button
                        onClick={() => setEditingIdx(null)}
                        className="px-4 py-1.5 rounded-lg bg-zinc-800 text-sm text-white hover:bg-zinc-700 transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-12 text-zinc-600">
                <p className="text-sm mb-3">No services yet</p>
                <button
                  onClick={addNewItem}
                  className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors"
                >
                  + Add your first service
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS ────────────────────────────────────────────────────── */}
        {activeSection === 'settings' && (
          <div className="space-y-6">
            {/* Billing toggle */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Collect Payments</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Charge customers when they book via Paystack
                  </p>
                </div>
                <button
                  onClick={() => setBillingEnabled(b => !b)}
                  className={`w-12 h-6 rounded-full transition-all relative ${billingEnabled ? 'bg-emerald-600' : 'bg-zinc-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-all ${billingEnabled ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              {billingEnabled && (
                <div className="space-y-4 pt-4 border-t border-zinc-800">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Default Payment Mode</label>
                    <div className="flex gap-2">
                      {(['full', 'deposit'] as const).map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMode(m)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                            paymentMode === m
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-600'
                          }`}
                        >
                          {m === 'full' ? '💳 Full Payment' : '💰 Deposit Only'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentMode === 'deposit' && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Default Deposit %</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={5}
                          max={100}
                          step={5}
                          value={typeof depositPct === 'number' ? depositPct : 30}
                          onChange={(e) => setDepositPct(parseInt(e.target.value))}
                          className="flex-1 accent-emerald-500"
                        />
                        <span className="text-lg font-bold text-white w-12 text-right">
                          {typeof depositPct === 'number' ? depositPct : 30}%
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 mt-1">
                        Customers pay {typeof depositPct === 'number' ? depositPct : 30}% now, the rest on arrival
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Roulette Addon */}
            <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
              <div>
                <p className="text-sm font-bold text-white">Payment Roulette Add-on</p>
                <p className="text-xs text-zinc-400 mt-0.5">Enable the &quot;Surprise Me" spinning wheel for customers who can&apos;t decide.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={randomizerEnabled} onChange={e => setRandomizerEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Milestones Addon */}
            <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
              <div>
                <p className="text-sm font-bold text-white">Milestone Billing (Add-on)</p>
                <p className="text-xs text-zinc-400 mt-0.5">Allow splitting invoices into custom payment milestones (e.g., 30% upfront, 70% completion).</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={milestonesEnabled} onChange={e => setMilestonesEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Allowed Payment Methods</label>
                <div className="flex gap-4">
                  {['card', 'bank_transfer', 'ussd'].map((method) => (
                    <label key={method} className="flex items-center gap-2 text-sm text-white cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={paymentChannels.includes(method)} 
                        onChange={e => {
                          if (e.target.checked) setPaymentChannels(prev => [...prev, method])
                          else setPaymentChannels(prev => prev.filter(c => c !== method))
                        }}
                        className="rounded bg-zinc-900 border-zinc-800 text-emerald-500 focus:ring-emerald-500" 
                      />
                      {method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Cancellation & Refund Policy</label>
                <textarea 
                  value={refundPolicy}
                  onChange={e => setRefundPolicy(e.target.value)}
                  placeholder="e.g. Deposits are non-refundable if cancelled within 48 hours." 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white h-20 resize-none" 
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-bold text-white">Social & Contact Links</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">WhatsApp Number</label>
                  <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="e.g. +2348012345678" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Phone Number</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +2348012345678" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Instagram Handle</label>
                  <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="e.g. @ourmenu" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">X (Twitter) Handle</label>
                  <input value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="e.g. @ourmenu" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">TikTok Handle</label>
                  <input value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="e.g. @ourmenu" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
              </div>
            </div>

            {/* Primary page toggle info */}
            {mode === 'primary' && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex gap-3">
                  <span className="text-amber-400 text-sm">⭐</span>
                  <div>
                    <div className="text-sm font-bold text-amber-300 mb-1">Primary Page</div>
                    <div className="text-xs text-zinc-400">
                      This page will be shown when someone scans your main QR code at <span className="text-white font-mono">/m/{locationSlug}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
