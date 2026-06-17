import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { ShareButton } from '@/app/components/share-button'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; pageSlug: string; itemId: string }>
}): Promise<Metadata> {
  const { slug, itemId } = await params
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('page_items')
    .select('title, description, images, location_pages!inner(locations!inner(slug))')
    .eq('id', itemId)
    .single()

  if (!item || (item.location_pages as any).locations.slug !== slug) return { title: 'Not Found' }

  return {
    title: item.title,
    description: item.description?.slice(0, 160) || '',
    openGraph: {
      title: item.title,
      description: item.description?.slice(0, 160) || '',
      images: item.images?.[0] ? [{ url: item.images[0] }] : [],
    },
  }
}

export default async function ItemDetailsPage({
  params,
}: {
  params: Promise<{ slug: string; pageSlug: string; itemId: string }>
}) {
  const { slug, pageSlug, itemId } = await params
  const supabase = await createClient()

  // 1. Get location
  const { data: loc } = await supabase
    .from('locations')
    .select('id, name, theme_color, whatsapp_number')
    .eq('slug', slug)
    .single()

  if (!loc) notFound()

  // 2. Get item and verify it belongs to this page
  const { data: item } = await supabase
    .from('page_items')
    .select(`
      *,
      location_pages!inner(id, slug, template_type, billing_enabled, payment_mode, deposit_percentage)
    `)
    .eq('id', itemId)
    .eq('is_published', true)
    .single()

  if (!item || (item.location_pages as any).slug !== pageSlug) notFound()

  const pageInfo = item.location_pages as any
  const themeColor = loc.theme_color || '#7c3aed'
  const isAvailable = item.availability_status === 'available'

  // Back link text based on template
  const backText = pageInfo.template_type === 'listing' ? 'Back to Listings'
    : pageInfo.template_type === 'booking' ? 'Back to Services'
    : 'Back'

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col">
      <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-zinc-800 bg-zinc-900/50 sticky top-0 z-10 backdrop-blur-md">
        <Link href={`/m/${slug}/p/${pageSlug}`} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {backText}
        </Link>
        <ShareButton title={item.title} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors text-sm font-medium" />
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images Gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/3] md:aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 relative">
              {item.images?.[0] ? (
                <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700">
                  <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {!isAvailable && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-sm font-bold text-zinc-400 bg-zinc-900 px-4 py-1.5 rounded-full uppercase tracking-wider">
                    {item.availability_status === 'sold_out' ? 'Unavailable' : 'Currently Unavailable'}
                  </span>
                </div>
              )}
            </div>
            
            {/* Thumbnails if multiple images */}
            {item.images && item.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {item.images.map((img: string, i: number) => (
                  <div key={i} className="w-20 h-20 shrink-0 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">{item.title}</h1>
            {item.subtitle && <p className="text-lg text-zinc-400 mb-6">{item.subtitle}</p>}

            <div className="flex items-end gap-3 mb-8 pb-8 border-b border-zinc-800">
              {item.price_display ? (
                <div className="text-3xl font-black text-white">{item.price_display}</div>
              ) : item.price_minor ? (
                <div className="text-3xl font-black text-white">₦{(item.price_minor / 100).toLocaleString()}</div>
              ) : null}
              {pageInfo.template_type === 'listing' && !item.price_display && item.price_minor && (
                <div className="text-zinc-500 mb-1 font-medium">/month</div>
              )}
            </div>

            {/* Spec pills for listings */}
            {item.item_data && Object.keys(item.item_data).length > 0 && (
              <div className="mb-8 space-y-3">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Specifications</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(item.item_data as Record<string, string>).map(([k, v]) => (
                    <div key={k} className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-sm">
                      <span className="text-zinc-500 mr-2 capitalize">{k.replace('_', ' ')}:</span>
                      <span className="text-zinc-200">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {item.description && (
              <div className="mb-8 space-y-3">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</h3>
                <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                  {item.description}
                </div>
              </div>
            )}

            {/* CTA section */}
            <div className="mt-8">
              {pageInfo.template_type === 'listing' ? (
                <a
                  href={`https://wa.me/${(loc.whatsapp_number || '').replace(/[^0-9]/g, '')}?text=Hi, I'm interested in: ${item.title}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-base font-bold text-white transition-all shadow-lg"
                  style={{ background: isAvailable ? `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` : '#27272a', pointerEvents: isAvailable ? 'auto' : 'none', opacity: isAvailable ? 1 : 0.5 }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.97 0C5.36 0 0 5.361 0 11.971c0 2.639.851 5.08 2.308 7.09L.432 24l5.068-1.834A11.933 11.933 0 0011.97 23.94c6.61 0 11.971-5.36 11.971-11.97C23.94 5.36 18.58 0 11.97 0z"/></svg>
                  {isAvailable ? 'Enquire via WhatsApp' : 'Currently Unavailable'}
                </a>
              ) : (
                <Link
                  href={`/m/${slug}/p/${pageSlug}`}
                  className="flex items-center justify-center w-full py-4 rounded-xl text-base font-bold text-white transition-all shadow-lg"
                  style={{ background: isAvailable ? `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` : '#27272a' }}
                >
                  {isAvailable ? 'Return to Booking Form' : 'Back to Services'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
