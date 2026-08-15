import { BackButton } from '../../../components/back-button'
import { StorefrontHero } from '../../../components/storefront-hero'
import { EmptyState } from '@/components/ui/empty-state'
import { Info } from 'lucide-react'

interface InfoRendererProps {
  location: {
    name: string
    theme_color?: string
    cover_image_url?: string
    organizations?: { logo_url?: string }
    whatsapp_number?: string
    phone_number?: string
    instagram_handle?: string
    x_handle?: string
    tiktok_handle?: string
    operating_hours?: string | null
    address?: string | null
    google_maps_url?: string | null
  }
  page: {
    title: string
    content?: string
    template_data?: Record<string, unknown>
    background_color?: string
    global_discount_enabled?: boolean
    global_discount_percentage?: number
    global_discount_banner_text?: string
  }
  items: unknown[]
  locationSlug: string
  referralSource?: string
}

export function InfoRenderer({ location, page, locationSlug }: InfoRendererProps) {
  const themeColor = location.theme_color || '#7c3aed'
  const lines = (page.content || '').split('\n').filter(Boolean)

  const whatsapp = (page.template_data?.whatsapp_number as string) || location.whatsapp_number
  const phone = (page.template_data?.phone_number as string) || location.phone_number
  const instagram = (page.template_data?.instagram_handle as string) || location.instagram_handle
  const xHandle = (page.template_data?.x_handle as string) || location.x_handle
  const tiktok = (page.template_data?.tiktok_handle as string) || location.tiktok_handle

  let parsedLinks: { label: string, url: string }[] | null = null
  try {
    const parsed = JSON.parse(page.content || '{}')
    if (parsed && Array.isArray(parsed.links)) {
      parsedLinks = parsed.links
    }
  } catch (e) {
    // Ignore JSON parse errors, fallback to markdown
  }

  function renderLine(line: string, i: number) {
    const trimmed = line.trim()
    if (!trimmed) return <div key={i} className="h-4" />
    if (trimmed.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-white mt-6 mb-2">{trimmed.slice(4)}</h3>
    if (trimmed.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold text-white mt-8 mb-3">{trimmed.slice(3)}</h2>
    if (trimmed.startsWith('# ')) return <h1 key={i} className="text-3xl font-black text-white mt-10 mb-4">{trimmed.slice(2)}</h1>
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <li key={i} className="flex gap-2 text-zinc-300 text-sm leading-relaxed mb-1.5">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: themeColor }} />
          {trimmed.slice(2)}
        </li>
      )
    }
    if (trimmed.startsWith('> ')) {
      return (
        <blockquote key={i} className="border-l-2 pl-4 italic text-zinc-400 my-4 text-sm" style={{ borderColor: themeColor }}>
          {trimmed.slice(2)}
        </blockquote>
      )
    }
    // Bold: **text**
    const parts = trimmed.split(/(\*\*.*?\*\*)/g)
    return (
      <p key={i} className="text-zinc-300 text-sm leading-relaxed mb-3">
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
            return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>
          }
          return <span key={j}>{part}</span>
        })}
      </p>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans" style={{ backgroundColor: page.background_color || undefined }}>
      {/* Universal Luxury Hero */}
      <StorefrontHero
        title={page.title}
        badge={{ text: 'ℹ️ About & Info' }}
        coverImageUrl={location.cover_image_url}
        logoUrl={location.organizations?.logo_url}
        themeColor={themeColor}
        promotionalBanner={page.global_discount_enabled ? page.global_discount_banner_text : null}
        discountPercentage={page.global_discount_enabled ? page.global_discount_percentage : null}
        location={location}
        maxContentWidth="max-w-2xl"
      />

      <div className="max-w-2xl mx-auto px-6 py-8">
        <BackButton href={`/m/${locationSlug}`} className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-8 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {location.name}
        </BackButton>

        {parsedLinks ? (
          <div className="space-y-4">
            {parsedLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full px-6 py-4 rounded-xl font-bold text-zinc-900 bg-white hover:bg-zinc-200 transition-colors shadow-sm"
              >
                {link.label}
              </a>
            ))}
          </div>
        ) : lines.length > 0 ? (
          <div className="prose-custom space-y-1">
            {lines.map((line, i) => renderLine(line, i))}
          </div>
        ) : (
          <EmptyState
            icon={Info}
            title="Information in Preparation"
            description="Details and updates will appear here once published."
            className="my-8"
          />
        )}

        {/* Contact Strip */}
        {(whatsapp || phone || instagram || xHandle || tiktok) && (
          <div className="mt-12 pt-8 border-t border-zinc-800/50">
            <h3 className="text-sm font-bold text-white mb-4 text-center">Connect with us</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.97 0C5.36 0 0 5.361 0 11.971c0 2.639.851 5.08 2.308 7.09L.432 24l5.068-1.834A11.933 11.933 0 0011.97 23.94c6.61 0 11.971-5.36 11.971-11.97C23.94 5.36 18.58 0 11.97 0z"/></svg>
                  WhatsApp
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors">
                  📞 Call
                </a>
              )}
              {instagram && (
                <a href={`https://instagram.com/${instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors">
                  Instagram
                </a>
              )}
              {xHandle && (
                <a href={`https://x.com/${xHandle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors">
                  𝕏 Twitter
                </a>
              )}
              {tiktok && (
                <a href={`https://tiktok.com/@${tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors">
                  🎵 TikTok
                </a>
              )}
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <a href="https://ourmenuos.online" className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors">
            Powered by OurMenu OS
          </a>
        </div>
      </div>
    </div>
  )
}
