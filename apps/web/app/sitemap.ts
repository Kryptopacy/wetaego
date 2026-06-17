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

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    ...menuUrls,
  ]
}
