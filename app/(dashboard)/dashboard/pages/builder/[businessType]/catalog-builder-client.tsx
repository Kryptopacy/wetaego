'use client'



import { toast } from 'sonner';

import { useState, useTransition } from 'react';

import Link from 'next/link'
import type { BusinessTypePreset } from '@/lib/templates/presets'
import { createCustomPage } from '../../actions'

interface CatalogItem {
  title: string
  subtitle: string
  description: string
  price_minor: number | ''
  original_price_minor: number | ''
  price_display: string
  availability_status: string
  item_data: { category?: string; variants?: string; specs?: string }
}

const emptyItem = (): CatalogItem => ({
  title: '',
  subtitle: '',
  description: '',
  price_minor: '',
  original_price_minor: '',
  price_display: '',
  availability_status: 'available',
  item_data: {},
})

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: '✅ Available' },
  { value: 'sold_out', label: '🔴 Sold Out' },
  { value: 'coming_soon', label: '🔜 Coming Soon' },
  { value: 'unavailable', label: '⏸️ Unavailable' },
]

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

export function CatalogBuilderClient({
  preset,
  businessType,
  // orgId and orgName provided by parent but not used directly in this builder
  locationId,
  locationSlug,
  mode,
  existingPage,
  existingItems,
  defaultTitle,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [pageTitle, setPageTitle] = useState((existingPage?.title as string) || defaultTitle)
  const [slug, setSlug] = useState(
    (existingPage?.slug as string) || defaultTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  )
  const [pageDescription, setPageDescription] = useState((existingPage?.content as string) || '')
  const [billingEnabled, setBillingEnabled] = useState((existingPage?.billing_enabled as boolean) ?? preset.billing_enabled)
  const [billingMode, setBillingMode] = useState((existingPage?.billing_mode as string) || preset.billing_mode)
   
  // Global Settings State
  const [randomizerEnabled, setRandomizerEnabled] = useState((existingPage?.randomizer_enabled as boolean) ?? preset.randomizer_enabled ?? false)
  const [hideDelivery, setHideDelivery] = useState((existingPage?.template_data as Record<string, unknown>)?.hide_delivery as boolean || false)
  const [refundPolicy, setRefundPolicy] = useState((existingPage?.template_data as Record<string, unknown>)?.refund_policy as string || '')
  const [paymentChannels, setPaymentChannels] = useState<string[]>((existingPage?.template_data as Record<string, unknown>)?.payment_channels as string[] || ['card', 'bank_transfer', 'ussd'])
  
  // Socials
  const [whatsapp, setWhatsapp] = useState((existingPage?.template_data as Record<string, unknown>)?.whatsapp_number as string || '')
  const [phone, setPhone] = useState((existingPage?.template_data as Record<string, unknown>)?.phone_number as string || '')
  const [instagram, setInstagram] = useState((existingPage?.template_data as Record<string, unknown>)?.instagram_handle as string || '')
  const [twitter, setTwitter] = useState((existingPage?.template_data as Record<string, unknown>)?.x_handle as string || '')
  const [tiktok, setTiktok] = useState((existingPage?.template_data as Record<string, unknown>)?.tiktok_handle as string || '')

  const [fulfillmentPickup, setFulfillmentPickup] = useState((existingPage?.template_data as Record<string, Record<string, boolean>>)?.fulfillment_options?.pickup ?? true)
  const [fulfillmentDelivery, setFulfillmentDelivery] = useState((existingPage?.template_data as Record<string, Record<string, boolean>>)?.fulfillment_options?.delivery ?? false)
  const [fulfillmentTable, setFulfillmentTable] = useState((existingPage?.template_data as Record<string, Record<string, boolean>>)?.fulfillment_options?.table ?? false)
  const [activeSection, setActiveSection] = useState<'details' | 'items' | 'settings'>('details')
  const [items, setItems] = useState<CatalogItem[]>(
    (existingItems as Record<string, unknown>[]).map(i => ({
      title: i.title as string,
      subtitle: (i.subtitle as string) || '',
      description: (i.description as string) || '',
      price_minor: (i.price_minor as number) || '',
      original_price_minor: (i.original_price_minor as number) || '',
      price_display: (i.price_display as string) || '',
      availability_status: (i.availability_status as string) || 'available',
      item_data: (i.item_data as CatalogItem['item_data']) || {},
    })) || [emptyItem()]
  )
  const [editingIdx, setEditingIdx] = useState<number | null>(existingItems.length === 0 ? 0 : null)

  const pageId = existingPage?.id as string | undefined
  const isPrimary = mode === 'primary'

  // Determine item field labels by business type
  const isRetail = ['phone_store', 'boutique', 'furniture'].includes(businessType)
  const isFood = ['restaurant', 'bar_lounge', 'food_truck'].includes(businessType)

  function handleTitleChange(val: string) {
    setPageTitle(val)
    if (!pageId) setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }

  function updateItem(idx: number, field: keyof CatalogItem, value: unknown) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  async function handleSave() {
    if (!pageTitle.trim()) return
    const fd = new FormData()
    fd.set('title', pageTitle)
    fd.set('slug', slug)
    fd.set('content', pageDescription)
    fd.set('location_id', locationId)
    fd.set('template_type', 'catalog')
    fd.set('is_primary', isPrimary.toString())
    fd.set('billing_enabled', billingEnabled.toString())
    fd.set('billing_mode', billingMode)
    fd.set('payment_mode', 'full')
    fd.set('business_type_preset', businessType)
    fd.set('randomizer_enabled', randomizerEnabled ? 'true' : 'false')

    if (pageId) {
      fd.set('pageId', pageId)
      fd.set('hide_delivery', hideDelivery ? 'true' : 'false')
      fd.set('milestones_enabled', 'false') // not used in catalog
      paymentChannels.forEach(c => fd.append('payment_channels', c))
      fd.set('refund_policy', refundPolicy)
      if (whatsapp) fd.set('whatsapp_number', whatsapp)
      if (phone) fd.set('phone_number', phone)
      if (instagram) fd.set('instagram_handle', instagram)
      if (twitter) fd.set('x_handle', twitter)
      if (tiktok) fd.set('tiktok_handle', tiktok)
      
      fd.set('fulfillment_options', JSON.stringify({
        pickup: fulfillmentPickup,
        delivery: fulfillmentDelivery,
        table: fulfillmentTable
      }))
      
      startTransition(async () => {
        const { updatePage } = await import('../../actions')
        const updateRes = await updatePage(fd);
        if (updateRes?.serverError || updateRes?.validationErrors) { toast.error(updateRes.serverError || 'Update failed'); return; }
      })
    } else {
      startTransition(async () => { const createRes = await createCustomPage(fd);
        if (createRes?.serverError || createRes?.validationErrors) { toast.error(createRes.serverError || 'Creation failed'); return; } })
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
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
          {preset.icon} {preset.label}
        </span>
        <button
          onClick={handleSave}
          disabled={isPending || !pageTitle.trim()}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 transition-all shadow-lg shadow-emerald-900/30"
        >
          {isPending ? 'Saving…' : pageId ? 'Save Changes' : 'Publish Page'}
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-12 py-10">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-zinc-900/50 p-1 rounded-xl w-fit">
          {(['details', 'items', 'settings'] as const).map(s => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                activeSection === s ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {s === 'items' ? `${preset.icon} ${isFood ? 'Menu Items' : isRetail ? 'Products' : 'Items'}` : s.charAt(0).toUpperCase() + s.slice(1)}
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
                onChange={e => handleTitleChange(e.target.value)}
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
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1 bg-transparent text-white text-sm focus:outline-none"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Description <span className="text-zinc-600 font-normal">(optional)</span>
              </label>
              <textarea
                value={pageDescription}
                onChange={e => setPageDescription(e.target.value)}
                rows={3}
                placeholder={isFood ? 'A note about your menu — specials, dietary info, etc.' : 'Describe your catalogue to customers...'}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 focus:outline-none transition-colors resize-none"
              />
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Public link</div>
              <div className="text-sm text-blue-400 font-mono break-all">{publicUrl}</div>
            </div>
          </div>
        )}

        {/* ── ITEMS ───────────────────────────────────────────────────────── */}
        {activeSection === 'items' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">
                  {isFood ? 'Menu Items' : isRetail ? 'Products' : 'Items'}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {isFood ? 'Each item appears on your digital menu' : 'Each item shows in your catalogue'}
                </p>
              </div>
              <button
                onClick={() => { setItems(p => [...p, emptyItem()]); setEditingIdx(items.length) }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-300 hover:text-white hover:border-white/20 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add {isFood ? 'Item' : 'Product'}
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className={`rounded-2xl border transition-all ${editingIdx === idx ? 'border-emerald-500/40 bg-emerald-900/5' : 'border-zinc-800 bg-zinc-900/30'}`}>
                {editingIdx !== idx ? (
                  <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setEditingIdx(idx)}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${item.availability_status === 'available' ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                      <div>
                        <span className="text-sm font-semibold text-white">{item.title || 'Untitled'}</span>
                        {item.subtitle && <span className="text-xs text-zinc-500 ml-2">{item.subtitle}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.price_minor !== '' && (
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">₦{(Number(item.price_minor) / 100).toLocaleString()}</span>
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
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                          {isFood ? 'Dish Name' : 'Product Name'} *
                        </label>
                        <input
                          value={item.title}
                          onChange={e => updateItem(idx, 'title', e.target.value)}
                          placeholder={isFood ? 'e.g. Jollof Rice' : 'e.g. iPhone 15 Pro Max'}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                          {isFood ? 'Short Note' : isRetail ? 'Variant / Model' : 'Subtitle'}
                        </label>
                        <input
                          value={item.subtitle}
                          onChange={e => updateItem(idx, 'subtitle', e.target.value)}
                          placeholder={isFood ? 'e.g. Spicy, serves 1-2' : isRetail ? 'e.g. 256GB / Midnight' : ''}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Category</label>
                      <input
                        value={item.item_data?.category || ''}
                        onChange={e => updateItem(idx, 'item_data', { ...item.item_data, category: e.target.value })}
                        placeholder="e.g. Starters, Main Course, Drinks"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Description</label>
                      <textarea
                        value={item.description}
                        onChange={e => updateItem(idx, 'description', e.target.value)}
                        rows={2}
                        placeholder={isFood ? 'Ingredients, allergens, how it tastes...' : 'Key features and specifications...'}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Price (₦)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">₦</span>
                          <input
                            type="number"
                            value={item.price_minor !== '' ? Number(item.price_minor) / 100 : ''}
                            onChange={e => updateItem(idx, 'price_minor', e.target.value ? Math.round(parseFloat(e.target.value) * 100) : '')}
                            placeholder="0"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Display Price</label>
                        <input
                          value={item.price_display}
                          onChange={e => updateItem(idx, 'price_display', e.target.value)}
                          placeholder='e.g. "from ₦50k"'
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Status</label>
                        <select
                          value={item.availability_status}
                          onChange={e => updateItem(idx, 'availability_status', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none appearance-none"
                        >
                          {AVAILABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button onClick={() => { setItems(p => p.filter((_, i) => i !== idx)); setEditingIdx(null) }} className="text-xs text-red-400 hover:text-red-300">
                        Remove
                      </button>
                      <button onClick={() => setEditingIdx(null)} className="px-4 py-1.5 rounded-lg bg-zinc-800 text-sm text-white hover:bg-zinc-700">
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── SETTINGS ────────────────────────────────────────────────────── */}
        {activeSection === 'settings' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Collect Payments</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Let customers order and pay through this page</p>
                </div>
                <button
                  onClick={() => setBillingEnabled(b => !b)}
                  className={`w-12 h-6 rounded-full transition-all relative ${billingEnabled ? 'bg-emerald-600' : 'bg-zinc-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-all ${billingEnabled ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              {billingEnabled && (
                <div className="pt-4 border-t border-zinc-800">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Checkout Mode</label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setBillingMode('table_service')}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${billingMode === 'table_service' ? 'border-emerald-500/40 bg-emerald-900/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}
                    >
                      <div className="font-bold text-sm text-white mb-0.5">🍽️ Table Service (KDS)</div>
                      <div className="text-xs text-zinc-500">Customers order by table — orders appear live in your KDS. Perfect for restaurants.</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingMode('standard_checkout')}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${billingMode === 'standard_checkout' ? 'border-emerald-500/40 bg-emerald-900/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}
                    >
                      <div className="font-bold text-sm text-white mb-0.5">🛒 Standard Checkout</div>
                      <div className="text-xs text-zinc-500">Direct Paystack checkout — payment confirmed, you&apos;re notified. Great for retail and takeaway.</div>
                    </button>
                  </div>
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

            {/* Delivery Settings */}
            <div className="flex flex-col p-4 bg-zinc-900 border border-zinc-800 rounded-xl mt-4 space-y-4">
              <div>
                <p className="text-sm font-bold text-white">Fulfillment Options</p>
                <p className="text-xs text-zinc-400 mt-0.5">Select which fulfillment methods customers can choose at checkout.</p>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={fulfillmentPickup} 
                    onChange={e => setFulfillmentPickup(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500/50"
                  />
                  Pickup
                </label>
                <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={fulfillmentDelivery} 
                    onChange={e => setFulfillmentDelivery(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500/50"
                  />
                  Delivery
                </label>
                <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={fulfillmentTable} 
                    onChange={e => setFulfillmentTable(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500/50"
                  />
                  Table Service
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl mt-4">
              <div>
                <p className="text-sm font-bold text-white">Hide Delivery Address Field</p>
                <p className="text-xs text-zinc-400 mt-0.5">Remove the delivery address input entirely from the checkout modal.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={hideDelivery} onChange={e => setHideDelivery(e.target.checked)} className="sr-only peer" />
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
                  placeholder="e.g. Orders are non-refundable after preparation has started." 
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

            {mode === 'primary' && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex gap-3">
                  <span className="text-amber-400 text-sm">⭐</span>
                  <div>
                    <div className="text-sm font-bold text-amber-300 mb-1">Primary Page</div>
                    <div className="text-xs text-zinc-400">
                      Shown when scanning your main QR at <span className="text-white font-mono">/m/{locationSlug}</span>
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
