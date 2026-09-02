import { NextRequest, NextResponse } from 'next/server'

export const DEMO_ITEMS = [
  {
    itemId: 'item_vegan_avocado',
    name: 'Avocado Tartine & Microgreens',
    category: 'Starters',
    price: 11.0,
    priceFormatted: '$11.00 USD',
    description: 'Sourdough toast with crushed Hass avocado, lemon oil, chili flakes, and organic microgreens.',
    dietaryTags: ['vegan', 'vegetarian', 'dairy_free'],
    isAvailable: true,
    hasModifiers: true,
    attributes: { brand: 'Pacy Kitchen' },
    conceptSlug: 'restaurant',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/restaurant',
  },
  {
    itemId: 'item_green_salad',
    name: 'Green Goddess Harvest Bowl',
    category: 'Mains',
    price: 12.0,
    priceFormatted: '$12.00 USD',
    description: 'Baby kale, shaved fennel, cucumber ribbons, toasted pumpkin seeds, and green herb vinaigrette.',
    dietaryTags: ['vegan', 'vegetarian', 'gluten_free', 'dairy_free'],
    isAvailable: true,
    hasModifiers: false,
    attributes: { brand: 'Pacy Kitchen' },
    conceptSlug: 'restaurant',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/restaurant',
  },
  {
    itemId: 'item_vegan_tofu_bowl',
    name: 'Spicy Sesame Tofu Bowl',
    category: 'Mains',
    price: 14.5,
    priceFormatted: '$14.50 USD',
    description: 'Crispy marinated organic tofu, steamed brown rice, edamame, pickled cucumber, and toasted sesame tahini glaze.',
    dietaryTags: ['vegan', 'vegetarian', 'gluten_free', 'dairy_free', 'halal'],
    isAvailable: true,
    hasModifiers: true,
    attributes: { brand: 'Pacy Kitchen' },
    conceptSlug: 'restaurant',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/restaurant',
  },
  {
    itemId: 'item_truffle_fries',
    name: 'Crispy Truffle Herb Fries',
    category: 'Sides',
    price: 8.5,
    priceFormatted: '$8.50 USD',
    description: 'Hand-cut russet potatoes tossed with white truffle oil, sea salt, and fresh parsley.',
    dietaryTags: ['vegan', 'vegetarian', 'gluten_free'],
    isAvailable: true,
    hasModifiers: false,
    attributes: { brand: 'Pacy Kitchen' },
    conceptSlug: 'restaurant',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/restaurant',
  },
  {
    itemId: 'item_artisan_matcha',
    name: 'Iced Ceremonial Matcha Latte',
    category: 'Beverages',
    price: 6.5,
    priceFormatted: '$6.50 USD',
    description: 'First-harvest Uji ceremonial matcha whisked with organic oat milk and a touch of agave.',
    dietaryTags: ['vegan', 'vegetarian', 'dairy_free', 'gluten_free'],
    isAvailable: true,
    hasModifiers: false,
    attributes: { brand: 'Pacy Kitchen' },
    conceptSlug: 'restaurant',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/restaurant',
  },
  {
    itemId: 'item_grilled_salmon',
    name: 'Pan-Seared Atlantic Salmon',
    category: 'Mains',
    price: 26.0,
    priceFormatted: '$26.00 USD',
    description: 'Fresh wild-caught Atlantic salmon filet with roasted asparagus and lemon herb butter.',
    dietaryTags: ['gluten_free', 'halal'],
    isAvailable: true,
    hasModifiers: false,
    attributes: { brand: 'Pacy Kitchen' },
    conceptSlug: 'restaurant',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/restaurant',
  },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.toLowerCase()
  const category = searchParams.get('category')?.toLowerCase()
  const dietaryParam = searchParams.get('dietary')
  const maxPriceParam = searchParams.get('maxPrice')
  const inStockOnly = searchParams.get('inStockOnly') !== 'false'
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  let results = [...DEMO_ITEMS]

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
  if (maxPriceParam) {
    const maxPrice = parseFloat(maxPriceParam)
    if (!isNaN(maxPrice)) {
      results = results.filter(it => it.price <= maxPrice)
    }
  }
  if (inStockOnly) {
    results = results.filter(it => it.isAvailable)
  }

  const paged = results.slice(offset, offset + limit)

  return NextResponse.json({
    venue: 'Pacy Group Dining & Restaurant',
    currency: 'USD',
    totalFound: results.length,
    limit,
    offset,
    items: paged,
    message: `Found ${results.length} matching items.`,
  })
}
