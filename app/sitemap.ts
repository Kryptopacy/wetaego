import { MetadataRoute } from 'next'
import { createClient } from '../lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // Fetch all locations
  const { data: locations } = await supabase
    .from('locations')
    .select('slug, updated_at')

  const baseUrl = 'https://ourmenuos.online'

  const menuUrls = (locations || []).map((loc) => ({
    url: `${baseUrl}/m/${loc.slug}`,
    lastModified: new Date(loc.updated_at),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // Fetch all published location pages (portal pages)
  const { data: locationPages } = await supabase
    .from('location_pages')
    .select('slug, updated_at, locations(slug)')
    .eq('is_published', true)

  interface LocationPage {
    slug: string
    updated_at: string
    locations?: { slug: string } | null
  }

  const portalUrls = ((locationPages as unknown as LocationPage[]) || []).map((page) => ({
    url: `${baseUrl}/m/${page.locations?.slug}/p/${page.slug}`,
    lastModified: new Date(page.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    ...menuUrls,
    ...portalUrls,
  ]
}
