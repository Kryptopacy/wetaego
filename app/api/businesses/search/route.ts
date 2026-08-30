import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || searchParams.get('query') || ''
    const industry = searchParams.get('industry') || ''
    const limit = Math.min(Number(searchParams.get('limit')) || 10, 25)

    const supabase = await createAdminClient()

    // 1. Query locations matching query or industry
    let locQuery = supabase
      .from('locations')
      .select('id, name, slug, address, currency_code, cover_image_url, theme_color, operating_hours, brand_knowledge')
      .eq('publication_status', 'published')
      .limit(limit)

    if (query) {
      locQuery = locQuery.or(`name.ilike.%${query}%,brand_knowledge.ilike.%${query}%,address.ilike.%${query}%`)
    }

    const { data: locations, error: locError } = await locQuery

    if (locError) {
      console.error('[BusinessSearch] locations error:', locError)
    }

    // 2. Query location pages (concepts like Spa, Restaurant, Tech, Stays)
    let pageQuery = supabase
      .from('location_pages')
      .select('id, title, slug, content, template_type, business_type_preset, location_id, locations(slug, name)')
      .eq('is_published', true)
      .limit(limit)

    if (query || industry) {
      const searchTerm = query || industry
      pageQuery = pageQuery.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,template_type.ilike.%${searchTerm}%`)
    }

    const { data: pages, error: pageError } = await pageQuery

    if (pageError) {
      console.error('[BusinessSearch] pages error:', pageError)
    }

    // Format unified results
    const results = []

    if (locations) {
      for (const loc of locations) {
        results.push({
          type: 'location',
          name: loc.name,
          slug: loc.slug,
          url: `https://ourmenuos.online/m/${loc.slug}`,
          address: loc.address,
          currency: loc.currency_code || 'NGN',
          operatingHours: loc.operating_hours,
          description: loc.brand_knowledge
        })
      }
    }

    if (pages) {
      for (const page of pages) {
        const rawLoc = page.locations as unknown as { slug?: string; name?: string } | null
        const locSlug = rawLoc?.slug || 'demo'
        const locName = rawLoc?.name || 'WETAEGO'
        results.push({
          type: 'concept_page',
          name: page.title,
          business: locName,
          category: page.template_type,
          preset: page.business_type_preset,
          slug: page.slug,
          url: `https://ourmenuos.online/m/${locSlug}/p/${page.slug}`,
          description: page.content
        })
      }
    }

    return NextResponse.json({
      status: 'ok',
      query,
      industry: industry || undefined,
      count: results.length,
      businesses: results
    })
  } catch (err: unknown) {
    console.error('[BusinessSearch API Error]:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
