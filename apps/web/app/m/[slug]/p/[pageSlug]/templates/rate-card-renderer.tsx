'use client'

import Link from 'next/link'
import Image from 'next/image'

interface PageItem {
  id: string
  title: string
  subtitle?: string
  description?: string
  price_minor?: number
  price_display?: string
  availability_status: string
  item_data?: {
    category?: string     // 'basic' | 'standard' | 'premium' | 'addon'
    includes?: string     // comma-separated list
    turnaround?: string   // e.g. "3-5 days"
    note?: string
  }
}

interface RateCardRendererProps {
  location: {
    name: string
    theme_color?: string
    cover_image_url?: string
    instagram_handle?: string
    whatsapp_number?: string
    phone_number?: string
    organizations?: { logo_url?: string }
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
}

const CATEGORY_ORDER = ['basic', 'standard', 'premium', 'addon']
const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  basic: { label: 'Basic', color: 'text-zinc-300', bg: 'bg-zinc-800/60' },
  standard: { label: 'Standard', color: 'text-blue-300', bg: 'bg-blue-500/10' },
  premium: { label: 'Premium', color: 'text-amber-300', bg: 'bg-amber-500/10' },
  addon: { label: 'Add-on', color: 'text-violet-300', bg: 'bg-violet-500/10' },
}

export function RateCardRenderer({ location, page, items, locationSlug }: RateCardRendererProps) {
  const themeColor = location.theme_color || '#7c3aed'

  // Group items by category
  const grouped: Record<string, PageItem[]> = {}
  const uncategorized: PageItem[] = []

  for (const item of items) {
    const cat = item.item_data?.category
    if (cat && CATEGORY_ORDER.includes(cat)) {
      grouped[cat] = [...(grouped[cat] || []), item]
    } else {
      uncategorized.push(item)
    }
  }

  const sections = [
    ...CATEGORY_ORDER.filter(c => grouped[c]?.length > 0).map(c => ({ key: c, items: grouped[c] })),
    ...(uncategorized.length > 0 ? [{ key: 'other', items: uncategorized }] : []),
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      {/* Hero */}
      <div className="relative w-full h-[40vh] min-h-[260px] max-h-[420px] overflow-hidden">
        {location.cover_image_url ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${location.cover_image_url})` }} />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${themeColor}30, #0a0a0f 60%)` }}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:30px_30px]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-2xl mx-auto flex items-end gap-4">
          {location.organizations?.logo_url && (
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black/40 p-1 border border-white/10">
              <Image src={location.organizations.logo_url} alt="" fill className="object-contain" />
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
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/m/${locationSlug}`} className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {location.name}
          </Link>
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

        {/* Rate sections */}
        <div className="space-y-8">
          {sections.map(({ key, items: sectionItems }) => {
            const meta = CATEGORY_LABELS[key] || { label: 'Services', color: 'text-zinc-300', bg: 'bg-zinc-800/40' }
            return (
              <div key={key}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${meta.color} ${meta.bg} border border-white/5`}>
                    {meta.label}
                  </span>
                  <div className="h-px flex-1 bg-zinc-800" />
                </div>
                <div className="space-y-3">
                  {sectionItems.map(item => (
                    <div key={item.id} className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
                      <div className="flex-1 min-w-0">
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
                      <div className="text-right shrink-0">
                        {item.price_display ? (
                          <div className="font-bold text-white">{item.price_display}</div>
                        ) : item.price_minor ? (
                          <div className="font-bold text-white">₦{(item.price_minor / 100).toLocaleString()}</div>
                        ) : (
                          <div className="text-xs text-zinc-500 italic">Price on request</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA strip */}
        <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-center">
          <p className="text-sm text-zinc-400 mb-4">Ready to work together?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {location.whatsapp_number && (
              <a
                href={`https://wa.me/${location.whatsapp_number.replace(/[^0-9]/g, '')}?text=Hi, I'd like to discuss a project`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all"
                style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.97 0C5.36 0 0 5.361 0 11.971c0 2.639.851 5.08 2.308 7.09L.432 24l5.068-1.834A11.933 11.933 0 0011.97 23.94c6.61 0 11.971-5.36 11.971-11.97C23.94 5.36 18.58 0 11.97 0z"/></svg>
                WhatsApp
              </a>
            )}
            {location.phone_number && (
              <a href={`tel:${location.phone_number}`} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-all">
                📞 Call
              </a>
            )}
          </div>
        </div>

        <div className="mt-10 text-center">
          <a href="https://ourmenuos.online" className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors">
            Powered by OurMenu OS
          </a>
        </div>
      </div>
    </div>
  )
}
