import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const INDUSTRY_PRESET_MAP: Record<string, string[]> = {
  dining: ['restaurant', 'cafe', 'bar', 'food', 'bakery', 'grill'],
  food: ['restaurant', 'cafe', 'bar', 'food', 'bakery', 'grill'],
  hospitality: ['restaurant', 'hotel', 'short_stay', 'spa_wellness', 'bar'],
  wellness: ['spa_wellness', 'salon', 'fitness'],
  retail: ['boutique', 'fashion', 'tech', 'retail'],
  lodging: ['hotel', 'short_stay'],
  services: ['repair_services', 'creator_rate_card', 'consulting'],
  media: ['creator_rate_card', 'media_production'],
  repairs: ['repair_services', 'tech_repair']
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = (searchParams.get('q') || searchParams.get('query') || '').trim().toLowerCase()
    const industry = (searchParams.get('industry') || '').trim().toLowerCase()
    const slug = (searchParams.get('slug') || '').trim().toLowerCase()
    const limit = Math.min(Number(searchParams.get('limit')) || 10, 25)

    const supabase = await createAdminClient()

    // 1. Fetch published locations
    let locQuery = supabase
      .from('locations')
      .select('id, name, slug, address, currency_code, cover_image_url, theme_color, operating_hours, brand_knowledge')
      .eq('publication_status', 'published')
      .limit(limit)

    if (slug) {
      locQuery = locQuery.eq('slug', slug)
    } else if (query) {
      locQuery = locQuery.or(`name.ilike.%${query}%,brand_knowledge.ilike.%${query}%,address.ilike.%${query}%,slug.ilike.%${query}%`)
    }

    const { data: locations, error: locError } = await locQuery
    if (locError) {
      console.error('[BusinessSearch] locations error:', locError)
    }

    const matchedLocations = locations || []

    // 2. Fetch associated concept pages for all matched locations
    const locationIds = matchedLocations.map(l => l.id)
    let pagesQuery = supabase
      .from('location_pages')
      .select('id, title, slug, content, template_type, business_type_preset, location_id')
      .eq('is_published', true)

    if (locationIds.length > 0) {
      pagesQuery = pagesQuery.in('location_id', locationIds)
    }

    const { data: pages } = await pagesQuery

    // 3. Group concept pages by location
    const pagesByLocation: Record<string, Array<{ slug: string; title: string; preset: string; templateType: string; url: string }>> = {}
    if (pages) {
      for (const p of pages) {
        if (!pagesByLocation[p.location_id]) {
          pagesByLocation[p.location_id] = []
        }
        pagesByLocation[p.location_id].push({
          slug: p.slug,
          title: p.title,
          preset: p.business_type_preset || 'catalog',
          templateType: p.template_type || 'catalog',
          url: `https://ourmenuos.online/m/${p.location_id}/p/${p.slug}`
        })
      }
    }

    // 4. Build rich venue results with semantic scoring
    const targetPresets = industry ? (INDUSTRY_PRESET_MAP[industry] || [industry]) : []

    const venues = matchedLocations.map(loc => {
      const locPages = pagesByLocation[loc.id] || []
      
      // Determine primary industry dynamically from concepts or brand knowledge
      let primaryIndustry = 'hospitality'
      const hasDining = locPages.some(p => targetPresets.includes(p.preset) || ['restaurant', 'cafe', 'bar'].includes(p.preset))
      if (hasDining) primaryIndustry = 'dining'

      return {
        slug: loc.slug,
        name: loc.name,
        industry: primaryIndustry,
        currency: loc.currency_code || 'NGN',
        venueUrl: `https://ourmenuos.online/m/${loc.slug}`,
        description: loc.brand_knowledge || `${loc.name} multi-concept business portal.`,
        concepts: locPages.map(p => ({
          ...p,
          url: `https://ourmenuos.online/m/${loc.slug}/p/${p.slug}`
        }))
      }
    })

    // Filter by industry if requested
    let filteredVenues = venues
    if (industry) {
      filteredVenues = venues.filter(v => {
        if (v.industry === industry) return true
        return v.concepts.some(c => targetPresets.includes(c.preset) || c.title.toLowerCase().includes(industry) || c.slug.toLowerCase().includes(industry))
      })
    }

    // Fallback default if database empty
    if (filteredVenues.length === 0 && (industry === 'dining' || query.includes('pacy') || !query)) {
      filteredVenues = [
        {
          slug: 'demo',
          name: 'Pacy Group (Pacy Grills & Lounge)',
          industry: 'dining',
          currency: 'USD',
          venueUrl: 'https://ourmenuos.online/m/demo/p/restaurant',
          description: 'Flagship multi-concept enterprise featuring Pacy Grills & Lounge (Fine Dining & Grills, Artisanal Vegan & Gluten-Free Specialties), Pacy Wellness Spa, Pacy Boutique, and Serviced Stays.',
          concepts: [
            { slug: 'restaurant', title: 'Pacy Grills & Lounge', preset: 'restaurant', templateType: 'catalog', url: 'https://ourmenuos.online/m/demo/p/restaurant' },
            { slug: 'pacy-wellness', title: 'Pacy Wellness Spa', preset: 'spa_wellness', templateType: 'booking', url: 'https://ourmenuos.online/m/demo/p/pacy-wellness' },
            { slug: 'pacy-boutique', title: 'Pacy Fashion', preset: 'boutique', templateType: 'catalog', url: 'https://ourmenuos.online/m/demo/p/pacy-boutique' },
          ]
        }
      ]
    }

    return NextResponse.json({
      status: 'ok',
      totalFound: filteredVenues.length,
      venues: filteredVenues,
      businesses: filteredVenues,
      message: `Found ${filteredVenues.length} matching venues.`
    })
  } catch (err: unknown) {
    console.error('[BusinessSearch API Error]:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
