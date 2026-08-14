import { StorefrontHero } from './storefront-hero'

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
    address?: string | null
  }
  slug: string
  tableIdentifier?: string
}

export function VenueHeader({ location, tableIdentifier }: VenueHeaderProps) {
  const title = location.portal_display_name || location.name
  const subtitle = tableIdentifier
    ? 'Welcome to our digital menu. Your order will be brought to your table.'
    : 'Welcome to our digital menu. Browse items and order directly.'

  return (
    <StorefrontHero
      title={title}
      subtitle={subtitle}
      badge={{ text: '🍽️ Digital Menu' }}
      coverImageUrl={location.cover_image_url}
      businessTypePreset="restaurant"
      templateType="catalog"
      logoUrl={location.organizations?.logo_url}
      themeColor={location.theme_color || '#10b981'}
      tableIdentifier={tableIdentifier}
      location={location}
      maxContentWidth="max-w-2xl"
    />
  )
}
