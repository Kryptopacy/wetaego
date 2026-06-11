import { MetadataRoute } from 'next'
import { createClient } from '../lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // Fetch all published menus
  const { data: menus } = await supabase
    .from('menus')
    .select('slug, updated_at')
    .eq('is_published', true)

  const baseUrl = 'https://ourmenu.os'

  const menuUrls = (menus || []).map((menu: any) => ({
    url: `${baseUrl}/m/${menu.slug}`,
    lastModified: new Date(menu.updated_at),
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
