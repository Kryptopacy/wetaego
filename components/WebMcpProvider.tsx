'use client'

import { useEffect } from 'react'
import { ensureWebMCPContext } from '@/lib/webmcp/registry'
import type { WebMCPTool } from '@/lib/webmcp/types'
import { BUSINESS_TYPE_PRESETS } from '@/lib/templates/presets'

/**
 * Authoritative WebMCP Client Provider for WETAEGO (OurMenuOS)
 * Registers the 12-tool client commerce & discovery suite onto navigator.modelContext
 * and document.modelContext using both navigator.modelContext.provideContext() and registerTool().
 *
 * Full multi-concept coverage spanning Dining, Wellness, Retail/Boutique, Electronics, Stays, Gadget Repairs, and Media.
 */

const PLATFORM_DEMO_CONTEXT = {
  venue: 'Pacy Group (Multi-Concept Enterprise)',
  currency: 'USD',
  demoSlug: 'demo',
  demoUrl: 'https://ourmenuos.online/m/demo',
}

export const DEMO_VENUES = [
  {
    slug: 'demo',
    name: 'Pacy Group (Multi-Concept Conglomerate)',
    industry: 'hospitality',
    currency: 'USD',
    venueUrl: 'https://ourmenuos.online/m/demo',
    description: 'Premier enterprise conglomerate featuring Pacy Grills & Lounge (Dining), Pacy Wellness Spa, Pacy Fashion Boutique, Pacy Gadgets, Pacy Stays (Serviced Lofts), Pacy Hotels, Pacy Gadget Repairs, and Pacy Media Studio.',
    concepts: [
      { slug: 'restaurant', title: 'Pacy Grills & Lounge', preset: 'restaurant', templateType: 'catalog' },
      { slug: 'pacy-wellness', title: 'Pacy Wellness Spa', preset: 'spa_wellness', templateType: 'booking' },
      { slug: 'pacy-boutique', title: 'Pacy Fashion', preset: 'boutique', templateType: 'catalog' },
      { slug: 'pacy-gadgets', title: 'Pacy Gadgets', preset: 'phone_store', templateType: 'catalog' },
      { slug: 'pacy-stays', title: 'Pacy Stays', preset: 'short_stay', templateType: 'listing' },
      { slug: 'pacy-hotels', title: 'Pacy Hotels', preset: 'hotel', templateType: 'booking' },
      { slug: 'pacy-repairs', title: 'Pacy Gadget Repairs', preset: 'repair_services', templateType: 'quote' },
      { slug: 'pacy-media', title: 'Pacy Media Studio', preset: 'influencer', templateType: 'rate_card' },
    ],
  },
  {
    slug: 'emerald-cafe',
    name: 'Emerald Garden Bistro',
    industry: 'dining',
    currency: 'USD',
    venueUrl: 'https://ourmenuos.online/m/emerald-cafe',
    description: 'Casual organic bistro and espresso bar with fresh plant-based meals and pastries.',
    concepts: [{ slug: 'menu', title: 'Bistro Menu', preset: 'restaurant', templateType: 'catalog' }],
  },
  {
    slug: 'ocean-ember',
    name: 'Ocean & Ember Grill',
    industry: 'dining',
    currency: 'USD',
    venueUrl: 'https://ourmenuos.online/m/ocean-ember',
    description: 'Fine dining steakhouse and fresh seafood grill.',
    concepts: [{ slug: 'menu', title: 'Steak & Grill Menu', preset: 'restaurant', templateType: 'catalog' }],
  },
  {
    slug: 'lotus-spa',
    name: 'Lotus Wellness Spa & Suites',
    industry: 'wellness',
    currency: 'USD',
    venueUrl: 'https://ourmenuos.online/m/lotus-spa',
    description: 'Holistic day spa treatments, massages, aromatherapy, and wellness packages.',
    concepts: [{ slug: 'treatments', title: 'Spa & Wellness Treatments', preset: 'spa_wellness', templateType: 'booking' }],
  },
]

/**
 * Calculates a semantic similarity score between an agent query and a business concept.
 * Dynamically resolves fuzzy keywords, tokens, presets, and titles using the canonical BUSINESS_TYPE_PRESETS.
 */
export function calculateConceptMatchScore(inputQuery: string, concept: { slug: string; title: string; preset?: string; templateType?: string }) {
  const query = inputQuery.toLowerCase().trim()
  const slug = concept.slug.toLowerCase()
  const title = concept.title.toLowerCase()
  const presetKey = (concept.preset || '').toLowerCase()

  if (slug === query || title === query) return 100
  if (slug.includes(query) || title.includes(query)) return 80

  const queryTokens = query.split(/[\s\-_]+/).filter(Boolean)
  let score = 0

  const presetMeta = BUSINESS_TYPE_PRESETS[presetKey]
  const presetLabel = (presetMeta?.label || '').toLowerCase()
  const presetGroup = (presetMeta?.group || '').toLowerCase()
  const presetDescription = (presetMeta?.description || '').toLowerCase()

  for (const token of queryTokens) {
    if (slug.includes(token)) score += 30
    if (title.includes(token)) score += 30
    if (presetKey.includes(token)) score += 25
    if (presetLabel.includes(token)) score += 25
    if (presetGroup.includes(token)) score += 20
    if (presetDescription.includes(token)) score += 15

    // Multi-industry intent clusters
    if (['restaurant', 'dining', 'grill', 'grills', 'food', 'steakhouse', 'kitchen', 'eatery', 'bistro', 'cafe', 'bar', 'lounge'].includes(token)) {
      if (presetGroup === 'food_drink' || presetKey === 'restaurant' || slug.includes('restaurant') || title.includes('grill')) score += 50
    }
    if (['spa', 'wellness', 'massage', 'therapy', 'relaxation', 'skincare', 'beauty', 'holistic', 'facial'].includes(token)) {
      if (presetKey === 'spa_wellness' || slug.includes('wellness') || title.includes('spa')) score += 50
    }
    if (['boutique', 'fashion', 'clothing', 'apparel', 'wear', 'outfit', 'style', 'dress', 'shirt'].includes(token)) {
      if (presetKey === 'boutique' || slug.includes('boutique') || title.includes('fashion')) score += 50
    }
    if (['gadgets', 'tech', 'electronics', 'phones', 'devices', 'hardware', 'store'].includes(token)) {
      if (presetKey === 'phone_store' || presetKey === 'tech' || slug.includes('gadgets')) score += 50
    }
    if (['stays', 'apartments', 'lofts', 'shortlet', 'rooms', 'rentals', 'accommodations'].includes(token)) {
      if (presetKey === 'short_stay' || slug.includes('stays')) score += 50
    }
    if (['hotel', 'hotels', 'suites', 'resort', 'lodge'].includes(token)) {
      if (presetKey === 'hotel' || slug.includes('hotel')) score += 50
    }
    if (['repairs', 'repair', 'fix', 'service', 'diagnostics', 'screen', 'soldering'].includes(token)) {
      if (presetKey === 'repair_services' || slug.includes('repairs')) score += 50
    }
    if (['media', 'creators', 'studio', 'photography', 'production', 'video', 'rate_card', 'rates'].includes(token)) {
      if (presetKey === 'influencer' || presetKey === 'photographer' || slug.includes('media')) score += 50
    }
  }

  return score
}

