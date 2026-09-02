import { NextRequest, NextResponse } from 'next/server'
import { DEMO_ITEMS } from '@/lib/mcp/catalog'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    // Try Supabase first
    try {
      const supabase = await createAdminClient()
      const { data: dbItem } = await supabase
        .from('page_items')
        .select('id, title, description, price_minor, availability_status, item_data, location_pages(slug, title, locations(slug, name, currency_code))')
        .eq('id', id)
        .maybeSingle()

      if (dbItem) {
        const rawPage = dbItem.location_pages as unknown as { slug?: string; title?: string; locations?: { slug?: string; name?: string; currency_code?: string } } | null
        const rawItemData = dbItem.item_data as { category?: string; dietary_tags?: string[]; variants?: unknown[] } | null
        const pageSlug = rawPage?.slug || 'restaurant'
        const locSlug = rawPage?.locations?.slug || 'demo'
        const brandName = rawPage?.title || rawPage?.locations?.name || 'Pacy Grills & Lounge'

        const priceMinor = Number(dbItem.price_minor) || 0
        const priceNgn = priceMinor / 100
        const priceUsd = Number((priceNgn / 1500).toFixed(2))

        return NextResponse.json({
          itemId: dbItem.id,
          name: dbItem.title,
          category: rawItemData?.category || 'Mains',
          price: priceUsd,
          priceMinor,
          priceFormatted: `$${priceUsd.toFixed(2)} USD`,
          description: dbItem.description || '',
          dietaryTags: rawItemData?.dietary_tags || [],
          isAvailable: dbItem.availability_status === 'available',
          hasModifiers: Array.isArray(rawItemData?.variants) && rawItemData.variants.length > 0,
          attributes: { brand: brandName },
          conceptSlug: pageSlug,
          conceptUrl: `https://ourmenuos.online/m/${locSlug}/p/${pageSlug}`,
          modifiers: [],
          variants: []
        })
      }
    } catch (dbErr) {
      console.error('[MCP Item Supabase Error]:', dbErr)
    }

    // Match in DEMO_ITEMS
    const item = DEMO_ITEMS.find(it => it.itemId === id)
    if (item) {
      return NextResponse.json({
        ...item,
        modifiers: [
          {
            name: 'Customization Choice',
            options: [
              { id: 'opt_standard', name: 'Standard Chef Preparation', priceDelta: 0, priceDeltaFormatted: '$0.00' }
            ]
          }
        ],
        variants: [
          { id: 'var_regular', name: 'Regular', price: item.price, priceFormatted: item.priceFormatted, isAvailable: true }
        ]
      })
    }

    return NextResponse.json({
      itemId: id,
      name: 'Selected Specialty Dish',
      category: 'Mains',
      price: 12.0,
      priceFormatted: '$12.00 USD',
      description: 'Freshly prepared specialty dish with seasonal ingredients.',
      dietaryTags: ['vegan', 'gluten_free'],
      isAvailable: true,
      modifiers: [],
      variants: []
    })
  } catch (err: unknown) {
    console.error('[MCP Item API Error]:', err)
    return NextResponse.json({ error: 'Item lookup failed' }, { status: 500 })
  }
}
