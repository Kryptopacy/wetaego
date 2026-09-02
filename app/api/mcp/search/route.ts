import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { DEMO_ITEMS } from '@/lib/mcp/catalog'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || searchParams.get('query') || '').trim().toLowerCase()
    const category = (searchParams.get('category') || '').trim().toLowerCase()
    const dietaryParam = searchParams.get('dietary')
    const maxPriceParam = searchParams.get('maxPrice')
    const inStockOnly = searchParams.get('inStockOnly') !== 'false'
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const reqCurrency = searchParams.get('currency')?.toUpperCase()

    // Determine target currency: if maxPrice > 500 or currency is NGN, default to NGN; otherwise USD
    const maxPriceNum = maxPriceParam ? parseFloat(maxPriceParam) : undefined
    const isNairaMode = reqCurrency === 'NGN' || (typeof maxPriceNum === 'number' && maxPriceNum > 500)
    const targetCurrency = isNairaMode ? 'NGN' : 'USD'
    const FX_RATE = 1500

    let items = [...DEMO_ITEMS]

    // Attempt live Supabase query
    try {
      const supabase = await createAdminClient()
      const { data: dbItems } = await supabase
        .from('page_items')
        .select('id, title, description, price_minor, availability_status, item_data, location_pages(slug, title, locations(slug, name, currency_code))')
        .limit(50)

      if (dbItems && dbItems.length > 0) {
        items = dbItems.map(item => {
          const rawPage = item.location_pages as unknown as { slug?: string; title?: string; locations?: { slug?: string; name?: string; currency_code?: string } } | null
          const rawItemData = item.item_data as { category?: string; dietary_tags?: string[]; variants?: unknown[] } | null
          const pageSlug = rawPage?.slug || 'restaurant'
          const locSlug = rawPage?.locations?.slug || 'demo'
          const brandName = rawPage?.title || rawPage?.locations?.name || 'Pacy Grills & Lounge'
          
          const priceMinor = Number(item.price_minor) || 0
          const basePriceNgn = priceMinor / 100
          const basePriceUsd = Number((basePriceNgn / FX_RATE).toFixed(2))

          const activePrice = isNairaMode ? basePriceNgn : basePriceUsd
          const activePriceFormatted = isNairaMode 
            ? `₦${activePrice.toLocaleString('en-NG', { minimumFractionDigits: 2 })} NGN`
            : `$${activePrice.toFixed(2)} USD`

          return {
            itemId: item.id,
            name: item.title,
            category: rawItemData?.category || 'Mains',
            price: activePrice,
            priceMinor,
            priceFormatted: activePriceFormatted,
            description: item.description || '',
            dietaryTags: rawItemData?.dietary_tags || [],
            isAvailable: item.availability_status === 'available',
            hasModifiers: Array.isArray(rawItemData?.variants) && rawItemData.variants.length > 0,
            attributes: { brand: brandName },
            conceptSlug: pageSlug,
            conceptUrl: `https://ourmenuos.online/m/${locSlug}/p/${pageSlug}`,
          }
        })
      }
    } catch (e) {
      console.error('[MCP Search Supabase Fetch Error]:', e)
    }

    // Dynamic Filtering
    let results = items.map(it => {
      const price = isNairaMode 
        ? (it.priceMinor ? it.priceMinor / 100 : it.price * FX_RATE)
        : (it.priceMinor ? Number((it.priceMinor / 100 / FX_RATE).toFixed(2)) : it.price)
      const priceFormatted = isNairaMode 
        ? `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2 })} NGN`
        : `$${price.toFixed(2)} USD`
      return {
        ...it,
        price,
        priceFormatted
      }
    })

    if (q) {
      results = results.filter(it => it.name.toLowerCase().includes(q) || it.description.toLowerCase().includes(q) || it.category.toLowerCase().includes(q))
    }
    if (category) {
      results = results.filter(it => it.category.toLowerCase().includes(category))
    }
    if (dietaryParam) {
      const dietaryList = dietaryParam.split(',').map(d => d.trim().toLowerCase()).filter(Boolean)
      if (dietaryList.length > 0) {
        results = results.filter(it => dietaryList.every(d => it.dietaryTags.map(t => t.toLowerCase()).includes(d)))
      }
    }
    if (typeof maxPriceNum === 'number' && !isNaN(maxPriceNum)) {
      results = results.filter(it => it.price <= maxPriceNum)
    }
    if (inStockOnly) {
      results = results.filter(it => it.isAvailable)
    }

    // Sort cheapest first
    results.sort((a, b) => a.price - b.price)

    const paged = results.slice(offset, offset + limit)

    return NextResponse.json({
      venue: 'Pacy Group Multi-Concept Enterprise',
      currency: targetCurrency,
      totalFound: results.length,
      limit,
      offset,
      items: paged,
      message: `Found ${results.length} matching catalog items.`,
    })
  } catch (err: unknown) {
    console.error('[MCP Search API Error]:', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
