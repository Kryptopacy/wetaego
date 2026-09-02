import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { BUSINESS_TYPE_PRESETS } from '@/lib/templates/presets'

export const dynamic = 'force-dynamic'

/**
 * Universal Industry to Preset Mapping derived directly from BUSINESS_TYPE_PRESETS.
 * Automatically adapts whenever new presets or business verticals are added.
 */
function getPresetsForIndustry(industryQuery: string): string[] {
  const query = industryQuery.toLowerCase().trim()
  const matchedPresets = new Set<string>()

  for (const [presetKey, preset] of Object.entries(BUSINESS_TYPE_PRESETS)) {
    const group = preset.group.toLowerCase()
    const templateType = preset.template_type.toLowerCase()
    const label = preset.label.toLowerCase()
    const description = preset.description.toLowerCase()

    if (
      presetKey === query ||
      group === query ||
      templateType === query ||
      label.includes(query) ||
      description.includes(query) ||
      (query === 'dining' && (group === 'food_drink' || presetKey === 'restaurant' || presetKey === 'bar_lounge')) ||
      (query === 'wellness' && (group === 'hospitality' || presetKey === 'spa_wellness' || presetKey === 'salon')) ||
      (query === 'fashion' && (group === 'retail' || presetKey === 'boutique')) ||
      (query === 'tech' && (group === 'retail' || presetKey === 'phone_store' || presetKey === 'it_services')) ||
      (query === 'lodging' && (group === 'property' || presetKey === 'hotel' || presetKey === 'short_stay')) ||
      (query === 'creative' && (group === 'creative' || presetKey === 'influencer' || presetKey === 'photographer')) ||
      (query === 'repairs' && (group === 'services' || presetKey === 'repair_services'))
    ) {
      matchedPresets.add(presetKey)
    }
  }

  return Array.from(matchedPresets)
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

    // 4. Match industry presets dynamically
    const targetPresets = industry ? getPresetsForIndustry(industry) : []

    const venues = matchedLocations.map(loc => {
      const locPages = pagesByLocation[loc.id] || []
      
      let primaryIndustry = 'hospitality'
      if (locPages.some(p => ['restaurant', 'bar_lounge', 'food_truck', 'catering', 'other_food'].includes(p.preset))) {
        primaryIndustry = 'dining'
      } else if (locPages.some(p => ['spa_wellness', 'salon'].includes(p.preset))) {
        primaryIndustry = 'wellness'
      } else if (locPages.some(p => ['boutique', 'phone_store', 'furniture'].includes(p.preset))) {
        primaryIndustry = 'retail'
      } else if (locPages.some(p => ['hotel', 'short_stay'].includes(p.preset))) {
        primaryIndustry = 'lodging'
      } else if (locPages.some(p => ['repair_services', 'other_services'].includes(p.preset))) {
        primaryIndustry = 'services'
      } else if (locPages.some(p => ['influencer', 'photographer', 'agency', 'freelancer', 'portfolio'].includes(p.preset))) {
        primaryIndustry = 'creative'
      }

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
        return v.concepts.some(c => 
          targetPresets.includes(c.preset) || 
          c.title.toLowerCase().includes(industry) || 
          c.slug.toLowerCase().includes(industry)
        )
      })
    }

    // Fallback default if database empty or initializing
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
            { slug: 'pacy-gadgets', title: 'Pacy Gadgets', preset: 'phone_store', templateType: 'catalog', url: 'https://ourmenuos.online/m/demo/p/pacy-gadgets' },
            { slug: 'pacy-stays', title: 'Pacy Stays', preset: 'short_stay', templateType: 'listing', url: 'https://ourmenuos.online/m/demo/p/pacy-stays' },
            { slug: 'pacy-hotels', title: 'Pacy Hotels', preset: 'hotel', templateType: 'booking', url: 'https://ourmenuos.online/m/demo/p/pacy-hotels' },
            { slug: 'pacy-repairs', title: 'Pacy Gadget Repairs', preset: 'repair_services', templateType: 'quote', url: 'https://ourmenuos.online/m/demo/p/pacy-repairs' },
            { slug: 'pacy-media', title: 'Pacy Media Studio', preset: 'influencer', templateType: 'rate_card', url: 'https://ourmenuos.online/m/demo/p/pacy-media' },
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