export const DEMO_CATALOG_ITEMS = [
  // ── 1. DINING: Pacy Grills & Lounge ──────────────────────────────────────────
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
    attributes: { brand: 'Pacy Grills & Lounge', industry: 'dining' },
    conceptSlug: 'restaurant',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/restaurant',
    modifiers: [
      {
        id: 'mod_bread',
        name: 'Bread Choice',
        required: false,
        options: [
          { id: 'opt_sourdough', name: 'Artisan Sourdough', priceDelta: 0, priceDeltaFormatted: '$0.00' },
          { id: 'opt_glutenfree', name: 'Gluten-Free Bread', priceDelta: 2.0, priceDeltaFormatted: '+$2.00' },
        ],
      },
    ],
    variants: [
      { id: 'var_regular', name: 'Regular Portion', price: 11.0, priceFormatted: '$11.00 USD', isAvailable: true },
    ],
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
    attributes: { brand: 'Pacy Grills & Lounge', industry: 'dining' },
    conceptSlug: 'restaurant',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/restaurant',
    modifiers: [],
    variants: [],
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
    attributes: { brand: 'Pacy Grills & Lounge', industry: 'dining' },
    conceptSlug: 'restaurant',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/restaurant',
    modifiers: [
      {
        id: 'mod_spice',
        name: 'Spice Level',
        required: false,
        options: [
          { id: 'opt_mild', name: 'Mild Sesame', priceDelta: 0, priceDeltaFormatted: '$0.00' },
          { id: 'opt_spicy', name: 'Extra Chili Crisp', priceDelta: 1.0, priceDeltaFormatted: '+$1.00' },
        ],
      },
    ],
    variants: [
      { id: 'var_standard', name: 'Standard Bowl', price: 14.5, priceFormatted: '$14.50 USD', isAvailable: true },
    ],
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
    attributes: { brand: 'Pacy Grills & Lounge', industry: 'dining' },
    conceptSlug: 'restaurant',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/restaurant',
    modifiers: [],
    variants: [],
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
    attributes: { brand: 'Pacy Grills & Lounge', industry: 'dining' },
    conceptSlug: 'restaurant',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/restaurant',
    modifiers: [],
    variants: [],
  },

  // ── 2. WELLNESS & SPA: Pacy Wellness Spa ─────────────────────────────────────
  {
    itemId: 'item_spa_massage_60',
    name: '60-Min Aromatherapy Swedish Massage',
    category: 'Spa Treatments',
    price: 65.0,
    priceFormatted: '$65.00 USD',
    description: 'Full-body relaxation massage using essential eucalyptus and lavender oils to ease tension.',
    dietaryTags: [],
    isAvailable: true,
    hasModifiers: true,
    attributes: { brand: 'Pacy Wellness Spa', industry: 'wellness', durationMinutes: 60, therapistGender: 'any' },
    conceptSlug: 'pacy-wellness',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/pacy-wellness',
    modifiers: [],
    variants: [],
  },

  // ── 3. RETAIL / FASHION: Pacy Fashion Boutique ───────────────────────────────
  {
    itemId: 'item_fashion_blazer',
    name: 'Structured Linen Minimalist Blazer',
    category: 'Apparel',
    price: 85.0,
    priceFormatted: '$85.00 USD',
    description: 'Tailored oversized organic linen blazer in charcoal and neutral oatmeal tones.',
    dietaryTags: [],
    isAvailable: true,
    hasModifiers: true,
    attributes: { brand: 'Pacy Fashion', industry: 'retail', sizes: ['S', 'M', 'L', 'XL'], colors: ['Charcoal', 'Oatmeal'] },
    conceptSlug: 'pacy-boutique',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/pacy-boutique',
    modifiers: [],
    variants: [],
  },

  // ── 4. TECH & GADGETS: Pacy Gadgets ──────────────────────────────────────────
  {
    itemId: 'item_tech_smartphone',
    name: 'Flagship Pro Smartphone 256GB',
    category: 'Smartphones',
    price: 799.0,
    priceFormatted: '$799.00 USD',
    description: 'Next-gen flagship smartphone with OLED display, triple lens camera system, and 2-year warranty.',
    dietaryTags: [],
    isAvailable: true,
    hasModifiers: true,
    attributes: { brand: 'Pacy Gadgets', industry: 'retail', condition: 'new', warrantyMonths: 24 },
    conceptSlug: 'pacy-gadgets',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/pacy-gadgets',
    modifiers: [],
    variants: [],
  },

  // ── 5. SHORT STAYS & HOTELS: Pacy Stays ───────────────────────────────────────
  {
    itemId: 'item_stay_penthouse',
    name: 'Serviced Executive Penthouse Loft',
    category: 'Accommodations',
    price: 180.0,
    priceFormatted: '$180.00 USD/night',
    description: 'Luxury high-rise serviced loft with panoramic city skyline view, dedicated workspace, and fast fiber WiFi.',
    dietaryTags: [],
    isAvailable: true,
    hasModifiers: false,
    attributes: { brand: 'Pacy Stays', industry: 'lodging', roomCapacity: 4, amenities: ['WiFi', 'Kitchenette', 'Balcony'] },
    conceptSlug: 'pacy-stays',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/pacy-stays',
    modifiers: [],
    variants: [],
  },

  // ── 6. REPAIRS: Pacy Gadget Repairs ──────────────────────────────────────────
  {
    itemId: 'item_repair_screen',
    name: 'Precision OLED Display Screen Replacement',
    category: 'Repair Services',
    price: 55.0,
    priceFormatted: '$55.00 USD',
    description: 'OEM-grade OLED display assembly installation with 90-day comprehensive repair warranty.',
    dietaryTags: [],
    isAvailable: true,
    hasModifiers: true,
    attributes: { brand: 'Pacy Gadget Repairs', industry: 'services', turnaroundHours: 2, warrantyDays: 90 },
    conceptSlug: 'pacy-repairs',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/pacy-repairs',
    modifiers: [],
    variants: [],
  },

  // ── 7. MEDIA: Pacy Media Studio ──────────────────────────────────────────────
  {
    itemId: 'item_media_reel_package',
    name: 'Sponsored 60s Reel & Story Campaign Package',
    category: 'Creator Packages',
    price: 250.0,
    priceFormatted: '$250.00 USD',
    description: 'High-production 4K vertical video commercial, 3x story posts, usage rights, and performance analytics.',
    dietaryTags: [],
    isAvailable: true,
    hasModifiers: false,
    attributes: { brand: 'Pacy Media Studio', industry: 'creative', turnaroundDays: 3, deliverables: '1x 4K Reel + 3x Stories' },
    conceptSlug: 'pacy-media',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/pacy-media',
    modifiers: [],
    variants: [],
  },
]

const inMemoryCart = {
  cartId: 'cart_demo_session',
  venue: 'Pacy Group Dining & Restaurant',
  currency: 'USD',
  tableIdentifier: 'Table 12',
  lines: [] as Array<{
    lineId: string
    itemId: string
    name: string
    quantity: number
    unitPrice: number
    unitPriceFormatted: string
    lineTotal: number
    lineTotalFormatted: string
    modifiers: Array<{ modifierId?: string; name: string; value: string; priceDelta?: number }>
  }>,
}

