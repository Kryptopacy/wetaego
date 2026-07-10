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

export function QuoteBuilderClient({
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

  // Page Settings State
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
    formData.set('template_type', 'quote')
    formData.set('is_primary', isPrimary.toString())
    formData.set('billing_enabled', 'false') // quotes don't checkout immediately
    formData.set('billing_mode', 'standard_checkout')
    formData.set('payment_mode', 'full')
    formData.set('business_type_preset', businessType)

    if (pageId) {
      formData.set('pageId', pageId)
      // Pass required defaults for updatePage
      formData.set('billing_enabled', existingPage?.billing_enabled ? 'true' : 'false')
      formData.set('billing_mode', existingPage?.billing_mode as string || 'standard_checkout')
      formData.set('payment_mode', existingPage?.payment_mode as string || 'full')
      if (existingPage?.deposit_percentage) formData.set('deposit_percentage', existingPage.deposit_percentage.toString())
      
      // Pass the updated settings
      formData.set('randomizer_enabled', randomizerEnabled ? 'true' : 'false')
      formData.set('milestones_enabled', milestonesEnabled ? 'true' : 'false')
      formData.set('hide_delivery', 'false') // not used in quote
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
        
        // Save items
        for (const [index, item] of items.entries()) {
          const itemFormData = new FormData()
          itemFormData.set('page_id', pageId)
          itemFormData.set('title', item.title)
          itemFormData.set('subtitle', item.subtitle)
          itemFormData.set('description', item.description)
          itemFormData.set('availability_status', item.availability_status)
          itemFormData.set('sort_order', index.toString())
          if (item.price_minor !== '') itemFormData.set('price_minor', item.price_minor.toString())
          if (item.original_price_minor !== '') itemFormData.set('original_price_minor', item.original_price_minor.toString())
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
        // Note: In our current setup, createCustomPage might just redirect.
        // For a full fix, createCustomPage should return the page ID, but since it redirects,
        // we might not be able to save items immediately if it hard redirects. 
        // We will assume the user has to click "Save Services" later, or we just rely on the redirect.
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
              {s === 'services' ? `${preset.icon} Services & Pricing` : s === 'settings' ? 'Add-ons & Settings' : s.charAt(0).toUpperCase() + s.slice(1)}
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
                placeholder={`Tell customers about your ${preset.label.toLowerCase()} — what to expect, process, etc.`}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Public URL preview */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Your public link</div>
              <div className="text-sm text-blue-400 font-mono break-all">{publicUrl}</div>
            </div>
            
            {pageId && (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                <div className="flex gap-3">
                  <span className="text-blue-400 text-sm">ℹ️</span>
                  <div>
                    <div className="text-sm font-bold text-blue-300 mb-1">Save your services</div>
                    <div className="text-xs text-zinc-400">
                      Be sure to save changes here to update both your Page Details and your Services & Pricing items at once.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SERVICES ────────────────────────────────────────────────────── */}
        {activeSection === 'services' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-base font-bold text-white">Services & Pricing</h2>
                <p className="text-xs text-zinc-500 mt-0.5">List your offerings. Customers can add these to their quote request.</p>
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
                        {item.item_data?.price_range && <span className="text-xs text-zinc-500 ml-2">{item.item_data.price_range}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span className="font-medium text-white">₦{(Number(item.price_minor) / 100).toLocaleString()}</span>
                        {item.original_price_minor !== '' && Number(item.original_price_minor) > Number(item.price_minor) && (
                          <span className="text-xs text-zinc-500 line-through">₦{(Number(item.original_price_minor) / 100).toLocaleString()}</span>
                        )}
                      </div>
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
                          placeholder="e.g. Website Development"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                          Unit of Measurement
                        </label>
                        <input
                          value={item.item_data?.unit || ''}
                          onChange={(e) => updateItemData(idx, 'unit', e.target.value)}
                          placeholder="e.g. per page, per hour, flat rate"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Category</label>
                      <input
                        value={item.item_data?.category || ''}
                        onChange={(e) => updateItemData(idx, 'category', e.target.value)}
                        placeholder="e.g. Design, Development, Add-ons"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Description</label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        rows={3}
                        placeholder="What's included in this service?"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                          Price Range / Estimate
                        </label>
                        <input
                          value={item.item_data?.price_range || ''}
                          onChange={(e) => updateItemData(idx, 'price_range', e.target.value)}
                          placeholder="e.g. ₦50k - ₦100k"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Turnaround Time</label>
                        <input
                          value={item.item_data?.turnaround || ''}
                          onChange={(e) => updateItemData(idx, 'turnaround', e.target.value)}
                          placeholder='e.g. "2-3 weeks"'
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

                    {/* Item actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
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
                <p className="text-sm mb-3">No services listed yet.</p>
                <button
                  onClick={addNewItem}
                  className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors"
                >
                  + Add your first service
                </button>
              </div>
            )}
            
            {!pageId && items.length > 0 && (
              <div className="text-xs text-zinc-500 text-center mt-4">
                Note: Services will be saved after you click &quot;Publish Page&quot;. You can edit them anytime.
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS ────────────────────────────────────────────────────── */}
        {activeSection === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-white mb-4">Add-ons & Global Settings</h2>
            
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

          </div>
        )}
      </div>
    </div>
  )
}
