export const revalidate = 60;
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { formatCurrency } from '@/lib/utils/currency'
import Link from 'next/link'
import Image from 'next/image'
import { ShareButton } from '@/app/components/share-button'
import { ClientCTA } from './client-cta'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; pageSlug: string; itemId: string }>
}): Promise<Metadata> {
  const { slug, itemId } = await params
  const supabase = await createClient()

  const itemQuery = supabase
    .from('page_items')
    .select('title, description, images, location_pages!inner(locations!inner(slug))')
    .eq('id', itemId)
    .single()
  const { data: item } = await itemQuery

  if (!item || (item.location_pages as { locations: { slug: string } }).locations.slug !== slug) return { title: 'Not Found' }

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
  const locQuery = supabase
    .from('locations')
    .select('id, name, theme_color, whatsapp_number, currency_code')
    .eq('slug', slug)
    .single()
  const { data: loc } = await locQuery

  if (!loc) notFound()

  // 2. Get item and verify it belongs to this page
  const itemQuery = supabase
    .from('page_items')
    .select(`
      *,
      location_pages!inner(id, slug, template_type, billing_enabled, payment_mode, deposit_percentage)
    `)
    .eq('id', itemId)
    .eq('is_published', true)
    .single()
  const { data: item } = await itemQuery

  if (!item || (item.location_pages as { slug: string }).slug !== pageSlug) notFound()

  const pageInfo = item.location_pages as { template_type: string }
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
                <Image src={item.images[0]} alt={item.title} width={600} height={600} className="w-full h-full object-cover" />
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
                    <Image src={img} alt="" width={80} height={80} className="w-full h-full object-cover" />
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
                <div className="text-3xl font-black text-white">{formatCurrency(item.price_minor, loc?.currency_code || 'NGN')}</div>
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
              <ClientCTA 
                item={{ ...item, item_data: item.item_data as Record<string, unknown>, page_id: item.page_id }}
                pageInfo={pageInfo as { template_type: string, billing_enabled: boolean, slug: string }}
                location={loc}
                isAvailable={isAvailable}
                themeColor={themeColor}
                slug={slug}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
