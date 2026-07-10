'use client'

import { toast } from 'sonner';

import { useState, useTransition } from 'react';

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { BusinessTypePreset } from '@/lib/templates/presets'
import { createCustomPage, addPageItem, updatePageItem, deletePageItem } from '../../actions'

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
]

const TIER_CATEGORIES = [
  { value: 'basic', label: 'Basic Tier' },
  { value: 'standard', label: 'Standard Tier' },
  { value: 'premium', label: 'Premium Tier' },
  { value: 'addon', label: 'Add-on Service' },
]

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
  item_data: { category: 'standard' },
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

export function RateCardBuilderClient({
  preset,
  businessType,
  // orgId and orgName provided by parent
  locationId,
  locationSlug,
  mode,
  existingPage,
  existingItems,
  defaultTitle,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Page-level state
  const [pageTitle, setPageTitle] = useState((existingPage?.title as string) || defaultTitle)
  const [slug, setSlug] = useState(
    (existingPage?.slug as string) || pageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  )
  const [pageDescription, setPageDescription] = useState((existingPage?.content as string) || '')
  const [isPrimary] = useState(mode === 'primary')

  // Payment settings for the page
  const [billingEnabled, setBillingEnabled] = useState((existingPage?.billing_enabled as boolean) ?? preset.billing_enabled)
  const [paymentMode, setPaymentMode] = useState((existingPage?.payment_mode as string) || preset.payment_mode)
  const [depositPct, setDepositPct] = useState<number | ''>((existingPage?.deposit_percentage as number) || preset.deposit_percentage || '')

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
      item_data: (i.item_data as Record<string, string>) || { category: 'standard' },
    })) || [emptyItem()]
  )
  const [editingIdx, setEditingIdx] = useState<number | null>(items.length === 0 ? 0 : null)
  const [activeSection, setActiveSection] = useState<'details' | 'services' | 'settings'>('details')

  const pageId = existingPage?.id as string | undefined

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

  function updateItemData(idx: number, key: string, value: string) {
    setItems(prev => prev.map((item, i) => {
      if (i === idx) {
        return {
          ...item,
          item_data: { ...item.item_data, [key]: value }
        }
      }
      return item
    }))
  }

  async function handleSavePage() {
    if (!pageTitle.trim()) return

    const formData = new FormData()
    formData.set('title', pageTitle)
    formData.set('slug', slug)
    formData.set('content', pageDescription)
    formData.set('location_id', locationId)
    formData.set('template_type', 'rate_card')
    formData.set('is_primary', isPrimary.toString())
    formData.set('billing_enabled', billingEnabled.toString())
    formData.set('billing_mode', 'standard_checkout')
    formData.set('payment_mode', paymentMode)
    if (depositPct) formData.set('deposit_percentage', depositPct.toString())
    formData.set('business_type_preset', businessType)

    if (pageId) {
      formData.set('pageId', pageId)
      // Pass required defaults for updatePage
      formData.set('randomizer_enabled', existingPage?.randomizer_enabled ? 'true' : 'false')
      
      startTransition(async () => {
        const { updatePage } = await import('../../actions')
        const updateRes = await updatePage(formData);
        if (updateRes?.serverError || updateRes?.validationErrors) { toast.error(updateRes.serverError || 'Update failed'); return; }
        
        // Save items
        for (const [index, item] of items.entries()) {
          const itemFormData = new FormData()
          itemFormData.set('page_id', pageId)
          itemFormData.set('title', item.title)
          itemFormData.set('subtitle', item.subtitle)
          itemFormData.set('description', item.description)
          itemFormData.set('availability_status', item.availability_status)
          if (item.price_minor !== '') itemFormData.set('price_minor', item.price_minor.toString())
          itemFormData.set('price_display', item.price_display)
          itemFormData.set('payment_mode', item.payment_mode)
          if (item.deposit_percentage) itemFormData.set('deposit_percentage', item.deposit_percentage.toString())
          itemFormData.set('sort_order', index.toString())
          itemFormData.set('item_data', JSON.stringify(item.item_data))
          
          if (item.id && !item.id.startsWith('new_')) {
            itemFormData.set('itemId', item.id)
            const itemRes = await updatePageItem(itemFormData);
            if (itemRes?.serverError || itemRes?.validationErrors) { toast.error(itemRes.serverError || 'Failed to update item'); return; }
          } else {
            await addPageItem(itemFormData)
          }
        }
        
        // Delete items that were removed
        const currentIds = items.map(i => i.id as string).filter(id => id && !id.startsWith('new_'))
        const originalIds = (existingItems as Record<string, unknown>[]).map(i => i.id as string)
        for (const id of originalIds) {
          if (!currentIds.includes(id)) {
            const delForm = new FormData()
            delForm.set('itemId', id)
            await deletePageItem(delForm)
          }
        }

        router.refresh()
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
              {s === 'services' ? `${preset.icon} Rate Card` : s.charAt(0).toUpperCase() + s.slice(1)}
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
                Bio / About <span className="text-zinc-600 font-normal">(optional)</span>
              </label>
              <textarea
                value={pageDescription}
                onChange={(e) => setPageDescription(e.target.value)}
                rows={4}
                placeholder={`Describe your freelance services, agency, or expertise...`}
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

        {/* ── SERVICES / RATE CARD ────────────────────────────────────────── */}
        {activeSection === 'services' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-base font-bold text-white">Rate Card Items</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Build your tiers (Basic, Standard, Premium) and Add-ons.</p>
              </div>
              <button
                onClick={addNewItem}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-300 hover:text-white hover:border-white/20 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Package
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
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{item.title || 'Untitled Package'}</span>
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full capitalize">{item.item_data?.category || 'standard'}</span>
                        </div>
                        {item.subtitle && <span className="text-xs text-zinc-500 mt-0.5 block">{item.subtitle}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.price_display ? (
                        <span className="text-sm font-bold text-white">{item.price_display}</span>
                      ) : item.price_minor !== '' ? (
                        <span className="text-sm font-bold text-white">
                          ₦{Number(item.price_minor / 100).toLocaleString()}
                        </span>
                      ) : null}
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
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Package Title *</label>
                        <input
                          value={item.title}
                          onChange={(e) => updateItem(idx, 'title', e.target.value)}
                          placeholder="e.g. Logo Design"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                          Tier Category
                        </label>
                        <input
                          list="tier-categories"
                          value={item.item_data?.category || ''}
                          onChange={(e) => updateItemData(idx, 'category', e.target.value)}
                          placeholder="e.g. basic, custom, maintenance"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                        <datalist id="tier-categories">
                          {TIER_CATEGORIES.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Subtitle / Short Note</label>
                      <input
                        value={item.subtitle}
                        onChange={(e) => updateItem(idx, 'subtitle', e.target.value)}
                        placeholder="e.g. Best for startups"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Description</label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        rows={2}
                        placeholder="What is this package about?"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors resize-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Features Included</label>
                      <p className="text-xs text-zinc-500 mb-2">Separate each feature with a comma. These will render as checkmarks.</p>
                      <textarea
                        value={item.item_data?.includes || ''}
                        onChange={(e) => updateItemData(idx, 'includes', e.target.value)}
                        rows={2}
                        placeholder="e.g. 2 concepts, 3 revisions, source files"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                          Base Price (₦)
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
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                          Original Price
                          {item.original_price_minor !== '' && item.price_minor !== '' && Number(item.original_price_minor) > Number(item.price_minor) && (
                            <span className="bg-red-500/20 text-red-400 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full">
                              {Math.round(((Number(item.original_price_minor) - Number(item.price_minor)) / Number(item.original_price_minor)) * 100)}% OFF
                            </span>
                          )}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">₦</span>
                          <input
                            type="number"
                            value={item.original_price_minor !== '' ? Number(item.original_price_minor) / 100 : ''}
                            onChange={e => updateItem(idx, 'original_price_minor', e.target.value ? Math.round(parseFloat(e.target.value) * 100) : '')}
                            placeholder="Optional"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Display Price</label>
                        <input
                          value={item.price_display}
                          onChange={(e) => updateItem(idx, 'price_display', e.target.value)}
                          placeholder='e.g. "₦150k"'
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Turnaround</label>
                        <input
                          value={item.item_data?.turnaround || ''}
                          onChange={(e) => updateItemData(idx, 'turnaround', e.target.value)}
                          placeholder='e.g. "3-5 days"'
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

                    {/* Payment settings per package */}
                    {billingEnabled && (
                      <div className="pt-2 border-t border-zinc-800">
                        <div className="flex items-center gap-4 mb-3">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Payment Mode</label>
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
                                {m === 'full' ? 'Full Payment' : 'Deposit'}
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
                              placeholder="50"
                              className="w-20 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                            />
                            <span className="text-xs text-zinc-500">% charged upfront</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Item actions */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-800">
                      <button
                        onClick={() => {
                          setItems(prev => prev.filter((_, i) => i !== idx))
                          setEditingIdx(null)
                        }}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove package
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
                <p className="text-sm mb-3">No packages yet.</p>
                <button
                  onClick={addNewItem}
                  className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors"
                >
                  + Add your first package
                </button>
              </div>
            )}
            
            {!pageId && items.length > 0 && (
              <div className="text-xs text-zinc-500 text-center mt-4">
                Note: Packages will be saved after you click &quot;Publish Page&quot;. You can edit them anytime.
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
                  <h3 className="text-sm font-bold text-white">Require Payments Before Starting</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Process deposits or full payments for project requests via Paystack.
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
                          {m === 'full' ? '💳 Full Payment' : '💰 Deposit First'}
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
                          value={typeof depositPct === 'number' ? depositPct : 50}
                          onChange={(e) => setDepositPct(parseInt(e.target.value))}
                          className="flex-1 accent-emerald-500"
                        />
                        <span className="text-lg font-bold text-white w-12 text-right">
                          {typeof depositPct === 'number' ? depositPct : 50}%
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 mt-1">
                        Clients pay {typeof depositPct === 'number' ? depositPct : 50}% to start the project. (Can be overridden per package)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
