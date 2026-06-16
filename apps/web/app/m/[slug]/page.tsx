/* eslint-disable */
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { ItemCard } from './item-card'
import { CartFAB } from './cart-fab'
import { CallStaffFAB } from './call-staff-fab'
import { AIChat } from './ai-chat'
import { MenuRenderer } from './menu-renderer'
import { LiveOrderTracker } from './live-order-tracker'
import { RouletteFAB } from './roulette-fab'

// Revalidate this page every 60 seconds (Incremental Static Regeneration)
// This ensures edge caching handles high traffic seamlessly
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const supabase = await createClient()
  const { data: location } = await supabase.from('locations').select('name').eq('slug', resolvedParams.slug).single()
  
  if (!location) return { title: 'Not Found' }
  
  return {
    title: `${location.name} - Menu | OurMenu OS`,
    description: `View the live menu and order directly from your table at ${location.name}.`,
    openGraph: {
      title: `${location.name} Menu`,
      description: `View the live menu and order directly from your table at ${location.name}.`,
      type: 'website',
    }
  }
}

export default async function PublicMenuPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ qr_id?: string }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const slug = resolvedParams.slug
  const qrId = resolvedSearchParams.qr_id

  const supabase = await createClient()

  // 1. Find the location by slug
  let location: any = null

  const { data } = await supabase
    .from('locations')
    .select('id, name, organization_id, ai_enabled, ai_name, theme_color, cover_image_url, operating_hours, wifi_network, wifi_password, instagram_handle, twitter_handle, facebook_handle, whatsapp_number, phone_number, google_maps_url, organizations(logo_url)')
    .eq('slug', slug)
    .single()
  location = data

  if (!location) {
    notFound()
  }

  // 1.5 Handle Dynamic QR Routing
  let tableIdentifier = undefined

  if (qrId) {
    const { data: qrCode } = await supabase
      .from('qr_codes')
      .select('table_identifier, is_active')
      .eq('id', qrId)
      .eq('location_id', location.id)
      .single()

    if (!qrCode || !qrCode.is_active) {
      return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Invalid QR Code</h1>
          <p className="text-zinc-400">This QR code is either invalid or inactive.</p>
        </div>
      )
    }

    if (!qrCode.table_identifier) {
      return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Unassigned Table</h1>
          <p className="text-zinc-400 mb-8">This table has not been assigned a location yet. Please ask a host for assistance.</p>
          <a href={`/dashboard/qr/provision?id=${qrId}`} className="text-blue-500 text-sm font-medium hover:underline">
            Are you a host? Tap here to assign this table.
          </a>
        </div>
      )
    }

    tableIdentifier = qrCode.table_identifier
  }

  // 2. Find the active menu for this location
  let categories: any[] = []

  const { data: menu } = await supabase
    .from('menus')
    .select('id')
    .eq('location_id', location.id)
    .single()

  if (menu) {
    // 3. Fetch categories and items
    const { data } = await supabase
      .from('menu_categories')
      .select('*, menu_items(*)')
      .eq('menu_id', menu.id)
      .order('sort_order')
    
    categories = data || []
  }

  const allMenuItems = categories.flatMap(cat => 
    (cat.menu_items || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      price_minor: item.price_minor
    }))
  )

  // Generate JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": location.name,
    "hasMenu": {
      "@type": "Menu",
      "hasMenuSection": categories.map(cat => ({
        "@type": "MenuSection",
        "name": cat.name,
        "hasMenuItem": (cat.menu_items || []).map((item: any) => ({
          "@type": "MenuItem",
          "name": item.name,
          "description": item.description,
          "offers": {
            "@type": "Offer",
            "price": item.price_minor / 100,
            "priceCurrency": "NGN"
          }
        }))
      }))
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-[#f5f7f5] dark:bg-zinc-950 font-sans text-[#17201b] dark:text-zinc-100 pb-32 transition-colors">
        {/* Elevated Cover Image Hero Section */}
        <header className="relative w-full h-[35vh] min-h-[280px] max-h-[400px] overflow-hidden">
          {location.cover_image_url ? (
            <div 
              className="absolute inset-0 bg-cover bg-center" 
              style={{ backgroundImage: `url(${location.cover_image_url})` }}
            />
          ) : (
            <div 
              className="absolute inset-0"
              style={{ 
                background: `radial-gradient(circle at 100% 0%, ${location.theme_color || '#0f7b55'} 0%, transparent 60%), linear-gradient(135deg, #111814 0%, #17201b 100%)` 
              }}
            >
              <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] bg-[length:20px_20px]" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/30 dark:bg-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 max-w-2xl mx-auto flex flex-col justify-end h-full">
            {location.organizations?.logo_url && (
              <div className="mb-4">
                <img src={location.organizations.logo_url} alt="Logo" className="h-16 w-auto object-contain rounded-lg drop-shadow-md" />
              </div>
            )}
            <div className="flex items-center flex-wrap gap-3 mb-2">
              <h1 className="text-4xl font-black text-white tracking-tight leading-none drop-shadow-lg">
                {location.name}
              </h1>
              {tableIdentifier && (
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white font-bold text-sm shadow-sm border border-white/30 drop-shadow-md">
                  {tableIdentifier}
                </span>
              )}
            </div>
            <p className="text-white/90 text-sm md:text-base font-medium drop-shadow-md max-w-md mb-4">
              {tableIdentifier 
                ? 'Welcome to our digital menu. Your order will be brought to your table.'
                : 'Welcome to our digital menu. Order at the counter.'}
            </p>

            {/* Persistent Venue Info */}
            {(() => {
              const isDemo = slug === 'demo-venue'
              const hours = location.operating_hours || (isDemo ? 'Mon-Sun, 11am-11pm' : null)
              const wifiName = location.wifi_network || (isDemo ? 'ArtisanGrill_Guest' : null)
              const wifiPass = location.wifi_password || (isDemo ? 'artisangrill' : null)
              const ig = location.instagram_handle || (isDemo ? 'theartisangrill' : null)
              const tw = location.twitter_handle || null
              const fb = location.facebook_handle || null
              const wa = location.whatsapp_number || null
              const phone = location.phone_number || null
              const mapUrl = location.google_maps_url || null
              
              if (!hours && !wifiName && !ig && !tw && !fb && !wa && !phone && !mapUrl) return null

              return (
                <div className="flex flex-wrap gap-2 mt-2">
                  {hours && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-medium text-white/90">
                      <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {hours}
                    </div>
                  )}
                  {wifiName && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-medium text-white/90">
                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                      </svg>
                      {wifiName} {wifiPass && <span className="opacity-60 ml-0.5">({wifiPass})</span>}
                    </div>
                  )}
                  {ig && (
                    <a 
                      href={`https://instagram.com/${ig.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-md border border-white/10 text-xs font-medium text-white/90"
                    >
                      <svg className="w-3.5 h-3.5 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                      </svg>
                      @{ig.replace('@', '')}
                    </a>
                  )}
                  {tw && (
                    <a 
                      href={`https://twitter.com/${tw.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-md border border-white/10 text-xs font-medium text-white/90"
                    >
                      <svg className="w-3.5 h-3.5 text-zinc-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      @{tw.replace('@', '')}
                    </a>
                  )}
                  {fb && (
                    <a 
                      href={`https://facebook.com/${fb.replace('/', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-md border border-white/10 text-xs font-medium text-white/90"
                    >
                      <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      {fb}
                    </a>
                  )}
                  {wa && (
                    <a 
                      href={`https://wa.me/${wa.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-md border border-white/10 text-xs font-medium text-white/90"
                    >
                      <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.97 0C5.36 0 0 5.361 0 11.971c0 2.639.851 5.08 2.308 7.09L.432 24l5.068-1.834A11.933 11.933 0 0011.97 23.94c6.61 0 11.971-5.36 11.971-11.97C23.94 5.36 18.58 0 11.97 0zm6.98 17.202c-.302.853-1.491 1.572-2.311 1.714-.64.111-1.472.227-4.103-.863-3.16-1.306-5.18-4.57-5.34-4.783-.16-.214-1.272-1.696-1.272-3.235 0-1.54.802-2.292 1.082-2.593.28-.3.722-.39 1.002-.39.28 0 .562.012.802.012.28 0 .662-.11 1.042.812.38.922 1.282 3.134 1.392 3.364.11.23.23.532.06 1.112-.06.18-.18.42-.36.632-.18.21-.38.452-.54.602-.18.18-.38.372-.17.732.21.36.932 1.543 2.004 2.504 1.382 1.242 2.524 1.623 2.884 1.773.36.15.582.12.802-.12.22-.24.952-1.113 1.203-1.493.25-.38.512-.32.842-.2.33.12 2.083.982 2.443 1.162.36.18.602.27.692.42.09.15.09.873-.21 1.725z"/>
                      </svg>
                      {wa}
                    </a>
                  )}
                  {phone && (
                    <a 
                      href={`tel:${phone}`}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-md border border-white/10 text-xs font-medium text-white/90"
                    >
                      <svg className="w-3.5 h-3.5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                      </svg>
                      {phone}
                    </a>
                  )}
                  {mapUrl && (
                    <a 
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-md border border-white/10 text-xs font-medium text-white/90"
                    >
                      <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      Directions
                    </a>
                  )}
                </div>
              )
            })()}
          </div>
        </header>

        <article className="px-6 max-w-2xl mx-auto pt-6 relative">
          <LiveOrderTracker organizationId={location.organization_id} locationId={location.id} />
          {/* Categories */}
          <MenuRenderer initialCategories={categories} />
        </article>

        {/* Floating Actions */}
        <CallStaffFAB organizationId={location.organization_id} locationId={location.id} tableIdentifier={tableIdentifier} />
        <RouletteFAB />
        <CartFAB organizationId={location.organization_id} locationId={location.id} tableIdentifier={tableIdentifier} />
        {location.ai_enabled && (
          <AIChat 
            locationId={location.id}
            organizationId={location.organization_id}
            aiName={location.ai_name}
            themeColor={location.theme_color}
            tableIdentifier={tableIdentifier || ''}
            menuItems={allMenuItems}
          />
        )}
      </main>
    </>
  )
}