export const WEBMCP_TOOLS: WebMCPTool<any, any>[] = [
  // 1. wetaego_find_venue — page: '/' (Global Discovery)
  {
    name: 'wetaego_find_venue',
    page: '/',
    description:
      'Search and discover distinct external merchant venues or branch locations across the WETAEGO network. Use "query" for keyword/city search, "name" for exact business matching, or "slug" for direct venue URL lookup. (To switch tabs or departments inside the current venue, use wetaego_open_business_page instead.)',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text keyword or location search (e.g. "Lagos sushi", "spa Lekki").' },
        name: { type: 'string', description: 'Exact or partial business name (e.g. "Pacy Group", "Emerald Cafe").' },
        industry: {
          type: 'string',
          enum: ['dining', 'hospitality', 'wellness', 'retail', 'services', 'creator'],
          description: 'Non-overlapping industry vertical filter: "dining" (restaurants, cafes, bars), "hospitality" (hotels, stays, resorts), "wellness" (spas, salons, beauty), "retail" (boutiques, electronics, supermarkets), "services" (repairs, consulting), "creator" (media, studios, rate cards).',
        },
        slug: { type: 'string', description: 'Exact venue slug identifier (e.g. "demo", "ocean-basket").' },
        limit: { type: 'integer', minimum: 1, maximum: 50, default: 10, description: 'Max venues to return (1-50).' },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'totalFound', 'venues'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'], description: 'Execution status' },
        totalFound: { type: 'integer', description: 'Total number of matching venues' },
        slug: { type: 'string', description: 'Matched direct slug if provided' },
        venueUrl: { type: 'string', description: 'Direct URL to access the matched venue' },
        directoryUrl: { type: 'string', description: 'URL to the full business directory' },
        venues: {
          type: 'array',
          description: 'List of matching merchant venues',
          items: {
            type: 'object',
            required: ['slug', 'name', 'venueUrl'],
            properties: {
              slug: { type: 'string', description: 'Unique slug identifier for the venue' },
              name: { type: 'string', description: 'Business display name' },
              industry: { type: 'string', description: 'Industry vertical' },
              currency: { type: 'string', description: 'Default currency code (e.g. NGN, USD)' },
              venueUrl: { type: 'string', description: 'Direct storefront URL' },
              description: { type: 'string', description: 'Brief description of the venue' },
            },
          },
        },
        message: { type: 'string', description: 'Human-readable result summary' },
        _hint: { type: 'string', description: 'Actionable guidance for the AI agent' },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['status', 'totalFound', 'venues'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'], description: 'Execution status' },
        totalFound: { type: 'integer', description: 'Total number of matching venues' },
        slug: { type: 'string', description: 'Matched direct slug if provided' },
        venueUrl: { type: 'string', description: 'Direct URL to access the matched venue' },
        directoryUrl: { type: 'string', description: 'URL to the full business directory' },
        venues: {
          type: 'array',
          description: 'List of matching merchant venues',
          items: {
            type: 'object',
            required: ['slug', 'name', 'venueUrl'],
            properties: {
              slug: { type: 'string', description: 'Unique slug identifier for the venue' },
              name: { type: 'string', description: 'Business display name' },
              industry: { type: 'string', description: 'Industry vertical' },
              currency: { type: 'string', description: 'Default currency code' },
              venueUrl: { type: 'string', description: 'Direct storefront URL' },
              description: { type: 'string', description: 'Brief description of the venue' },
            },
          },
        },
        message: { type: 'string', description: 'Human-readable result summary' },
        _hint: { type: 'string', description: 'Actionable guidance for the AI agent' },
      },
    },
    execute: async ({ slug, name, industry, query, limit = 10 }: { slug?: string; name?: string; industry?: string; query?: string; limit?: number }) => {
      let results = [...DEMO_VENUES]
      if (slug) {
        results = results.filter(v => v.slug.toLowerCase() === slug.toLowerCase())
      }
      if (industry) {
        const ind = industry.toLowerCase()
        results = results.filter(v => v.industry.toLowerCase() === ind || (ind === 'dining' && v.slug === 'demo'))
      }
      if (name) {
        const n = name.toLowerCase()
        results = results.filter(v => v.name.toLowerCase().includes(n))
      }
      if (query) {
        const q = query.toLowerCase()
        results = results.filter(v => v.name.toLowerCase().includes(q) || v.description.toLowerCase().includes(q) || v.industry.toLowerCase().includes(q))
      }
      const paged = results.slice(0, limit)
      return {
        status: 'ok',
        totalFound: results.length,
        slug: slug || (results[0]?.slug ?? 'demo'),
        venueUrl: results[0]?.venueUrl || PLATFORM_DEMO_CONTEXT.demoUrl,
        venues: paged,
        message: `Found ${results.length} matching venues.`,
        _hint: `Open a venue storefront using wetaego_open_business_page or search catalog directly using wetaego_search_catalog.`,
      }
    },
  },

  // 2. wetaego_search_catalog — page: '/'
  {
    name: 'wetaego_search_catalog',
    page: '/',
    description:
      'Search catalog items, products, dishes, and services with category and price filters. Returns item details, prices, and availability.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Keyword search query for products, dishes, or services.' },
        category: { type: 'string', description: 'Category name filter (e.g. "Mains", "Apparel", "Spa Services").' },
        venueSlug: { type: 'string', description: 'Optional venue slug (e.g. "demo", "lounge") to scope search to a specific merchant.' },
        dietary: {
          type: 'array',
          items: { type: 'string', enum: ['vegan', 'vegetarian', 'halal', 'kosher', 'gluten_free', 'dairy_free', 'nut_free', 'keto'] },
          description: 'Dietary classification filters for food & dining.',
        },
        maxPrice: { type: 'number', minimum: 0, description: 'Maximum price filter in major currency units.' },
        inStockOnly: { type: 'boolean', default: true, description: 'Return only in-stock or available items.' },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20, description: 'Max items per page (1-100).' },
        offset: { type: 'integer', minimum: 0, default: 0, description: 'Pagination offset.' },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['venue', 'currency', 'totalFound', 'items'],
      properties: {
        venue: { type: 'string', description: 'Active venue name' },
        currency: { type: 'string', description: 'Currency code (e.g. NGN, USD)' },
        totalFound: { type: 'integer', description: 'Total matching items found' },
        limit: { type: 'integer', description: 'Page size limit used' },
        offset: { type: 'integer', description: 'Offset applied' },
        items: {
          type: 'array',
          description: 'List of catalog items matching filters',
          items: {
            type: 'object',
            required: ['itemId', 'name', 'price', 'priceFormatted', 'isAvailable'],
            properties: {
              itemId: { type: 'string', description: 'Unique item ID required for cart and detail actions' },
              name: { type: 'string', description: 'Item name' },
              category: { type: 'string', description: 'Menu or catalog category' },
              price: { type: 'number', description: 'Unit price in major currency units' },
              priceFormatted: { type: 'string', description: 'Formatted price with currency symbol' },
              description: { type: 'string', description: 'Item description and specifications' },
              dietaryTags: { type: 'array', items: { type: 'string' }, description: 'Applicable dietary tags for food/dining' },
              attributes: {
                type: 'object',
                description: 'Multi-industry product & service attributes',
                properties: {
                  sizes: { type: 'array', items: { type: 'string' }, description: 'Available sizes for apparel/goods' },
                  colors: { type: 'array', items: { type: 'string' }, description: 'Available colors' },
                  condition: { type: 'string', enum: ['new', 'refurbished', 'pre_owned'], description: 'Product condition' },
                  brand: { type: 'string', description: 'Brand or maker' },
                  durationMinutes: { type: 'integer', description: 'Treatment/appointment duration for wellness/services' },
                  guestCapacity: { type: 'integer', description: 'Guest capacity for hospitality/rooms/venues' },
                  roomType: { type: 'string', description: 'Room or accommodation tier' },
                  amenities: { type: 'array', items: { type: 'string' }, description: 'Included amenities or features' },
                },
              },
              isAvailable: { type: 'boolean', description: 'Whether the item is currently in stock or available' },
              hasModifiers: { type: 'boolean', description: 'Whether the item has customizable variants/options' },
              conceptSlug: { type: 'string', description: 'Department or concept slug if part of a multi-concept venue' },
              conceptUrl: { type: 'string', description: 'Direct URL to this concept department' },
            },
          },
        },
        message: { type: 'string', description: 'Summary message' },
        _hint: { type: 'string', description: 'Agent instruction note' },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['venue', 'currency', 'totalFound', 'items'],
      properties: {
        venue: { type: 'string', description: 'Active venue name' },
        currency: { type: 'string', description: 'Currency code (e.g. NGN, USD)' },
        totalFound: { type: 'integer', description: 'Total matching items found' },
        limit: { type: 'integer', description: 'Page size limit used' },
        offset: { type: 'integer', description: 'Offset applied' },
        items: {
          type: 'array',
          description: 'List of catalog items matching filters',
          items: {
            type: 'object',
            required: ['itemId', 'name', 'price', 'priceFormatted', 'isAvailable'],
            properties: {
              itemId: { type: 'string', description: 'Unique item ID required for cart and detail actions' },
              name: { type: 'string', description: 'Item name' },
              category: { type: 'string', description: 'Menu or catalog category' },
              price: { type: 'number', description: 'Unit price in major currency units' },
              priceFormatted: { type: 'string', description: 'Formatted price with currency symbol' },
              description: { type: 'string', description: 'Item description and specifications' },
              dietaryTags: { type: 'array', items: { type: 'string' }, description: 'Applicable dietary tags' },
              attributes: {
                type: 'object',
                description: 'Multi-industry product & service attributes',
                properties: {
                  sizes: { type: 'array', items: { type: 'string' }, description: 'Available sizes for apparel/goods' },
                  colors: { type: 'array', items: { type: 'string' }, description: 'Available colors' },
                  condition: { type: 'string', enum: ['new', 'refurbished', 'pre_owned'], description: 'Product condition' },
                  brand: { type: 'string', description: 'Brand or maker' },
                  durationMinutes: { type: 'integer', description: 'Treatment/appointment duration for wellness/services' },
                  guestCapacity: { type: 'integer', description: 'Guest capacity for hospitality/rooms/venues' },
                  roomType: { type: 'string', description: 'Room or accommodation tier' },
                  amenities: { type: 'array', items: { type: 'string' }, description: 'Included amenities or features' },
                },
              },
              isAvailable: { type: 'boolean', description: 'Whether the item is currently in stock' },
              hasModifiers: { type: 'boolean', description: 'Whether the item has customizable variants/options' },
              conceptSlug: { type: 'string', description: 'Department or concept slug' },
              conceptUrl: { type: 'string', description: 'Direct URL to concept department' },
            },
          },
        },
        message: { type: 'string', description: 'Summary message' },
        _hint: { type: 'string', description: 'Agent instruction note' },
      },
    },
    execute: async (input: { query?: string; category?: string; dietary?: string[]; maxPrice?: number; inStockOnly?: boolean; limit?: number; offset?: number; currency?: string; venueSlug?: string }) => {
      // Dynamic currency detection: if maxPrice > 500 or currency is NGN, treat as NGN, otherwise USD
      const isNairaSearch = input.currency?.toUpperCase() === 'NGN' || (typeof input.maxPrice === 'number' && input.maxPrice > 500)
      const targetCurrency = isNairaSearch ? 'NGN' : 'USD'
      const NGN_RATE = 1500

      let results = DEMO_CATALOG_ITEMS.map(it => {
        const price = isNairaSearch ? it.price * NGN_RATE : it.price
        const priceFormatted = isNairaSearch 
          ? `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2 })} NGN`
          : `$${price.toFixed(2)} USD`
        return {
          ...it,
          price,
          priceFormatted,
        }
      })

      if (input.venueSlug) {
        const vSlug = input.venueSlug.toLowerCase()
        results = results.filter(it => it.conceptUrl.toLowerCase().includes(`/m/${vSlug}/`) || (it.attributes?.brand && String(it.attributes.brand).toLowerCase().includes(vSlug)))
      }
      if (input.query) {
        const q = input.query.toLowerCase()
        results = results.filter(it => it.name.toLowerCase().includes(q) || it.description.toLowerCase().includes(q) || it.category.toLowerCase().includes(q))
      }
      if (input.category) {
        const cat = input.category.toLowerCase()
        results = results.filter(it => it.category.toLowerCase().includes(cat))
      }
      if (input.dietary && input.dietary.length > 0) {
        const reqDietary = input.dietary.map(d => d.toLowerCase())
        results = results.filter(it => reqDietary.every(tag => it.dietaryTags.map(t => t.toLowerCase()).includes(tag)))
      }
      if (typeof input.maxPrice === 'number') {
        results = results.filter(it => it.price <= input.maxPrice!)
      }
      if (input.inStockOnly !== false) {
        results = results.filter(it => it.isAvailable)
      }
      // Sort cheapest first if searching with price constraints or general queries
      results.sort((a, b) => a.price - b.price)

      const pageLimit = input.limit || 20
      const pageOffset = typeof input.offset === 'number' ? input.offset : 0
      const paged = results.slice(pageOffset, pageOffset + pageLimit)
      return {
        venue: 'Pacy Grills & Lounge (Pacy Group)',
        currency: targetCurrency,
        totalFound: results.length,
        limit: pageLimit,
        offset: pageOffset,
        items: paged,
        message: `Found ${results.length} matching catalog items.`,
        _hint: `Use wetaego_add_to_cart to add items to your cart session.`,
      }
    },
  },

  // 3. wetaego_get_item_details — page: '/m/{slug}'
  {
    name: 'wetaego_get_item_details',
    page: '/m/{slug}',
    description:
      'Return authoritative details for a specific catalog item using its unique itemId, including price, stock status, customizable modifier groups, dietary tags, and variant options.',
    inputSchema: {
      type: 'object',
      required: ['itemId'],
      properties: {
        itemId: { type: 'string', minLength: 1, description: 'The unique itemId from wetaego_search_catalog results.' },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['itemId', 'name', 'price', 'priceFormatted', 'isAvailable'],
      properties: {
        itemId: { type: 'string', description: 'Unique item identifier' },
        name: { type: 'string', description: 'Item name' },
        category: { type: 'string', description: 'Category name' },
        price: { type: 'number', description: 'Price in major currency units' },
        priceFormatted: { type: 'string', description: 'Formatted price with currency' },
        description: { type: 'string', description: 'Detailed item description' },
        dietaryTags: { type: 'array', items: { type: 'string' }, description: 'Dietary classifications' },
        modifiers: {
          type: 'array',
          description: 'Customization option groups and price deltas',
          items: {
            type: 'object',
            required: ['name', 'options'],
            properties: {
              id: { type: 'string', description: 'Modifier group ID' },
              name: { type: 'string', description: 'Modifier group name' },
              required: { type: 'boolean', description: 'Whether selection is mandatory' },
              options: {
                type: 'array',
                description: 'List of modifier options',
                items: {
                  type: 'object',
                  required: ['name', 'priceDelta'],
                  properties: {
                    id: { type: 'string', description: 'Option ID' },
                    name: { type: 'string', description: 'Option name' },
                    priceDelta: { type: 'number', description: 'Price difference in currency units' },
                    priceDeltaFormatted: { type: 'string', description: 'Formatted price difference' },
                  },
                },
              },
            },
          },
        },
        variants: {
          type: 'array',
          description: 'Item variant specifications',
          items: {
            type: 'object',
            required: ['name', 'price', 'isAvailable'],
            properties: {
              id: { type: 'string', description: 'Variant ID' },
              name: { type: 'string', description: 'Variant name' },
              price: { type: 'number', description: 'Variant price' },
              priceFormatted: { type: 'string', description: 'Formatted variant price' },
              isAvailable: { type: 'boolean', description: 'In-stock status' },
            },
          },
        },
        isAvailable: { type: 'boolean', description: 'In-stock availability flag' },
        error: { type: 'string', description: 'Error message if item was not found' },
        _hint: { type: 'string', description: 'Guidance note for agent' },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['itemId', 'name', 'price', 'priceFormatted', 'isAvailable'],
      properties: {
        itemId: { type: 'string', description: 'Unique item identifier' },
        name: { type: 'string', description: 'Item name' },
        category: { type: 'string', description: 'Category name' },
        price: { type: 'number', description: 'Price in major currency units' },
        priceFormatted: { type: 'string', description: 'Formatted price with currency' },
        description: { type: 'string', description: 'Detailed item description' },
        dietaryTags: { type: 'array', items: { type: 'string' }, description: 'Dietary classifications' },
        modifiers: {
          type: 'array',
          description: 'Customization option groups and price deltas',
          items: {
            type: 'object',
            required: ['name', 'options'],
            properties: {
              id: { type: 'string', description: 'Modifier group ID' },
              name: { type: 'string', description: 'Modifier group name' },
              required: { type: 'boolean', description: 'Whether selection is mandatory' },
              options: {
                type: 'array',
                description: 'List of modifier options',
                items: {
                  type: 'object',
                  required: ['name', 'priceDelta'],
                  properties: {
                    id: { type: 'string', description: 'Option ID' },
                    name: { type: 'string', description: 'Option name' },
                    priceDelta: { type: 'number', description: 'Price difference in currency units' },
                    priceDeltaFormatted: { type: 'string', description: 'Formatted price difference' },
                  },
                },
              },
            },
          },
        },
        variants: {
          type: 'array',
          description: 'Item variant specifications',
          items: {
            type: 'object',
            required: ['name', 'price', 'isAvailable'],
            properties: {
              id: { type: 'string', description: 'Variant ID' },
              name: { type: 'string', description: 'Variant name' },
              price: { type: 'number', description: 'Variant price' },
              priceFormatted: { type: 'string', description: 'Formatted variant price' },
              isAvailable: { type: 'boolean', description: 'In-stock status' },
            },
          },
        },
        isAvailable: { type: 'boolean', description: 'In-stock availability flag' },
        error: { type: 'string', description: 'Error message if item was not found' },
        _hint: { type: 'string', description: 'Guidance note for agent' },
      },
    },
    execute: async ({ itemId }: { itemId: string }) => {
      const item = DEMO_CATALOG_ITEMS.find(i => i.itemId === itemId)
      if (item) {
        return {
          itemId: item.itemId,
          name: item.name,
          category: item.category,
          price: item.price,
          priceFormatted: item.priceFormatted,
          description: item.description,
          dietaryTags: item.dietaryTags,
          modifiers: item.modifiers,
          variants: item.variants,
          isAvailable: item.isAvailable,
          _hint: `Add this item to your cart using wetaego_add_to_cart.`,
        }
      }
      return {
        itemId,
        name: 'Avocado Tartine & Microgreens',
        category: 'Starters',
        price: 11.0,
        priceFormatted: '$11.00 USD',
        description: 'Sourdough toast with crushed Hass avocado, lemon oil, chili flakes, and organic microgreens.',
        dietaryTags: ['vegan', 'vegetarian', 'dairy_free'],
        modifiers: [],
        variants: [],
        isAvailable: true,
        _hint: `Add this item to your cart using wetaego_add_to_cart.`,
      }
    },
  },

  // 4. wetaego_create_cart — page: '/m/{slug}'
  {
    name: 'wetaego_create_cart',
    page: '/m/{slug}',
    description:
      'Initialize a new shopping cart session or retrieve the existing active cart. Returns a structured "cartId" (e.g. "cart_demo_abc123") that can be passed to subsequent cart and checkout calls.',
    inputSchema: {
      type: 'object',
      properties: {
        tableIdentifier: { type: 'string', maxLength: 50, description: 'Optional table number, room, seat, or pickup counter.' },
        customerNote: { type: 'string', maxLength: 300, description: 'Optional initial order note.' },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'cartId', 'venue', 'currency', 'itemCount', 'subtotal', 'subtotalFormatted'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'], description: 'Status code' },
        cartId: { type: 'string', description: 'Unique cart session identifier (format: cart_<slug>_<id>)' },
        venue: { type: 'string', description: 'Active venue name' },
        currency: { type: 'string', description: 'Currency code' },
        itemCount: { type: 'integer', description: 'Total item quantity in cart' },
        subtotal: { type: 'number', description: 'Subtotal in major currency units' },
        subtotalFormatted: { type: 'string', description: 'Formatted subtotal with currency' },
        tableIdentifier: { type: 'string', description: 'Assigned table/room identifier' },
        _hint: { type: 'string', description: 'Agent instruction note' },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['status', 'cartId', 'venue', 'currency', 'itemCount', 'subtotal', 'subtotalFormatted'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'], description: 'Status code' },
        cartId: { type: 'string', description: 'Unique cart session identifier (format: cart_<slug>_<id>)' },
        venue: { type: 'string', description: 'Active venue name' },
        currency: { type: 'string', description: 'Currency code' },
        itemCount: { type: 'integer', description: 'Total item quantity in cart' },
        subtotal: { type: 'number', description: 'Subtotal in major currency units' },
        subtotalFormatted: { type: 'string', description: 'Formatted subtotal with currency' },
        tableIdentifier: { type: 'string', description: 'Assigned table/room identifier' },
        _hint: { type: 'string', description: 'Agent instruction note' },
      },
    },
    execute: async (input?: { tableIdentifier?: string; customerNote?: string }) => {
      inMemoryCart.cartId = `cart_demo_${Date.now().toString(36)}`
      inMemoryCart.tableIdentifier = input?.tableIdentifier || 'Table 12'
      inMemoryCart.lines = []
      return {
        status: 'ok',
        venue: 'Pacy Group Dining & Restaurant',
        currency: 'USD',
        cartId: inMemoryCart.cartId,
        itemCount: 0,
        subtotal: 0,
        subtotalFormatted: '$0.00 USD',
        tableIdentifier: inMemoryCart.tableIdentifier,
        _hint: `Cart initialized. Add items using wetaego_add_to_cart with cartId '${inMemoryCart.cartId}'.`,
      }
    },
  },

  // 5. wetaego_add_to_cart — page: '/m/{slug}'
  {
    name: 'wetaego_add_to_cart',
    page: '/m/{slug}',
    description:
      'Add an available catalog item to the active shopping cart with optional modifier selections. Returns the updated cart line items, total item count, and recalculated subtotal.',
    inputSchema: {
      type: 'object',
      required: ['itemId', 'quantity'],
      properties: {
        cartId: { type: 'string', description: 'Optional unique cart session ID. If omitted, uses active session cart.' },
        itemId: { type: 'string', minLength: 1, description: 'The unique ID of the item from wetaego_search_catalog.' },
        quantity: { type: 'integer', minimum: 1, maximum: 50, description: 'Quantity of items to add (1-50).' },
        modifiers: {
          type: 'array',
          items: {
            type: 'object',
            required: ['modifierId'],
            properties: {
              modifierId: { type: 'string', description: 'Identifier of the modifier group' },
              optionIds: { type: 'array', items: { type: 'string' }, description: 'Selected option IDs within the group' },
            },
            additionalProperties: false,
          },
          description: 'Selected modifier groups and option IDs.',
        },
        notes: { type: 'string', maxLength: 500, description: 'Special preparation instructions or customer preferences.' },
        clearExisting: { type: 'boolean', description: 'Clear existing cart items before adding, ensuring clean cross-venue isolation.' },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'success', 'cartItemCount', 'subtotal', 'subtotalFormatted'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        success: { type: 'boolean', description: 'Whether the item was added successfully' },
        message: { type: 'string', description: 'Confirmation message' },
        cartItemCount: { type: 'integer', description: 'Total item count in cart after addition' },
        subtotal: { type: 'number', description: 'Updated subtotal amount' },
        subtotalFormatted: { type: 'string', description: 'Formatted subtotal with currency' },
        lines: {
          type: 'array',
          description: 'List of line items currently in cart',
          items: {
            type: 'object',
            required: ['lineId', 'itemId', 'name', 'quantity', 'unitPrice', 'unitPriceFormatted', 'lineTotal', 'lineTotalFormatted'],
            properties: {
              lineId: { type: 'string', description: 'Unique cart line identifier' },
              itemId: { type: 'string', description: 'Item ID' },
              name: { type: 'string', description: 'Item name' },
              quantity: { type: 'integer', description: 'Line quantity' },
              unitPrice: { type: 'number', description: 'Unit price' },
              unitPriceFormatted: { type: 'string', description: 'Formatted unit price' },
              lineTotal: { type: 'number', description: 'Total price for this line' },
              lineTotalFormatted: { type: 'string', description: 'Formatted total price for this line' },
              modifiers: {
                type: 'array',
                description: 'Selected modifier options for this line item',
                items: {
                  type: 'object',
                  required: ['name', 'value'],
                  properties: {
                    modifierId: { type: 'string', description: 'Modifier identifier' },
                    name: { type: 'string', description: 'Modifier category or group name' },
                    value: { type: 'string', description: 'Selected option value' },
                    priceDelta: { type: 'number', description: 'Price adjustment' },
                  },
                },
              },
            },
          },
        },
        error: { type: 'string', description: 'Error message if addition failed' },
        _hint: { type: 'string', description: 'Agent instruction hint' },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['status', 'success', 'cartItemCount', 'subtotal', 'subtotalFormatted'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        success: { type: 'boolean', description: 'Whether the item was added successfully' },
        message: { type: 'string', description: 'Confirmation message' },
        cartItemCount: { type: 'integer', description: 'Total item count in cart after addition' },
        subtotal: { type: 'number', description: 'Updated subtotal amount' },
        subtotalFormatted: { type: 'string', description: 'Formatted subtotal with currency' },
        lines: {
          type: 'array',
          description: 'List of line items currently in cart',
          items: {
            type: 'object',
            required: ['lineId', 'itemId', 'name', 'quantity', 'unitPrice', 'unitPriceFormatted', 'lineTotal', 'lineTotalFormatted'],
            properties: {
              lineId: { type: 'string', description: 'Unique cart line identifier' },
              itemId: { type: 'string', description: 'Item ID' },
              name: { type: 'string', description: 'Item name' },
              quantity: { type: 'integer', description: 'Line quantity' },
              unitPrice: { type: 'number', description: 'Unit price' },
              unitPriceFormatted: { type: 'string', description: 'Formatted unit price' },
              lineTotal: { type: 'number', description: 'Total price for this line' },
              lineTotalFormatted: { type: 'string', description: 'Formatted total price for this line' },
              modifiers: {
                type: 'array',
                description: 'Selected modifier options for this line item',
                items: {
                  type: 'object',
                  required: ['name', 'value'],
                  properties: {
                    modifierId: { type: 'string', description: 'Modifier identifier' },
                    name: { type: 'string', description: 'Modifier category or group name' },
                    value: { type: 'string', description: 'Selected option value' },
                    priceDelta: { type: 'number', description: 'Price adjustment' },
                  },
                },
              },
            },
          },
        },
        error: { type: 'string', description: 'Error message if addition failed' },
        _hint: { type: 'string', description: 'Agent instruction hint' },
      },
    },
    execute: async (input: { itemId: string; quantity: number; cartId?: string; modifiers?: Array<{ modifierId?: string; name?: string; value?: string; priceDelta?: number }>; notes?: string; clearExisting?: boolean }) => {
      if (input.clearExisting) {
        inMemoryCart.lines = []
      }

      const item = DEMO_CATALOG_ITEMS.find(i => i.itemId === input.itemId) || {
        itemId: input.itemId,
        name: 'Avocado Tartine & Microgreens',
        price: 11.0,
        priceFormatted: '$11.00 USD',
      }
      const qty = input.quantity || 1
      const lineTotal = Number((item.price * qty).toFixed(2))
      const lineId = `line_${item.itemId}_${Date.now().toString(36)}`
      
      const newModifiers = (input.modifiers || []).map(m => ({
        modifierId: m.modifierId || 'mod_1',
        name: m.name || 'Selection',
        value: m.value || 'Standard',
        priceDelta: m.priceDelta || 0,
      }))

      inMemoryCart.lines = inMemoryCart.lines.filter(l => l.itemId !== item.itemId)
      inMemoryCart.lines.push({
        lineId,
        itemId: item.itemId,
        name: item.name,
        quantity: qty,
        unitPrice: item.price,
        unitPriceFormatted: `$${item.price.toFixed(2)} USD`,
        lineTotal,
        lineTotalFormatted: `$${lineTotal.toFixed(2)} USD`,
        modifiers: newModifiers,
      })

      const totalCount = inMemoryCart.lines.reduce((acc, l) => acc + l.quantity, 0)
      const subtotal = Number(inMemoryCart.lines.reduce((acc, l) => acc + l.lineTotal, 0).toFixed(2))
      return {
        status: 'ok',
        success: true,
        message: `Added ${qty}x ${item.name} ($${subtotal.toFixed(2)} USD) to cart.`,
        cartItemCount: totalCount,
        subtotal,
        subtotalFormatted: `$${subtotal.toFixed(2)} USD`,
        lines: inMemoryCart.lines,
        _hint: `Item added. Use wetaego_get_cart to inspect cart or wetaego_initiate_checkout to proceed.`,
      }
    },
  },

  // 6. wetaego_get_cart — page: '/m/{slug}'
  {
    name: 'wetaego_get_cart',
    page: '/m/{slug}',
    description:
      'Return the current cart contents, line items, validated unit prices, modifiers, discount breakdown, applied taxes, and authoritative final total.',
    inputSchema: {
      type: 'object',
      properties: {
        cartId: { type: 'string', description: 'Optional unique cart session ID to inspect. If omitted, returns active session cart.' },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['venue', 'currency', 'itemCount', 'lines', 'subtotal', 'subtotalFormatted', 'total', 'totalFormatted'],
      properties: {
        venue: { type: 'string', description: 'Active venue name' },
        currency: { type: 'string', description: 'Currency code (e.g. NGN, USD)' },
        itemCount: { type: 'integer', description: 'Total item quantity in cart' },
        lines: {
          type: 'array',
          description: 'Detailed list of lines in the cart',
          items: {
            type: 'object',
            required: ['lineId', 'itemId', 'name', 'quantity', 'unitPrice', 'unitPriceFormatted', 'lineTotal', 'lineTotalFormatted'],
            properties: {
              lineId: { type: 'string' },
              itemId: { type: 'string' },
              name: { type: 'string' },
              quantity: { type: 'integer' },
              unitPrice: { type: 'number' },
              unitPriceFormatted: { type: 'string' },
              lineTotal: { type: 'number' },
              lineTotalFormatted: { type: 'string', description: 'Formatted total price for this line' },
              modifiers: {
                type: 'array',
                description: 'Applied modifier and option selections for this line item',
                items: {
                  type: 'object',
                  required: ['name', 'value'],
                  properties: {
                    modifierId: { type: 'string', description: 'Modifier identifier' },
                    name: { type: 'string', description: 'Modifier group name' },
                    value: { type: 'string', description: 'Selected option value' },
                    priceDelta: { type: 'number', description: 'Price adjustment' },
                  },
                },
              },
            },
          },
        },
        subtotal: { type: 'number', description: 'Subtotal before discounts and taxes' },
        subtotalFormatted: { type: 'string', description: 'Formatted subtotal' },
        discountAmount: { type: 'number', description: 'Total discount amount applied' },
        discountPercentage: { type: 'number', description: 'Discount percentage if coupon/promotions applied' },
        tax: { type: 'number', description: 'Calculated VAT or sales tax' },
        fees: { type: 'number', description: 'Service or delivery fees' },
        total: { type: 'number', description: 'Final authoritative total amount' },
        totalFormatted: { type: 'string', description: 'Formatted final total with currency' },
        _hint: { type: 'string', description: 'Agent instruction guidance' },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['venue', 'currency', 'itemCount', 'lines', 'subtotal', 'subtotalFormatted', 'total', 'totalFormatted'],
      properties: {
        venue: { type: 'string', description: 'Active venue name' },
        currency: { type: 'string', description: 'Currency code (e.g. NGN, USD)' },
        itemCount: { type: 'integer', description: 'Total item quantity in cart' },
        lines: {
          type: 'array',
          description: 'Detailed list of lines in the cart',
          items: {
            type: 'object',
            required: ['lineId', 'itemId', 'name', 'quantity', 'unitPrice', 'unitPriceFormatted', 'lineTotal', 'lineTotalFormatted'],
            properties: {
              lineId: { type: 'string' },
              itemId: { type: 'string' },
              name: { type: 'string' },
              quantity: { type: 'integer' },
              unitPrice: { type: 'number' },
              unitPriceFormatted: { type: 'string' },
              lineTotal: { type: 'number' },
              lineTotalFormatted: { type: 'string' },
              modifiers: {
                type: 'array',
                description: 'Applied modifier and option selections for this line item',
                items: {
                  type: 'object',
                  required: ['name', 'value'],
                  properties: {
                    modifierId: { type: 'string', description: 'Modifier identifier' },
                    name: { type: 'string', description: 'Modifier group name' },
                    value: { type: 'string', description: 'Selected option value' },
                    priceDelta: { type: 'number', description: 'Price adjustment' },
                  },
                },
              },
            },
          },
        },
        subtotal: { type: 'number', description: 'Subtotal before discounts and taxes' },
        subtotalFormatted: { type: 'string', description: 'Formatted subtotal' },
        discountAmount: { type: 'number', description: 'Total discount amount applied' },
        discountPercentage: { type: 'number', description: 'Discount percentage if coupon/promotions applied' },
        tax: { type: 'number', description: 'Calculated VAT or sales tax' },
        fees: { type: 'number', description: 'Service or delivery fees' },
        total: { type: 'number', description: 'Final authoritative total amount' },
        totalFormatted: { type: 'string', description: 'Formatted final total with currency' },
        _hint: { type: 'string', description: 'Agent instruction guidance' },
      },
    },
    execute: async (_input?: { cartId?: string }) => {
      const totalCount = inMemoryCart.lines.reduce((acc, l) => acc + l.quantity, 0)
      const subtotal = Number(inMemoryCart.lines.reduce((acc, l) => acc + l.lineTotal, 0).toFixed(2))
      return {
        venue: 'Pacy Grills & Lounge (Pacy Group)',
        currency: 'USD',
        itemCount: totalCount,
        lines: inMemoryCart.lines,
        subtotal,
        subtotalFormatted: `$${subtotal.toFixed(2)} USD`,
        discountAmount: 0,
        discountPercentage: 0,
        tax: 0,
        fees: 0,
        total: subtotal,
        totalFormatted: `$${subtotal.toFixed(2)} USD`,
        _hint: `Cart active. Use wetaego_initiate_checkout to proceed with order.`,
      }
    },
  },

  // 7. wetaego_update_cart — page: '/m/{slug}'
  {
    name: 'wetaego_update_cart',
    page: '/m/{slug}',
    description:
      'Modify the quantity of an existing line item in the cart or remove it completely by setting quantity to 0.',
    inputSchema: {
      type: 'object',
      required: ['lineId'],
      properties: {
        cartId: { type: 'string', description: 'Optional unique cart session ID. If omitted, updates active cart.' },
        lineId: { type: 'string', minLength: 1, description: 'The unique lineId of the item to update.' },
        quantity: { type: 'integer', minimum: 0, maximum: 50, description: 'New quantity. Set to 0 to remove item.' },
        notes: { type: 'string', maxLength: 500, description: 'Updated preparation notes or instructions.' },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'success', 'remainingLines', 'subtotalFormatted'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        success: { type: 'boolean', description: 'Whether the update succeeded' },
        message: { type: 'string', description: 'Summary message of modification' },
        remainingLines: { type: 'integer', description: 'Number of distinct line items remaining in cart' },
        totalItemCount: { type: 'integer', description: 'Total item quantity in cart' },
        subtotal: { type: 'number', description: 'Recalculated subtotal' },
        subtotalFormatted: { type: 'string', description: 'Formatted subtotal with currency' },
        error: { type: 'string', description: 'Error message if lineId was not found' },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['status', 'success', 'remainingLines', 'subtotalFormatted'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        success: { type: 'boolean', description: 'Whether the update succeeded' },
        message: { type: 'string', description: 'Summary message of modification' },
        remainingLines: { type: 'integer', description: 'Number of distinct line items remaining in cart' },
        totalItemCount: { type: 'integer', description: 'Total item quantity in cart' },
        subtotal: { type: 'number', description: 'Recalculated subtotal' },
        subtotalFormatted: { type: 'string', description: 'Formatted subtotal with currency' },
        error: { type: 'string', description: 'Error message if lineId was not found' },
      },
    },
    execute: async (input: { lineId: string; quantity?: number; cartId?: string; notes?: string }) => {
      if (typeof input.quantity === 'number') {
        if (input.quantity <= 0) {
          inMemoryCart.lines = inMemoryCart.lines.filter(l => l.lineId !== input.lineId)
        } else {
          const target = inMemoryCart.lines.find(l => l.lineId === input.lineId)
          if (target) {
            target.quantity = input.quantity
            target.lineTotal = Number((target.unitPrice * input.quantity).toFixed(2))
            target.lineTotalFormatted = `$${target.lineTotal.toFixed(2)} USD`
          }
        }
      }
      const totalCount = inMemoryCart.lines.reduce((acc, l) => acc + l.quantity, 0)
      const subtotal = Number(inMemoryCart.lines.reduce((acc, l) => acc + l.lineTotal, 0).toFixed(2))
      return {
        status: 'ok',
        success: true,
        message: `Cart updated.`,
        remainingLines: inMemoryCart.lines.length,
        totalItemCount: totalCount,
        subtotal,
        subtotalFormatted: `$${subtotal.toFixed(2)} USD`,
      }
    },
  },

  // 8. wetaego_recommend_pairings — page: '/m/{slug}'
  {
    name: 'wetaego_recommend_pairings',
    page: '/m/{slug}',
    description:
      'Suggest complementary catalog items, sides, drinks, or accessories. If itemId is omitted, recommendations are generated based on the active cart items or top venue specialties; if itemId is provided, recommendations specifically complement that item.',
    inputSchema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Optional focal item ID. If omitted, pairings are selected from current cart items or venue favorites.' },
        maxRecommendations: { type: 'integer', minimum: 1, maximum: 10, default: 3, description: 'Maximum pairing recommendations to return (1-10).' },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['venue', 'currency', 'count', 'recommendations'],
      properties: {
        venue: { type: 'string', description: 'Active venue name' },
        currency: { type: 'string', description: 'Currency code' },
        count: { type: 'integer', description: 'Number of pairings returned' },
        recommendations: {
          type: 'array',
          description: 'Recommended pairing catalog items',
          items: {
            type: 'object',
            required: ['itemId', 'name', 'price', 'priceFormatted'],
            properties: {
              itemId: { type: 'string', description: 'Unique item ID' },
              name: { type: 'string', description: 'Item name' },
              category: { type: 'string', description: 'Category name' },
              price: { type: 'number', description: 'Price in major currency units' },
              priceFormatted: { type: 'string', description: 'Formatted price with currency' },
              description: { type: 'string', description: 'Item description' },
              reason: { type: 'string', description: 'Why this pairing is recommended' },
            },
          },
        },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['venue', 'currency', 'count', 'recommendations'],
      properties: {
        venue: { type: 'string', description: 'Active venue name' },
        currency: { type: 'string', description: 'Currency code' },
        count: { type: 'integer', description: 'Number of pairings returned' },
        recommendations: {
          type: 'array',
          description: 'Recommended pairing catalog items',
          items: {
            type: 'object',
            required: ['itemId', 'name', 'price', 'priceFormatted'],
            properties: {
              itemId: { type: 'string', description: 'Unique item ID' },
              name: { type: 'string', description: 'Item name' },
              category: { type: 'string', description: 'Category name' },
              price: { type: 'number', description: 'Price in major currency units' },
              priceFormatted: { type: 'string', description: 'Formatted price with currency' },
              description: { type: 'string', description: 'Item description' },
              reason: { type: 'string', description: 'Why this pairing is recommended' },
            },
          },
        },
      },
    },
    execute: async (_input: { itemId?: string; maxRecommendations?: number }) => ({
      venue: PLATFORM_DEMO_CONTEXT.venue,
      currency: PLATFORM_DEMO_CONTEXT.currency,
      count: 2,
      recommendations: [
        {
          itemId: 'item_pairing_1',
          name: 'House Special Mocktail',
          category: 'Beverages',
          price: 2500,
          priceFormatted: `2,500.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
          description: 'Refreshing citrus mocktail blend',
          reason: 'Popular drink pairing with dining selections',
        },
        {
          itemId: 'item_pairing_2',
          name: 'Truffle Fries Side',
          category: 'Sides',
          price: 3200,
          priceFormatted: `3,200.00 ${PLATFORM_DEMO_CONTEXT.currency}`,
          description: 'Hand-cut fries with parmesan and truffle oil',
          reason: 'Highly rated complementary side',
        },
      ],
    }),
  },

  // 9. wetaego_open_business_page — page: '/m/{slug}'
  {
    name: 'wetaego_open_business_page',
    page: '/m/{slug}',
    description:
      'Switch the active storefront viewport to an internal department or category catalog tab (such as "restaurant", "spa", "tech-boutique", "hotel", "creator-rate-card", "repairs", "services") inside the current merchant venue. (To search for other businesses or branches, use wetaego_find_venue.)',
    inputSchema: {
      type: 'object',
      required: ['conceptSlug'],
      properties: {
        conceptSlug: {
          type: 'string',
          description: 'The slug or keyword of the internal department/concept to open (e.g. "restaurant", "spa", "boutique", "gadgets", "stays", "hotels", "repairs", "media").',
        },
        venueSlug: {
          type: 'string',
          description: 'Optional venue slug (e.g. "demo", "lounge"). If omitted, uses the active venue.',
        },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'conceptSlug', 'destinationUrl'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        conceptSlug: { type: 'string', description: 'The opened concept slug' },
        destinationUrl: { type: 'string', description: 'Full URL of the destination department page' },
        message: { type: 'string', description: 'Navigation status description' },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['status', 'conceptSlug', 'destinationUrl'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        conceptSlug: { type: 'string', description: 'The opened concept slug' },
        destinationUrl: { type: 'string', description: 'Full URL of the destination department page' },
        message: { type: 'string', description: 'Navigation status description' },
      },
    },
    execute: async ({ conceptSlug, venueSlug }: { conceptSlug: string; venueSlug?: string }) => {
      const activeVenue = (venueSlug ? DEMO_VENUES.find(v => v.slug.toLowerCase() === venueSlug.toLowerCase()) : null) || DEMO_VENUES[0]
      const availableConcepts = activeVenue.concepts || [
        { slug: 'restaurant', title: 'Pacy Grills & Lounge', preset: 'restaurant', templateType: 'catalog' },
      ]

      // Dynamically score all available concepts against the agent query
      let bestMatch = availableConcepts[0]
      let highestScore = -1

      for (const concept of availableConcepts) {
        const score = calculateConceptMatchScore(conceptSlug, concept)
        if (score > highestScore) {
          highestScore = score
          bestMatch = concept
        }
      }

      const destination = `/m/${activeVenue.slug}/p/${bestMatch.slug}`
      return {
        status: 'ok',
        conceptSlug: bestMatch.slug,
        destinationUrl: `https://ourmenuos.online${destination}`,
        message: `Navigated to ${bestMatch.title} (${bestMatch.slug}) department catalog at ${activeVenue.name}.`,
      }
    },
  },

  // 10. wetaego_initiate_checkout — page: '/m/{slug}/checkout'
  {
    name: 'wetaego_initiate_checkout',
    page: '/m/{slug}/checkout',
    description:
      'Validate the current cart and generate a locked checkout session with computed taxes, fulfillment options, and totals. Locks prices for 15 minutes. Does NOT charge the customer — call wetaego_submit_order with customer confirmation to finalize.',
    inputSchema: {
      type: 'object',
      required: ['fulfillment'],
      properties: {
        cartId: { type: 'string', description: 'Optional cart session ID to checkout. If omitted, uses active session cart.' },
        fulfillment: { type: 'string', enum: ['dine_in', 'pickup', 'delivery'], description: 'Fulfillment method.' },
        tableIdentifier: { type: 'string', maxLength: 50, description: 'Table number, room, seat, or pickup counter.' },
        customer: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Customer full name' },
            email: { type: 'string', format: 'email', description: 'Customer contact email' },
            phone: { type: 'string', description: 'Customer phone number' },
          },
          additionalProperties: false,
        },
        notes: { type: 'string', maxLength: 1000, description: 'Order-level fulfillment notes.' },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'checkoutId', 'fulfillment', 'currency', 'total', 'totalFormatted', 'requiresPaymentAuthorization'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        checkoutId: { type: 'string', description: 'Unique checkout session identifier required for wetaego_submit_order' },
        fulfillment: { type: 'string', description: 'Selected fulfillment method' },
        venue: { type: 'string', description: 'Active venue name' },
        currency: { type: 'string', description: 'Currency code' },
        subtotal: { type: 'number', description: 'Subtotal amount' },
        tax: { type: 'number', description: 'Calculated tax/VAT amount' },
        fees: { type: 'number', description: 'Applicable service fees' },
        total: { type: 'number', description: 'Final order total amount' },
        totalFormatted: { type: 'string', description: 'Formatted total with currency' },
        itemCount: { type: 'integer', description: 'Total item quantity in order' },
        expiresAt: { type: 'string', format: 'date-time', description: 'ISO timestamp when the 15-minute price lock expires' },
        priceLockValidMinutes: { type: 'integer', description: 'Price lock duration in minutes (15)' },
        requiresPaymentAuthorization: { type: 'boolean', description: 'Always true: order requires explicit customer confirmation' },
        message: { type: 'string', description: 'Instructions for the agent' },
        error: { type: 'string', description: 'Error message if checkout cannot be prepared' },
        _hint: { type: 'string', description: 'Agent workflow guidance' },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['status', 'checkoutId', 'fulfillment', 'currency', 'total', 'totalFormatted', 'requiresPaymentAuthorization'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        checkoutId: { type: 'string', description: 'Unique checkout session identifier required for wetaego_submit_order' },
        fulfillment: { type: 'string', description: 'Selected fulfillment method' },
        venue: { type: 'string', description: 'Active venue name' },
        currency: { type: 'string', description: 'Currency code' },
        subtotal: { type: 'number', description: 'Subtotal amount' },
        tax: { type: 'number', description: 'Calculated tax/VAT amount' },
        fees: { type: 'number', description: 'Applicable service fees' },
        total: { type: 'number', description: 'Final order total amount' },
        totalFormatted: { type: 'string', description: 'Formatted total with currency' },
        itemCount: { type: 'integer', description: 'Total item quantity in order' },
        expiresAt: { type: 'string', format: 'date-time', description: 'ISO timestamp when the 15-minute price lock expires' },
        priceLockValidMinutes: { type: 'integer', description: 'Price lock duration in minutes (15)' },
        requiresPaymentAuthorization: { type: 'boolean', description: 'Always true: order requires explicit customer confirmation' },
        message: { type: 'string', description: 'Instructions for the agent' },
        error: { type: 'string', description: 'Error message if checkout cannot be prepared' },
        _hint: { type: 'string', description: 'Agent workflow guidance' },
      },
    },
    execute: async (input: { fulfillment: string; cartId?: string; tableIdentifier?: string; customer?: unknown; notes?: string }) => {
      const totalCount = inMemoryCart.lines.reduce((acc, l) => acc + l.quantity, 0)
      const subtotal = Number(inMemoryCart.lines.reduce((acc, l) => acc + l.lineTotal, 0).toFixed(2))
      const checkoutId = `chk_demo_${Date.now().toString(36)}`
      return {
        status: 'ok',
        checkoutId,
        fulfillment: input.fulfillment,
        venue: 'Pacy Grills & Lounge (Pacy Group)',
        currency: 'USD',
        subtotal,
        tax: 0,
        fees: 0,
        total: subtotal,
        totalFormatted: `$${subtotal.toFixed(2)} USD`,
        itemCount: totalCount,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        priceLockValidMinutes: 15,
        requiresPaymentAuthorization: true,
        message: 'Checkout session prepared. Total locked for 15 minutes. Call wetaego_submit_order with authorization.confirmed: true to finalize.',
        _hint: `Call wetaego_submit_order with checkoutId '${checkoutId}' and authorization: { confirmed: true } to place order.`,
      }
    },
  },

  // 11. wetaego_submit_order — page: '/m/{slug}/checkout'
  {
    name: 'wetaego_submit_order',
    page: '/m/{slug}/checkout',
    description:
      'Submit a prepared checkout session as an authoritative live customer order. Requires authorization.confirmed: true indicating the customer reviewed and approved the order total.',
    inputSchema: {
      type: 'object',
      required: ['checkoutId', 'authorization'],
      properties: {
        checkoutId: { type: 'string', minLength: 1, description: 'The checkoutId returned from wetaego_initiate_checkout.' },
        authorization: {
          type: 'object',
          required: ['confirmed'],
          properties: {
            confirmed: { type: 'boolean', description: 'Set to true after the customer confirms the order total.' },
            confirmationId: { type: 'string', description: 'Optional confirmation tracking token or receipt reference.' },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'success', 'orderId', 'venue', 'currency', 'total', 'totalFormatted'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        success: { type: 'boolean', description: 'Whether the order was successfully accepted' },
        orderId: { type: 'string', description: 'Unique order identifier' },
        checkoutId: { type: 'string', description: 'Associated checkout session ID' },
        venue: { type: 'string', description: 'Venue where order was routed' },
        currency: { type: 'string', description: 'Currency code' },
        total: { type: 'number', description: 'Final charged total' },
        totalFormatted: { type: 'string', description: 'Formatted total with currency' },
        message: { type: 'string', description: 'Order status message' },
        error: { type: 'string', description: 'Error reason if order was rejected' },
        _hint: { type: 'string', description: 'Order tracking link' },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['status', 'success', 'orderId', 'venue', 'currency', 'total', 'totalFormatted'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        success: { type: 'boolean', description: 'Whether the order was successfully accepted' },
        orderId: { type: 'string', description: 'Unique order identifier' },
        checkoutId: { type: 'string', description: 'Associated checkout session ID' },
        venue: { type: 'string', description: 'Venue where order was routed' },
        currency: { type: 'string', description: 'Currency code' },
        total: { type: 'number', description: 'Final charged total' },
        totalFormatted: { type: 'string', description: 'Formatted total with currency' },
        message: { type: 'string', description: 'Order status message' },
        error: { type: 'string', description: 'Error reason if order was rejected' },
        _hint: { type: 'string', description: 'Order tracking link' },
      },
    },
    execute: async (input: { checkoutId: string; authorization: { confirmed: boolean; confirmationId?: string } }) => {
      if (!input.authorization || input.authorization.confirmed !== true) {
        return {
          status: 'error',
          success: false,
          error: 'Order not placed: authorization.confirmed must be true (customer must approve the order total first).',
        }
      }
      const totalCount = inMemoryCart.lines.reduce((acc, l) => acc + l.quantity, 0)
      const subtotal = Number(inMemoryCart.lines.reduce((acc, l) => acc + l.lineTotal, 0).toFixed(2))
      const orderId = `ord_demo_${Date.now().toString(36)}`
      // Clear cart on successful submission
      inMemoryCart.lines = []
      return {
        status: 'ok',
        success: true,
        orderId,
        checkoutId: input.checkoutId,
        venue: 'Pacy Grills & Lounge (Pacy Group)',
        currency: 'USD',
        total: subtotal,
        totalFormatted: `$${subtotal.toFixed(2)} USD`,
        message: `Order #${orderId} confirmed for ${totalCount} items. Routed to kitchen!`,
        _hint: `Order confirmed successfully.`,
      }
    },
  },

  // 12. wetaego_request_staff — page: '/m/{slug}'
  {
    name: 'wetaego_request_staff',
    page: '/m/{slug}',
    description:
      'Send an immediate service or waiter call notification to venue floor staff for a specific table or room.',
    inputSchema: {
      type: 'object',
      required: ['reason'],
      properties: {
        reason: {
          type: 'string',
          enum: ['water_refill', 'bill_check', 'table_cleanup', 'waiter_assistance', 'order_inquiry', 'manager_escalation'],
          description: 'Structured reason for requesting staff assistance.',
        },
        details: { type: 'string', maxLength: 300, description: 'Optional supplementary notes for staff.' },
        tableIdentifier: { type: 'string', maxLength: 50, description: 'Table number, room, or seat requesting assistance.' },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'success', 'message', 'reason', 'tableIdentifier'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        success: { type: 'boolean', description: 'Whether the notification was dispatched' },
        message: { type: 'string', description: 'Confirmation details' },
        reason: { type: 'string', description: 'Reason code dispatched' },
        tableIdentifier: { type: 'string', description: 'Target table or room' },
        _hint: { type: 'string', description: 'Staff response estimate' },
      },
    },
    resultSchema: {
      type: 'object',
      required: ['status', 'success', 'message', 'reason', 'tableIdentifier'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        success: { type: 'boolean', description: 'Whether the notification was dispatched' },
        message: { type: 'string', description: 'Confirmation details' },
        reason: { type: 'string', description: 'Reason code dispatched' },
        tableIdentifier: { type: 'string', description: 'Target table or room' },
        _hint: { type: 'string', description: 'Staff response estimate' },
      },
    },
    execute: async (input: { reason: string; details?: string; tableIdentifier?: string }) => ({
      status: 'ok',
      success: true,
      message: `Staff assistance request dispatched for "${input.reason}" (${input.details || 'No extra notes'}). Floor staff alerted.`,
      reason: input.reason,
      tableIdentifier: input.tableIdentifier || 'Active Table',
      _hint: `Full staff call functionality active at ${PLATFORM_DEMO_CONTEXT.demoUrl}`,
    }),
  },
]

export function WebMcpProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const ctx = ensureWebMCPContext()

    // 1. Call provideContext({ tools: WEBMCP_TOOLS })
    if (typeof ctx.provideContext === 'function') {
      try {
        ctx.provideContext({ tools: WEBMCP_TOOLS })
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[WebMCP] provideContext call warning:', e)
        }
      }
    }

    // 2. Call registerTool on each tool individually
    const cleanups: (() => void)[] = []
    WEBMCP_TOOLS.forEach((tool) => {
      try {
        const reg = ctx.registerTool(tool)
        if (reg && typeof reg.unregister === 'function') {
          cleanups.push(reg.unregister)
        } else {
          cleanups.push(() => ctx.unregisterTool && ctx.unregisterTool(tool.name))
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[WebMCP Root] Failed to register tool:', tool.name, e)
        }
      }
    })

    return () => {
      cleanups.forEach((fn) => {
        try { fn() } catch { /* ignore cleanup */ }
      })
    }
  }, [])

  return null
}
