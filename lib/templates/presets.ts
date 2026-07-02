/**
 * OurMenu Business Type Presets
 *
 * Maps a human-readable business type (what the user selects in the wizard)
 * to the underlying template configuration. This is the single source of truth
 * for the auto-configuration logic. The business owner never sees "template_type"
 * — they just pick their business type and everything is pre-configured.
 */

export type TemplateType = 'catalog' | 'booking' | 'listing' | 'rate_card' | 'info' | 'custom' | 'quote' | 'portfolio'
export type BillingMode = 'table_service' | 'standard_checkout'
export type PaymentMode = 'full' | 'deposit'

export interface BusinessTypePreset {
  /** Human-readable label shown to the user */
  label: string
  /** Short description shown under the label in the picker */
  description: string
  /** Emoji icon for the picker card */
  icon: string
  /** The underlying template this maps to */
  template_type: TemplateType
  /** Default billing enabled */
  billing_enabled: boolean
  /** Table service (Fulfillment Dashboard) vs standard checkout */
  billing_mode: BillingMode
  /** Full payment or deposit */
  payment_mode: PaymentMode
  /** Default deposit % if payment_mode = 'deposit' */
  deposit_percentage: number
  /** Pre-filled page title placeholder (use {businessName}) */
  default_page_title: string
  /** AI cover image hint (used as additional context for AI image generation) */
  ai_cover_hint: string
  /** AI content hint for the first item description */
  ai_item_hint: string
  /** Category group for the picker UI */
  group: 'food_drink' | 'hospitality' | 'services' | 'retail' | 'property' | 'creative' | 'quote_based'
}

