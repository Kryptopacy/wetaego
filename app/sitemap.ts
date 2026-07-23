import { MetadataRoute } from 'next'
import { createAdminClient } from '../lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ourmenuos.online'

  let menuUrls: MetadataRoute.Sitemap = []
  let portalUrls: MetadataRoute.Sitemap = []

  try {
    const supabase = await createAdminClient()

    // Fetch all locations
    const { data: locations } = await supabase
      .from('locations')
      .select('slug, updated_at')

    if (locations) {
      menuUrls = locations.map((loc) => ({
        url: `${baseUrl}/m/${loc.slug}`,
        lastModified: new Date(loc.updated_at || Date.now()),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }))
    }

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

    if (locationPages) {
      portalUrls = ((locationPages as unknown as LocationPage[]) || []).map((page) => ({
        url: `${baseUrl}/m/${page.locations?.slug}/p/${page.slug}`,
        lastModified: new Date(page.updated_at || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    }
  } catch (err) {
    console.error('Failed to fetch dynamic sitemap entries:', err)
  }

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
    {
      url: `${baseUrl}/affiliates`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...menuUrls,
    ...portalUrls,
  ]
}
