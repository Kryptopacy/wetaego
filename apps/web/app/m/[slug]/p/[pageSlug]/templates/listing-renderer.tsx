import Link from 'next/link'

interface PageItem {
  id: string
  title: string
  subtitle?: string
  description?: string
  price_minor?: number
  price_display?: string
  availability_status: string
  images?: string[]
  item_data?: Record<string, string>
}

interface ListingRendererProps {
  location: {
    name: string
    theme_color?: string
    cover_image_url?: string
    organizations?: { logo_url?: string }
    whatsapp_number?: string
    phone_number?: string
  }
  page: {
    id: string
    title: string
    content?: string
  }
  items: PageItem[]
  locationSlug: string
  referralSource?: string
}

export function ListingRenderer({ location, page, items, locationSlug }: ListingRendererProps) {
  const themeColor = location.theme_color || '#7c3aed'
  const available = items.filter(i => i.availability_status === 'available')
  const unavailable = items.filter(i => i.availability_status !== 'available')

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      {/* Hero */}
      <div className="relative w-full h-[35vh] min-h-[240px] max-h-[380px] overflow-hidden">
        {location.cover_image_url ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${location.cover_image_url})` }} />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${themeColor}30 0%, #0a0a0f 100%)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-5xl mx-auto">
          {location.organizations?.logo_url && (
            <img src={location.organizations.logo_url} alt="" className="h-10 w-auto mb-3 drop-shadow-lg" />
          )}
          <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-lg">{page.title}</h1>
          {page.content && <p className="text-white/60 text-sm mt-1 max-w-lg">{page.content}</p>}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <Link href={`/m/${locationSlug}`} className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {location.name}
        </Link>

        {/* Stats bar */}
        <div className="flex gap-4 mb-6 text-xs text-zinc-500 font-medium">
          <span>{items.length} properties</span>
          <span>·</span>
          <span className="text-emerald-400">{available.length} available</span>
          {unavailable.length > 0 && <><span>·</span><span>{unavailable.length} unavailable</span></>}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => {
            const isAvail = item.availability_status === 'available'
            return (
              <div key={item.id} className={`rounded-2xl border overflow-hidden transition-all ${isAvail ? 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700' : 'border-zinc-800/40 bg-zinc-900/20 opacity-60'}`}>
                <Link href={`/m/${locationSlug}/p/${page.slug || page.id}/${item.id}`} className="block">
                  {/* Image placeholder */}
                  <div className="h-44 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${themeColor}20, #0a0a0f)` }}>
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    )}
                    {!isAvail && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-xs font-bold text-zinc-400 bg-zinc-900 px-3 py-1 rounded-full">
                          {item.availability_status === 'sold_out' ? 'Taken' : 'Unavailable'}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link href={`/m/${locationSlug}/p/${page.slug || page.id}/${item.id}`} className="hover:text-zinc-300 transition-colors">
                      <h3 className="font-bold text-white text-sm leading-tight">{item.title}</h3>
                    </Link>
                    {(item.price_display || item.price_minor) && (
                      <div className="text-right shrink-0">
                        <div className="font-bold text-white text-sm">
                          {item.price_display || (item.price_minor ? `₦${(item.price_minor / 100).toLocaleString()}` : '')}
                        </div>
                        {!item.price_display && item.price_minor && <div className="text-xs text-zinc-500">/month</div>}
                      </div>
                    )}
                  </div>
                  {item.subtitle && <p className="text-xs text-zinc-500 mb-2">{item.subtitle}</p>}
                  {item.description && <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{item.description}</p>}

                  {/* Spec pills */}
                  {item.item_data && Object.keys(item.item_data).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {Object.entries(item.item_data).slice(0, 3).map(([k, v]) => (
                        <span key={k} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">{v}</span>
                      ))}
                    </div>
                  )}

                  {isAvail && (
                    <a
                      href={`https://wa.me/${(location.whatsapp_number || '').replace(/[^0-9]/g, '')}?text=Hi, I'm interested in: ${item.title}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                      style={{ background: `linear-gradient(135deg, ${themeColor}cc, ${themeColor}88)` }}
                    >
                      Enquire →
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-16 text-zinc-600 text-sm">No listings yet.</div>
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