export const BUSINESS_TYPE_PRESETS: Record<string, BusinessTypePreset> = {
  // ─── FOOD & DRINK ────────────────────────────────────────────────────────────
  restaurant: {
    label: 'Restaurant / Café',
    description: 'Table ordering, live Kitchen Display System (KDS), and Paystack payments',
    icon: '🍽️',
    template_type: 'catalog',
    billing_enabled: true,
    billing_mode: 'table_service',
    payment_mode: 'full',
    deposit_percentage: 0,
    default_page_title: "{businessName}'s Menu",
    ai_cover_hint: 'upscale restaurant interior, warm candlelight, elegant food presentation, diners',
    ai_item_hint: 'a dish description for a restaurant menu, sensory and appetizing',
    group: 'food_drink',
  },
  bar_lounge: {
    label: 'Bar / Club / Lounge',
    description: 'Drinks menu with table ordering and live Bar Display System (KDS)',
    icon: '🍸',
    template_type: 'catalog',
    billing_enabled: true,
    billing_mode: 'table_service',
    payment_mode: 'full',
    deposit_percentage: 0,
    default_page_title: "{businessName} — Drinks & Menu",
    ai_cover_hint: 'vibrant nightclub bar with neon lights, cocktails, stylish crowd',
    ai_item_hint: 'a cocktail or drink description for a bar menu, exciting and evocative',
    group: 'food_drink',
  },
  food_truck: {
    label: 'Food Truck / Pop-up',
    description: 'Quick checkout, no table system needed',
    icon: '🚚',
    template_type: 'catalog',
    billing_enabled: true,
    billing_mode: 'standard_checkout',
    payment_mode: 'full',
    deposit_percentage: 0,
    default_page_title: "{businessName}",
    ai_cover_hint: 'colourful food truck at a street market, people queuing, street food vibes',
    ai_item_hint: 'a street food dish description, bold and exciting',
    group: 'food_drink',
  },
  catering: {
    label: 'Catering Service',
    description: 'Package menus with advance booking and deposits',
    icon: '🍱',
    template_type: 'booking',
    billing_enabled: true,
    billing_mode: 'standard_checkout',
    payment_mode: 'deposit',
    deposit_percentage: 50,
    default_page_title: "{businessName} — Catering",
    ai_cover_hint: 'elegant catering spread at an event, chafing dishes, beautifully presented food',
    ai_item_hint: 'a catering package description, professional and comprehensive',
    group: 'food_drink',
  },

  // ─── HOSPITALITY ─────────────────────────────────────────────────────────────
  hotel: {
    label: 'Hotel / Guesthouse',
    description: 'Room bookings with nightly rates and deposits',
    icon: '🏨',
    template_type: 'booking',
    billing_enabled: true,
    billing_mode: 'standard_checkout',
    payment_mode: 'deposit',
    deposit_percentage: 30,
    default_page_title: "Book at {businessName}",
    ai_cover_hint: 'luxury hotel room with large windows, immaculate bed, tropical or urban view',
    ai_item_hint: 'a hotel room description, luxurious and welcoming',
    group: 'hospitality',
  },
  spa_wellness: {
    label: 'Spa / Wellness Centre',
    description: 'Treatment bookings with time slots',
    icon: '💆',
    template_type: 'booking',
    billing_enabled: true,
    billing_mode: 'standard_checkout',
    payment_mode: 'deposit',
    deposit_percentage: 30,
    default_page_title: "Book at {businessName}",
    ai_cover_hint: 'serene spa interior with candles, white towels, ambient lighting, orchids',
    ai_item_hint: 'a spa treatment description, relaxing and indulgent',
    group: 'hospitality',
  },
  salon: {
    label: 'Salon / Barbershop',
    description: 'Appointment booking with optional deposits',
    icon: '💈',
    template_type: 'booking',
    billing_enabled: true,
    billing_mode: 'standard_checkout',
    payment_mode: 'full',
    deposit_percentage: 0,
    default_page_title: "Book at {businessName}",
    ai_cover_hint: 'modern hair salon, stylish interior, mirrors, styling chairs, warm lighting',
    ai_item_hint: 'a hair or beauty service description, professional and appealing',
    group: 'hospitality',
  },
  event_venue: {
    label: 'Event Venue / Hall',
    description: 'Venue hire packages with deposit payments',
    icon: '🎪',
    template_type: 'booking',
    billing_enabled: true,
    billing_mode: 'standard_checkout',
    payment_mode: 'deposit',
    deposit_percentage: 50,
    default_page_title: "Book {businessName}",
    ai_cover_hint: 'elegant event hall set up for a wedding or gala, fairy lights, round tables',
    ai_item_hint: 'an event venue package description, elegant and professional',
    group: 'hospitality',
  },

  // ─── SERVICES & CREATIVE ──────────────────────────────────────────────────────
  influencer: {
    label: 'Influencer / Content Creator',
    description: 'Rate card with packages, add-ons, and portfolio',
    icon: '📱',
    template_type: 'rate_card',
    billing_enabled: false,
    billing_mode: 'standard_checkout',
    payment_mode: 'full',
    deposit_percentage: 0,
    default_page_title: "{businessName} — Media Kit & Rates",
    ai_cover_hint: 'lifestyle creator photoshoot, ring light, stylish bedroom studio, creative aesthetic',
    ai_item_hint: 'an influencer service description (e.g. Instagram Reel, TikTok video), professional and persuasive',
    group: 'creative',
  },
  photographer: {
    label: 'Photographer / Videographer',
    description: 'Packages with booking and optional deposits',
    icon: '📷',
    template_type: 'rate_card',
    billing_enabled: true,
    billing_mode: 'standard_checkout',
    payment_mode: 'deposit',
    deposit_percentage: 30,
    default_page_title: "{businessName} — Photography Packages",
    ai_cover_hint: 'photographer at a lifestyle photoshoot, camera gear, bright studio or golden hour outdoors',
    ai_item_hint: 'a photography package description, professional and creative',
    group: 'creative',
  },
  freelancer: {
    label: 'Freelancer (Design / Dev / Writing)',
    description: 'Service tiers and quote form',
    icon: '💻',
    template_type: 'rate_card',
    billing_enabled: false,
    billing_mode: 'standard_checkout',
    payment_mode: 'full',
    deposit_percentage: 0,
    default_page_title: "{businessName} — Services & Rates",
    ai_cover_hint: 'modern home office workspace, laptop, design tools, clean aesthetic',
    ai_item_hint: 'a freelance service description, clear and professional',
    group: 'creative',
  },
  coach_tutor: {
    label: 'Coach / Tutor / Consultant',
    description: 'Session bookings with rates',
    icon: '🎓',
    template_type: 'booking',
    billing_enabled: true,
    billing_mode: 'standard_checkout',
    payment_mode: 'full',
    deposit_percentage: 0,
    default_page_title: "Book a Session with {businessName}",
    ai_cover_hint: 'professional consultant in a meeting setting, whiteboard, confident and approachable',
    ai_item_hint: 'a coaching or tutoring session description, inspiring and clear',
    group: 'services',
  },

  // ─── RETAIL ──────────────────────────────────────────────────────────────────
  phone_store: {
    label: 'Phone Store / Electronics',
    description: 'Product catalog with optional ordering',
    icon: '📲',
    template_type: 'catalog',
    billing_enabled: true,
    billing_mode: 'standard_checkout',
    payment_mode: 'full',
    deposit_percentage: 0,
    default_page_title: "{businessName} — Price List",
    ai_cover_hint: 'modern electronics store interior, smartphones displayed on shelves, clean bright lighting',
    ai_item_hint: 'a smartphone or electronics product description, spec-forward and compelling',
    group: 'retail',
  },
  boutique: {
    label: 'Fashion / Clothing Boutique',
    description: 'Image-first catalog with or without checkout',
    icon: '👗',
    template_type: 'catalog',
    billing_enabled: false,
    billing_mode: 'standard_checkout',
    payment_mode: 'full',
    deposit_percentage: 0,
    default_page_title: "{businessName} — Shop",
    ai_cover_hint: 'stylish fashion boutique interior, clothes rail, natural lighting, minimal aesthetic',
    ai_item_hint: 'a fashion item description, style-forward and aspirational',
    group: 'retail',
  },
  portfolio: {
    label: 'Portfolio & Showcases',
    description: 'A sleek visual showcase for your projects, skills, and case studies',
    icon: '🧑‍💻',
    template_type: 'portfolio',
    billing_enabled: false,
    billing_mode: 'standard_checkout',
    payment_mode: 'full',
    deposit_percentage: 0,
    default_page_title: "{businessName} — Portfolio",
    ai_cover_hint: 'a minimalist and aesthetic designer workspace, moodboards, creative tools',
    ai_item_hint: 'a brief description of a creative project or artwork',
    group: 'creative',
  },

  // ─── QUOTE-BASED (B2B / Custom Services) ─────────────────────────────────────
  contractor: {
    label: 'Contractor / Renovation',
    description: 'Allow clients to request quotes for custom builds and renovations',
    icon: '👷',
    template_type: 'quote',
    billing_enabled: true,
    billing_mode: 'standard_checkout',
    payment_mode: 'deposit',
    deposit_percentage: 50,
    default_page_title: "{businessName} — Services",
    ai_cover_hint: 'a modern home renovation in progress, architectural blueprints, high quality craftsmanship',
    ai_item_hint: 'a description of a contracting service like bathroom remodelling',
    group: 'quote_based',
  },
  agency: {
    label: 'Creative / Marketing Agency',
    description: 'Clients can select services and request a custom project quote',
    icon: '🚀',
    template_type: 'quote',
    billing_enabled: true,
    billing_mode: 'standard_checkout',
    payment_mode: 'full',
    deposit_percentage: 0,
    default_page_title: "{businessName} — Agency Services",
    ai_cover_hint: 'a sleek modern creative agency office, team collaborating around a table',
    ai_item_hint: 'a description of a marketing or design service, like brand identity or SEO',
    group: 'quote_based',
  },
  custom_fabrication: {
    label: 'Custom Fabrication / Furniture',
    description: 'Clients can request quotes for custom-built or manufactured items',
    icon: '🪚',
    template_type: 'quote',
    billing_enabled: true,
    billing_mode: 'standard_checkout',
    payment_mode: 'deposit',
    deposit_percentage: 50,
    default_page_title: "{businessName} — Custom Builds",
    ai_cover_hint: 'a bright artisan workshop, custom woodworking or metal fabrication tools',
    ai_item_hint: 'a description of a custom built piece of furniture or machinery',
    group: 'quote_based',
  },
  it_services: {
    label: 'IT / Software Services',
    description: 'Receive project requirements and generate formal quotes for software dev or IT support',
    icon: '💻',
    template_type: 'quote',
    billing_enabled: true,
    billing_mode: 'standard_checkout',
    payment_mode: 'full',
    deposit_percentage: 0,
    default_page_title: "{businessName} — Tech Solutions",
    ai_cover_hint: 'a clean futuristic IT workspace, multiple screens with code, glowing server racks',
    ai_item_hint: 'a description of a technical service like cloud migration or custom software development',
    group: 'quote_based',
  },
  events_planner: {
    label: 'Events Planning & Production',
    description: 'Clients browse packages and request a custom quote for their event',
    icon: '🎉',
    template_type: 'quote',
    billing_enabled: true,
    billing_mode: 'standard_checkout',
    payment_mode: 'deposit',
    deposit_percentage: 50,
    default_page_title: "{businessName} — Event Services",
    ai_cover_hint: 'a beautifully decorated wedding reception hall or corporate event stage',
    ai_item_hint: 'a description of an event planning package or service like AV setup',
    group: 'quote_based',
  },
  furniture: {
    label: 'Furniture / Home Decor',
    description: 'Browse catalog with inquiry CTA',
    icon: '🛋️',
    template_type: 'catalog',
    billing_enabled: false,
    billing_mode: 'standard_checkout',
    payment_mode: 'full',
    deposit_percentage: 0,
    default_page_title: "{businessName} — Catalogue",
    ai_cover_hint: 'beautifully styled modern living room interior, furniture on display, warm lighting',
    ai_item_hint: 'a furniture piece description, design-focused and inviting',
    group: 'retail',
  },

  // ─── PROPERTY ─────────────────────────────────────────────────────────────────
  estate_agent: {
    label: 'Estate Agent / Property Sales',
    description: 'Property listings with inquiry forms',
    icon: '🏠',
    template_type: 'listing',
    billing_enabled: false,
    billing_mode: 'standard_checkout',
    payment_mode: 'full',
    deposit_percentage: 0,
    default_page_title: "{businessName} — Properties",
    ai_cover_hint: 'modern Lagos or Abuja residential building exterior, sunny day, well-maintained',
    ai_item_hint: 'a property listing description, specific and aspirational',
    group: 'property',
  },
  landlord: {
    label: 'Landlord / Rental',
    description: 'Rental listings with inquiry or booking',
    icon: '🔑',
    template_type: 'listing',
    billing_enabled: false,
    billing_mode: 'standard_checkout',
    payment_mode: 'deposit',
    deposit_percentage: 0,
    default_page_title: "{businessName} — Available Properties",
    ai_cover_hint: 'clean apartment interior with natural light, neutral colours, move-in ready',
    ai_item_hint: 'a rental property description, practical and welcoming',
    group: 'property',
  },
  short_stay: {
    label: 'Short-stay / Airbnb-style',
    description: 'Property listings with availability and deposits',
    icon: '🏡',
    template_type: 'listing',
    billing_enabled: true,
    billing_mode: 'standard_checkout',
    payment_mode: 'deposit',
    deposit_percentage: 30,
    default_page_title: "Stay at {businessName}",
    ai_cover_hint: 'stylish short-stay apartment with premium amenities, inviting and photogenic',
    ai_item_hint: 'a short-stay apartment description, enticing and specific',
    group: 'property',
  },
}

