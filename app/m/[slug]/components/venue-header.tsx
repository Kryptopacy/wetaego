import Image from 'next/image'
import { ShareButton } from '@/app/components/share-button'

interface VenueHeaderProps {
  location: {
    name: string
    cover_image_url?: string | null
    theme_color?: string | null
    organizations?: { logo_url?: string | null } | null
    operating_hours?: string | null
    wifi_network?: string | null
    wifi_password?: string | null
    instagram_handle?: string | null
    twitter_handle?: string | null
    facebook_handle?: string | null
    whatsapp_number?: string | null
    phone_number?: string | null
    google_maps_url?: string | null
  }
  slug: string
  tableIdentifier?: string
}

export function VenueHeader({ location, slug, tableIdentifier }: VenueHeaderProps) {
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

  const hasInfo = hours || wifiName || ig || tw || fb || wa || phone || mapUrl

  return (
    <header className="relative w-full min-h-[35vh] md:max-h-[400px] flex flex-col justify-end overflow-hidden">
      {location.cover_image_url ? (
        <div className="absolute inset-0">
          <Image 
            src={location.cover_image_url} 
            alt={`${location.name} cover`}
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMxNzIwMWIiLz48L3N2Zz4="
          />
        </div>
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
      <div className="relative z-10 w-full p-6 pt-[calc(env(safe-area-inset-top,24px)+60px)] max-w-2xl mx-auto flex flex-col justify-end mt-auto">
        {location.organizations?.logo_url && (
          <div className="mb-4">
            <div className="relative h-16 w-32 shrink-0 drop-shadow-md overflow-hidden rounded-lg">
              <Image src={location.organizations.logo_url} alt="Logo" fill className="object-contain" priority sizes="(max-width: 768px) 128px, 128px" />
            </div>
          </div>
        )}
        
        {/* Share Button top right */}
        <div className="absolute top-6 right-6 z-10">
          <ShareButton title={`${location.name} Menu`} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-black/60 transition-colors shadow-lg" />
        </div>

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
        {hasInfo && (
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
        )}
      </div>
    </header>
  )
}
