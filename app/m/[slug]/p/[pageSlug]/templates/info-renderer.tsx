import Image from 'next/image'
import { BackButton } from '../../../components/back-button'

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
  }
  page: {
    title: string
    content?: string
    template_data?: Record<string, unknown>
  }
  items: unknown[]
  locationSlug: string
  referralSource?: string
}

export function InfoRenderer({ location, page, locationSlug }: InfoRendererProps) {
  const themeColor = location.theme_color || '#7c3aed'
  const lines = (page.content || '').split('\n')

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
    console.error('InfoRenderer parse fallback:', e)
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
    <div className="min-h-screen bg-zinc-950 text-white font-sans" style={{ backgroundColor: (page as any).background_color || undefined }}>
      {/* Hero */}
      <div className="relative w-full h-[30vh] min-h-[200px] max-h-[300px] overflow-hidden">
        {location.cover_image_url ? (
          <Image src={location.cover_image_url} alt="Cover" fill className="object-cover object-center priority" priority quality={90} sizes="100vw" />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${themeColor}30 0%, #0a0a0f 100%)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-2xl mx-auto">
          {location.organizations?.logo_url && (
            <div className="relative h-10 w-24 mb-3 drop-shadow-lg">
              <Image src={location.organizations.logo_url} alt="" fill className="object-contain" />
            </div>
          )}
          <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-lg">{page.title}</h1>
        </div>
      </div>

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
        ) : (
          <div className="prose-custom space-y-1">
            {lines.map((line, i) => renderLine(line, i))}
          </div>
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
