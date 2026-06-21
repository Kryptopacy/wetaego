import Link from 'next/link'
import Image from 'next/image'

// The catalog page renderer is a light version for pages created via the pages builder
// (NOT the main /m/[slug] menu — that stays as is).
// Used for: retail stores, phone shops, boutiques, secondary menu pages, etc.

interface PageItem {
  id: string
  title: string
  subtitle?: string
  description?: string
  price_minor?: number
  price_display?: string
  availability_status: string
  item_data?: { category?: string }
}

interface CatalogPageRendererProps {
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
    billing_enabled?: boolean
    billing_mode?: string
  }
  items: PageItem[]
  locationSlug: string
  referralSource?: string
}

const AVAILABILITY_STYLES: Record<string, string> = {
  available: 'text-emerald-400',
  sold_out: 'text-red-400',
  coming_soon: 'text-blue-400',
  unavailable: 'text-zinc-500',
}

const AVAILABILITY_LABELS: Record<string, string> = {
  available: 'In Stock',
  sold_out: 'Sold Out',
  coming_soon: 'Coming Soon',
  unavailable: 'Unavailable',
}

export function CatalogPageRenderer({ location, page, items, locationSlug }: CatalogPageRendererProps) {
  const themeColor = location.theme_color || '#7c3aed'

  // Group by category if any items have one
  const categories = [...new Set(items.map(i => i.item_data?.category).filter(Boolean) as string[])]
  const hasCategories = categories.length > 0

  const groupedItems = hasCategories
    ? Object.fromEntries(categories.map(cat => [cat, items.filter(i => i.item_data?.category === cat)]))
    : { all: items }

  const uncategorized = hasCategories ? items.filter(i => !i.item_data?.category) : []

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      {/* Hero */}
      <div className="relative w-full h-[32vh] min-h-[220px] max-h-[340px] overflow-hidden">
        {location.cover_image_url ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${location.cover_image_url})` }} />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${themeColor}30, #0a0a0f)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 max-w-4xl mx-auto">
          {location.organizations?.logo_url && (
            <div className="relative h-10 w-24 mb-3 drop-shadow-lg">
              <Image src={location.organizations.logo_url} alt="" fill className="object-contain" />
            </div>
          )}
          <h1 className="text-3xl font-black text-white">{page.title}</h1>
          {page.content && <p className="text-white/60 text-sm mt-1">{page.content}</p>}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <Link href={`/m/${locationSlug}`} className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {location.name}
        </Link>

        {/* Category tabs if grouped */}
        {hasCategories && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {categories.map(cat => (
              <a key={cat} href={`#${cat}`} className="shrink-0 px-4 py-1.5 rounded-full text-xs font-bold bg-zinc-800/80 text-zinc-300 border border-zinc-700 hover:border-zinc-500 transition-colors capitalize">
                {cat}
              </a>
            ))}
          </div>
        )}

        {/* Items */}
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([cat, catItems]) => (
            <div key={cat} id={cat}>
              {hasCategories && cat !== 'all' && (
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 capitalize">{cat}</h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {catItems.map(item => {
                  const isAvail = item.availability_status === 'available'
                  return (
                    <div key={item.id} className={`rounded-2xl border p-4 transition-all ${isAvail ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-800/40 bg-zinc-900/20 opacity-60'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-sm">{item.title}</h3>
                          {item.subtitle && <p className="text-xs text-zinc-500 mt-0.5">{item.subtitle}</p>}
                          {item.description && <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed line-clamp-2">{item.description}</p>}
                          <span className={`text-xs font-bold mt-2 block ${AVAILABILITY_STYLES[item.availability_status] || 'text-zinc-500'}`}>
                            {AVAILABILITY_LABELS[item.availability_status] || item.availability_status}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          {item.price_display ? (
                            <div className="font-bold text-white text-sm">{item.price_display}</div>
                          ) : item.price_minor ? (
                            <div className="font-bold text-white text-sm">₦{(item.price_minor / 100).toLocaleString()}</div>
                          ) : null}
                        </div>
                      </div>

                      {isAvail && location.whatsapp_number && (
                        <a
                          href={`https://wa.me/${location.whatsapp_number.replace(/[^0-9]/g, '')}?text=Hi, I'm interested in: ${item.title}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold text-white/90 bg-zinc-800 hover:bg-zinc-700 transition-colors"
                        >
                          Enquire
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {uncategorized.length > 0 && hasCategories && (
            <div>
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Other</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {uncategorized.map(item => (
                  <div key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-white text-sm">{item.title}</h3>
                      {item.price_minor && <span className="font-bold text-white text-sm">₦{(item.price_minor / 100).toLocaleString()}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {items.length === 0 && (
          <div className="text-center py-16 text-zinc-600 text-sm">No items yet.</div>
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
