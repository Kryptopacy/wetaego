import Link from 'next/link'
import Image from 'next/image'

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
  }
  items: unknown[]
  locationSlug: string
  referralSource?: string
}

export function InfoRenderer({ location, page, locationSlug }: InfoRendererProps) {
  const themeColor = location.theme_color || '#7c3aed'
  const lines = (page.content || '').split('\n')

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
    const boldParsed = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    return (
      <p key={i} className="text-zinc-300 text-sm leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: boldParsed }} />
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      {/* Hero */}
      <div className="relative w-full h-[30vh] min-h-[200px] max-h-[300px] overflow-hidden">
        {location.cover_image_url ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${location.cover_image_url})` }} />
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
        <Link href={`/m/${locationSlug}`} className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-8 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {location.name}
        </Link>

        <div className="prose-custom space-y-1">
          {lines.map((line, i) => renderLine(line, i))}
        </div>

        {/* Contact Strip */}
        {(location.whatsapp_number || location.phone_number || location.instagram_handle || location.x_handle || location.tiktok_handle) && (
          <div className="mt-12 pt-8 border-t border-zinc-800/50">
            <h3 className="text-sm font-bold text-white mb-4 text-center">Connect with us</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {location.whatsapp_number && (
                <a
                  href={`https://wa.me/${location.whatsapp_number.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.97 0C5.36 0 0 5.361 0 11.971c0 2.639.851 5.08 2.308 7.09L.432 24l5.068-1.834A11.933 11.933 0 0011.97 23.94c6.61 0 11.971-5.36 11.971-11.97C23.94 5.36 18.58 0 11.97 0z"/></svg>
                  WhatsApp
                </a>
              )}
              {location.phone_number && (
                <a href={`tel:${location.phone_number}`} className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors">
                  📞 Call
                </a>
              )}
              {location.instagram_handle && (
                <a href={`https://instagram.com/${location.instagram_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-sm font-medium hover:bg-pink-500/20 transition-colors">
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
