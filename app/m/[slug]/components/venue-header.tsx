import { ShareButton } from '@/app/components/share-button'
import { InfoStrip } from './info-strip'
import Image from 'next/image'

interface VenueHeaderProps {
  location: {
    name: string
    portal_display_name?: string | null
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
  const _isDemo = slug === 'demo-venue'

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
            quality={90}
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
            {location.portal_display_name || location.name}
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
        <InfoStrip location={location} />
      </div>
    </header>
  )
}