/**
 * All unique groups for rendering the picker UI in sections
 */
export const BUSINESS_TYPE_GROUPS = [
  { id: 'food_drink', label: '🍽️ Food & Drink', description: 'Restaurants, bars, food trucks, catering' },
  { id: 'hospitality', label: '🏨 Hospitality', description: 'Hotels, spas, salons, event venues' },
  { id: 'creative', label: '🎨 Creative & Services', description: 'Influencers, photographers, freelancers' },
  { id: 'retail', label: '🛍️ Retail', description: 'Phone stores, boutiques, home decor' },
  { id: 'property', label: '🏠 Property', description: 'Estate agents, landlords, short-stay' },
  { id: 'services', label: '🎓 Professional Services', description: 'Coaches, tutors, consultants' },
  { id: 'quote_based', label: '📋 Custom & Quotes', description: 'Contractors, agencies, custom builds' },
] as const

/**
 * Get preset by business type key, with fallback
 */
export function getPreset(businessType: string): BusinessTypePreset | null {
  return BUSINESS_TYPE_PRESETS[businessType] ?? null
}

/**
 * Get all presets for a given group
 */
export function getPresetsByGroup(group: string): Array<{ key: string; preset: BusinessTypePreset }> {
  return Object.entries(BUSINESS_TYPE_PRESETS)
    .filter(([, preset]) => preset.group === group)
    .map(([key, preset]) => ({ key, preset }))
}

/**
 * Build a page title from preset template + business name
 */
export function buildPageTitle(preset: BusinessTypePreset, businessName: string): string {
  return preset.default_page_title.replace('{businessName}', businessName)
}
