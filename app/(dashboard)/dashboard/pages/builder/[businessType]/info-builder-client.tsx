'use client'

import { toast } from 'sonner';

import { useState, useTransition } from 'react';

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { BusinessTypePreset } from '@/lib/templates/presets'
import { createCustomPage, updatePage } from '../../actions'

interface Props {
  preset?: BusinessTypePreset
  businessType: string
  orgId: string
  orgName: string
  locationId: string
  locationSlug: string
  mode: string
  existingPage: Record<string, unknown> | null
  defaultTitle: string
}

export function InfoBuilderClient({
  preset,
  businessType,
  // orgId and orgName provided by parent
  locationId,
  locationSlug,
  mode,
  existingPage,
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

  // Template data state for Social Media
  const existingTemplateData = (existingPage?.template_data as Record<string, unknown>) || {}
  const [whatsapp, setWhatsapp] = useState((existingTemplateData.whatsapp_number as string) || '')
  const [phone, setPhone] = useState((existingTemplateData.phone_number as string) || '')
  const [instagram, setInstagram] = useState((existingTemplateData.instagram_handle as string) || '')
  const [xHandle, setXHandle] = useState((existingTemplateData.x_handle as string) || '')
  const [tiktok, setTiktok] = useState((existingTemplateData.tiktok_handle as string) || '')

  const [activeSection, setActiveSection] = useState<'details' | 'contact'>('details')
  const pageId = existingPage?.id as string | undefined

  function handleTitleChange(val: string) {
    setPageTitle(val)
    if (!pageId) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    }
  }

  async function handleSavePage() {
    if (!pageTitle.trim()) return

    const formData = new FormData()
    formData.set('title', pageTitle)
    formData.set('content', pageDescription)
    
    // Add social fields
    if (whatsapp) formData.set('whatsapp_number', whatsapp)
    if (phone) formData.set('phone_number', phone)
    if (instagram) formData.set('instagram_handle', instagram)
    if (xHandle) formData.set('x_handle', xHandle)
    if (tiktok) formData.set('tiktok_handle', tiktok)

    if (pageId) {
      formData.set('pageId', pageId)
      // Pass required defaults for updatePage
      formData.set('billing_enabled', existingPage?.billing_enabled ? 'true' : 'false')
      formData.set('billing_mode', (existingPage?.billing_mode as string) || 'standard_checkout')
      formData.set('payment_mode', (existingPage?.payment_mode as string) || 'full')
      if (existingPage?.deposit_percentage) formData.set('deposit_percentage', existingPage.deposit_percentage.toString())
      formData.set('randomizer_enabled', existingPage?.randomizer_enabled ? 'true' : 'false')
      formData.set('hide_delivery', existingTemplateData.hide_delivery ? 'true' : 'false')
      formData.set('milestones_enabled', existingTemplateData.milestones_enabled ? 'true' : 'false')
      
      startTransition(async () => {
        const updateRes = await updatePage(formData);
        if (updateRes?.serverError || updateRes?.validationErrors) { toast.error(updateRes.serverError || 'Update failed'); return; }
        router.refresh()
      })
    } else {
      formData.set('slug', slug)
      formData.set('location_id', locationId)
      formData.set('template_type', preset?.template_type || 'info')
      formData.set('is_primary', isPrimary.toString())
      formData.set('billing_enabled', 'false')
      formData.set('billing_mode', 'standard_checkout')
      formData.set('payment_mode', 'full')
      formData.set('business_type_preset', businessType)

      startTransition(async () => {
        const createRes = await createCustomPage(formData);
        if (createRes?.serverError || createRes?.validationErrors) { toast.error(createRes.serverError || 'Creation failed'); return; }
      })
    }
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ourmenu.os'}/m/${locationSlug}/p/${slug}`
  const icon = preset?.icon || '📝'
  const label = preset?.label || 'Information Page'

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
            {icon} {label}
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
          {(['details', 'contact'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                activeSection === s
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {s === 'details' ? '📝 Content & Details' : '📱 Social Medias & Contact'}
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
                Page Content (Markdown Supported)
              </label>
              <p className="text-xs text-zinc-500 mb-3">
                Use **bold** for emphasis, - for bullet lists, and # for headings.
              </p>
              <textarea
                value={pageDescription}
                onChange={(e) => setPageDescription(e.target.value)}
                rows={12}
                placeholder="Write your About Us, FAQ, or Information content here..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 focus:outline-none transition-colors font-mono"
              />
            </div>

            {/* Public URL preview */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 mt-6">
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Your public link</div>
              <div className="text-sm text-blue-400 font-mono break-all">{publicUrl}</div>
            </div>

            {/* Primary page toggle info */}
            {mode === 'primary' && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mt-4">
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

        {/* ── CONTACT & SOCIALS ─────────────────────────────────────────── */}
        {activeSection === 'contact' && (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-base font-bold text-white">Social Media & Contact Info</h2>
              <p className="text-xs text-zinc-500 mt-1">
                Add contact details and social media links specific to this page. These will be displayed at the bottom of the page. If left blank, it will fall back to your global location settings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">WhatsApp Number</label>
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="e.g. +2348012345678"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Phone Number</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +2348012345678"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Instagram Handle</label>
                <input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="e.g. @ourmenu"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">X (Twitter) Handle</label>
                <input
                  value={xHandle}
                  onChange={(e) => setXHandle(e.target.value)}
                  placeholder="e.g. @ourmenu"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">TikTok Handle</label>
                <input
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="e.g. @ourmenu"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
