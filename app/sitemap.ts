import { MetadataRoute } from 'next'
import { createAdminClient } from '../lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ourmenuos.online'

  // 1. Static Core Platform Pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features/restaurant-qr-menu`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features/supermarket-multi-branch-pos`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features/salon-spa-booking-system`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features/retail-boutique-ecommerce`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features/rate-card-consulting-quotes`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features/real-estate-vehicle-listings`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features/ai-copilot-tego-multimodal`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features/payment-roulette`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features/customer-iou-financing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features/hospitality-crm-customer-broadcasts`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features/staff-intercom-kitchen-communication`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features/customer-feedback-reputation-management`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features/flash-deals-upselling-engine`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools/who-pays-the-bill`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/affiliates`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // 2. Dynamic Search-Visible Locations & Pages
  const dynamicEntries: MetadataRoute.Sitemap = []

  try {
    const supabase = await createAdminClient()

    // Fetch published & search-visible locations
    const { data: locations } = await supabase
      .from('locations')
      .select('id, slug, updated_at, is_search_visible, publication_status')
      .neq('is_search_visible', false)

    if (locations && locations.length > 0) {
      const locationIds = locations.map((l) => l.id)

      // Fetch published location pages for these locations
      const { data: locationPages } = await supabase
        .from('location_pages')
        .select('id, location_id, slug, updated_at, is_published')
        .in('location_id', locationIds)
        .eq('is_published', true)

      // Group pages by location ID
      const pagesByLocation = new Map<string, typeof locationPages>()
      if (locationPages) {
        for (const page of locationPages) {
          const existing = pagesByLocation.get(page.location_id) || []
          existing.push(page)
          pagesByLocation.set(page.location_id, existing)
        }
      }

      for (const loc of locations) {
        // Skip unpublished locations
        if (loc.publication_status && loc.publication_status !== 'published') {
          continue
        }

        const pages = pagesByLocation.get(loc.id) || []

        if (pages.length === 1) {
          // CRITICAL: When a location has exactly 1 page, /m/:slug redirects to /m/:slug/p/:pageSlug.
          // In order to avoid Google Search Console "Page with redirect" errors and failed validations,
          // we MUST ONLY emit the direct HTTP 200 URL for single-page venues!
          const singlePage = pages[0]
          dynamicEntries.push({
            url: `${baseUrl}/m/${loc.slug}/p/${singlePage.slug}`,
            lastModified: new Date(singlePage.updated_at || loc.updated_at || Date.now()),
            changeFrequency: 'daily',
            priority: 0.8,
          })
        } else if (pages.length > 1) {
          // Multi-page venues render the Portal Landing Page on /m/:slug (returns HTTP 200 OK)
          dynamicEntries.push({
            url: `${baseUrl}/m/${loc.slug}`,
            lastModified: new Date(loc.updated_at || Date.now()),
            changeFrequency: 'daily',
            priority: 0.8,
          })

          // Plus each individual sub-page
          for (const page of pages) {
            dynamicEntries.push({
              url: `${baseUrl}/m/${loc.slug}/p/${page.slug}`,
              lastModified: new Date(page.updated_at || Date.now()),
              changeFrequency: 'weekly',
              priority: 0.7,
            })
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to fetch dynamic sitemap entries:', err)
  }

  return [...staticPages, ...dynamicEntries]
}
