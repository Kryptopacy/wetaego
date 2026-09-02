export interface DemoMcpItem {
  itemId: string
  name: string
  category: string
  price: number
  priceMinor: number
  priceFormatted: string
  description: string
  dietaryTags: string[]
  isAvailable: boolean
  hasModifiers: boolean
  attributes: Record<string, unknown>
  conceptSlug: string
  conceptUrl: string
}

export const DEMO_ITEMS: DemoMcpItem[] = [
  // ── 1. DINING: Pacy Grills & Lounge ──────────────────────────────────────────
  {
    itemId: 'item_vegan_avocado',
    name: 'Avocado Tartine & Microgreens',
    category: 'Starters',
    price: 11.0,
    priceMinor: 1650000,
    priceFormatted: '$11.00 USD',
    description: 'Sourdough toast with crushed Hass avocado, lemon oil, chili flakes, and organic microgreens.',
    dietaryTags: ['vegan', 'vegetarian', 'dairy_free'],
    isAvailable: true,
    hasModifiers: true,
    attributes: { brand: 'Pacy Grills & Lounge', industry: 'dining' },
    conceptSlug: 'restaurant',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/restaurant',
  },
  {
    itemId: 'item_green_salad',
    name: 'Green Goddess Harvest Bowl',
    category: 'Mains',
    price: 12.0,
    priceMinor: 1800000,
    priceFormatted: '$12.00 USD',
    description: 'Baby kale, shaved fennel, cucumber ribbons, toasted pumpkin seeds, and green herb vinaigrette.',
    dietaryTags: ['vegan', 'vegetarian', 'gluten_free', 'dairy_free'],
    isAvailable: true,
    hasModifiers: false,
    attributes: { brand: 'Pacy Grills & Lounge', industry: 'dining' },
    conceptSlug: 'restaurant',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/restaurant',
  },
  {
    itemId: 'item_vegan_tofu_bowl',
    name: 'Spicy Sesame Tofu Bowl',
    category: 'Mains',
    price: 14.5,
    priceMinor: 2175000,
    priceFormatted: '$14.50 USD',
    description: 'Crispy marinated organic tofu, steamed brown rice, edamame, pickled cucumber, and toasted sesame tahini glaze.',
    dietaryTags: ['vegan', 'vegetarian', 'gluten_free', 'dairy_free', 'halal'],
    isAvailable: true,
    hasModifiers: true,
    attributes: { brand: 'Pacy Grills & Lounge', industry: 'dining' },
    conceptSlug: 'restaurant',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/restaurant',
  },
  {
    itemId: 'item_truffle_fries',
    name: 'Crispy Truffle Herb Fries',
    category: 'Sides',
    price: 8.5,
    priceMinor: 1275000,
    priceFormatted: '$8.50 USD',
    description: 'Hand-cut russet potatoes tossed with white truffle oil, sea salt, and fresh parsley.',
    dietaryTags: ['vegan', 'vegetarian', 'gluten_free'],
    isAvailable: true,
    hasModifiers: false,
    attributes: { brand: 'Pacy Grills & Lounge', industry: 'dining' },
    conceptSlug: 'restaurant',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/restaurant',
  },
  {
    itemId: 'item_grilled_salmon',
    name: 'Pan-Seared Atlantic Salmon',
    category: 'Mains',
    price: 26.0,
    priceMinor: 3900000,
    priceFormatted: '$26.00 USD',
    description: 'Fresh wild-caught Atlantic salmon filet with roasted asparagus and lemon herb butter.',
    dietaryTags: ['gluten_free', 'halal'],
    isAvailable: true,
    hasModifiers: false,
    attributes: { brand: 'Pacy Grills & Lounge', industry: 'dining' },
    conceptSlug: 'restaurant',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/restaurant',
  },

  // ── 2. WELLNESS & SPA: Pacy Wellness Spa ─────────────────────────────────────
  {
    itemId: 'item_spa_massage_60',
    name: '60-Min Aromatherapy Swedish Massage',
    category: 'Spa Treatments',
    price: 65.0,
    priceMinor: 9750000,
    priceFormatted: '$65.00 USD',
    description: 'Full-body relaxation massage using essential eucalyptus and lavender oils to ease tension.',
    dietaryTags: [],
    isAvailable: true,
    hasModifiers: true,
    attributes: { brand: 'Pacy Wellness Spa', industry: 'wellness', durationMinutes: 60, therapistGender: 'any' },
    conceptSlug: 'pacy-wellness',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/pacy-wellness',
  },

  // ── 3. RETAIL / FASHION: Pacy Fashion Boutique ───────────────────────────────
  {
    itemId: 'item_fashion_blazer',
    name: 'Structured Linen Minimalist Blazer',
    category: 'Apparel',
    price: 85.0,
    priceMinor: 12750000,
    priceFormatted: '$85.00 USD',
    description: 'Tailored oversized organic linen blazer in charcoal and neutral oatmeal tones.',
    dietaryTags: [],
    isAvailable: true,
    hasModifiers: true,
    attributes: { brand: 'Pacy Fashion', industry: 'retail', sizes: ['S', 'M', 'L', 'XL'], colors: ['Charcoal', 'Oatmeal'] },
    conceptSlug: 'pacy-boutique',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/pacy-boutique',
  },

  // ── 4. TECH & GADGETS: Pacy Gadgets ──────────────────────────────────────────
  {
    itemId: 'item_tech_smartphone',
    name: 'Flagship Pro Smartphone 256GB',
    category: 'Smartphones',
    price: 799.0,
    priceMinor: 119850000,
    priceFormatted: '$799.00 USD',
    description: 'Next-gen flagship smartphone with OLED display, triple lens camera system, and 2-year warranty.',
    dietaryTags: [],
    isAvailable: true,
    hasModifiers: true,
    attributes: { brand: 'Pacy Gadgets', industry: 'retail', condition: 'new', warrantyMonths: 24 },
    conceptSlug: 'pacy-gadgets',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/pacy-gadgets',
  },

  // ── 5. SHORT STAYS & HOTELS: Pacy Stays ───────────────────────────────────────
  {
    itemId: 'item_stay_penthouse',
    name: 'Serviced Executive Penthouse Loft',
    category: 'Accommodations',
    price: 180.0,
    priceMinor: 27000000,
    priceFormatted: '$180.00 USD/night',
    description: 'Luxury high-rise serviced loft with panoramic city skyline view, dedicated workspace, and fast fiber WiFi.',
    dietaryTags: [],
    isAvailable: true,
    hasModifiers: false,
    attributes: { brand: 'Pacy Stays', industry: 'lodging', roomCapacity: 4, amenities: ['WiFi', 'Kitchenette', 'Balcony'] },
    conceptSlug: 'pacy-stays',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/pacy-stays',
  },

  // ── 6. REPAIRS: Pacy Gadget Repairs ──────────────────────────────────────────
  {
    itemId: 'item_repair_screen',
    name: 'Precision OLED Display Screen Replacement',
    category: 'Repair Services',
    price: 55.0,
    priceMinor: 8250000,
    priceFormatted: '$55.00 USD',
    description: 'OEM-grade OLED display assembly installation with 90-day comprehensive repair warranty.',
    dietaryTags: [],
    isAvailable: true,
    hasModifiers: true,
    attributes: { brand: 'Pacy Gadget Repairs', industry: 'services', turnaroundHours: 2, warrantyDays: 90 },
    conceptSlug: 'pacy-repairs',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/pacy-repairs',
  },

  // ── 7. MEDIA: Pacy Media Studio ──────────────────────────────────────────────
  {
    itemId: 'item_media_reel_package',
    name: 'Sponsored 60s Reel & Story Campaign Package',
    category: 'Creator Packages',
    price: 250.0,
    priceMinor: 37500000,
    priceFormatted: '$250.00 USD',
    description: 'High-production 4K vertical video commercial, 3x story posts, usage rights, and performance analytics.',
    dietaryTags: [],
    isAvailable: true,
    hasModifiers: false,
    attributes: { brand: 'Pacy Media Studio', industry: 'creative', turnaroundDays: 3, deliverables: '1x 4K Reel + 3x Stories' },
    conceptSlug: 'pacy-media',
    conceptUrl: 'https://ourmenuos.online/m/demo/p/pacy-media',
  },
]

export const DEFAULT_FALLBACK_ITEMS = DEMO_ITEMS
