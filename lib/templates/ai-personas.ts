/**
 * AI Assistant Persona System
 *
 * Maps the page template + billing mode to the right AI persona.
 * The public page AI assistant is dynamically customized to the business type,
 * acting as Tego (or the merchant's custom configured AI name) representing the business.
 */

export type AITool =
  | 'addToCart' | 'removeFromCart' | 'clearCart' | 'checkout'       // catalog / dining
  | 'searchByDietaryAllergen'                                       // food / catalog
  | 'callStaffToTable'                                              // table service dining
  | 'checkAvailability' | 'getServiceDetails' | 'bookAppointmentSlot' // booking
  | 'messageFrontDesk'                                              // salon / spa / clinic / hotel
  | 'getProductSpecs' | 'checkStock' | 'requestSalesAssociate'      // retail / catalog
  | 'getPropertySpecs' | 'checkViewingAvailability' | 'submitBrokerInquiry' // listing
  | 'getPackageDetails' | 'calculateEstimate' | 'submitCustomQuoteLead' | 'requestConsultantCallback' // quote / rate_card
  | 'requestStaffHandoff'                                           // universal human handoff fallback

export interface AIPersona {
  /** Display name shown in the chat header, e.g. "Tego • Blue Ribbon Bistro" */
  defaultName: string
  /** The base name, e.g. "Tego" or custom name "Bella" */
  baseName: string
  /** Role shown under the name in the chat header */
  subtitle: string
  /** First message shown when chat is opened */
  greeting: string
  /** Contextual quick action suggestion chips shown above input */
  suggestionChips: string[]
  /** What tools the AI is allowed to call */
  tools: AITool[]
  /** Placeholder text in the chat input */
  inputPlaceholder: string
}

export type BusinessMode =
  | 'catalog_table_service'
  | 'catalog_standard_checkout'
  | 'booking_spa'
  | 'booking_hotel'
  | 'booking_salon'
  | 'booking_venue'
  | 'booking_generic'
  | 'listing'
  | 'rate_card'
  | 'info'
  | 'custom'

interface BasePersonaDefinition {
  subtitle: string
  greetingBody: string
  suggestionChips: string[]
  tools: AITool[]
  inputPlaceholder: string
}

export const BASE_PERSONAS: Record<BusinessMode, BasePersonaDefinition> = {
  catalog_table_service: {
    subtitle: 'Live Dining & Table Assistant',
    greetingBody: 'I can recommend dishes, check ingredients & allergens, add items to your cart, or page our floor staff for your table. How can I help you today?',
    suggestionChips: [
      '🍽️ Chef recommendations',
      '🥜 Allergen & dietary check',
      '🧾 Request the bill',
      '🙋 Call waiter to table'
    ],
    tools: ['addToCart', 'removeFromCart', 'clearCart', 'searchByDietaryAllergen', 'callStaffToTable', 'checkout', 'requestStaffHandoff'],
    inputPlaceholder: "e.g. 'Gluten-free options', 'Add 2 burgers', 'Bill please'",
  },

  catalog_standard_checkout: {
    subtitle: 'Product & Catalog Guide',
    greetingBody: 'I can help you explore our catalog, check specifications, verify stock availability, and manage your cart. What are you looking for?',
    suggestionChips: [
      '🔍 Check product specs',
      '📦 Delivery & shipping info',
      '🏷️ Active promotions',
      '💬 Connect with sales'
    ],
    tools: ['getProductSpecs', 'checkStock', 'addToCart', 'removeFromCart', 'clearCart', 'checkout', 'requestSalesAssociate', 'requestStaffHandoff'],
    inputPlaceholder: "e.g. 'Do you have size Medium in stock?', 'Shipping fee'",
  },

  booking_spa: {
    subtitle: 'Wellness & Booking Specialist',
    greetingBody: 'I can explain our treatments, verify therapist availability, and assist with scheduling your appointment. How can I assist your visit?',
    suggestionChips: [
      '💆 Treatment details',
      '📅 Available time slots',
      '🧴 Package inclusions',
      '💬 Message front desk'
    ],
    tools: ['checkAvailability', 'getServiceDetails', 'bookAppointmentSlot', 'messageFrontDesk', 'requestStaffHandoff'],
    inputPlaceholder: "e.g. 'What is included in the Aromatherapy package?'",
  },

  booking_hotel: {
    subtitle: 'Guest Services & Reservations',
    greetingBody: 'I can explain room amenities, check stay availability, and assist with your reservation inquiries. How can I assist you?',
    suggestionChips: [
      '🛏️ Room amenities',
      '📅 Check availability',
      '🏊 Pool & gym hours',
      '💬 Guest services desk'
    ],
    tools: ['checkAvailability', 'getServiceDetails', 'bookAppointmentSlot', 'messageFrontDesk', 'requestStaffHandoff'],
    inputPlaceholder: "e.g. 'Check-in time', 'Suites with balcony'",
  },

  booking_salon: {
    subtitle: 'Salon & Beauty Specialist',
    greetingBody: 'I can help you explore our beauty services, check stylist schedules, and book your appointment. What are you looking to do today?',
    suggestionChips: [
      '💇 Service menu & pricing',
      '📅 Open stylist slots',
      '⏳ Treatment duration',
      '💬 Message salon coordinator'
    ],
    tools: ['checkAvailability', 'getServiceDetails', 'bookAppointmentSlot', 'messageFrontDesk', 'requestStaffHandoff'],
    inputPlaceholder: "e.g. 'How long does a balayage take?', 'Open slots Saturday'",
  },

  booking_venue: {
    subtitle: 'Venue & Events Coordinator',
    greetingBody: 'I can tell you about our space capacities, event packages, included equipment, and check date availability for your function.',
    suggestionChips: [
      '🏛️ Capacity & floor plans',
      '📅 Date availability',
      '🍾 Catering & equipment',
      '💬 Contact events team'
    ],
    tools: ['checkAvailability', 'getServiceDetails', 'bookAppointmentSlot', 'messageFrontDesk', 'requestStaffHandoff'],
    inputPlaceholder: "e.g. 'Can you host 150 seated guests?', 'Audio-visual gear'",
  },

  booking_generic: {
    subtitle: 'Appointments & Scheduling Specialist',
    greetingBody: 'I can help you explore our services, review pricing, and check scheduling availability. How can I help you?',
    suggestionChips: [
      '📋 Available services',
      '📅 Check calendar slots',
      '💬 Connect with coordinator'
    ],
    tools: ['checkAvailability', 'getServiceDetails', 'bookAppointmentSlot', 'messageFrontDesk', 'requestStaffHandoff'],
    inputPlaceholder: "e.g. 'What appointments are open this week?'",
  },

  listing: {
    subtitle: 'Property & Listing Advisor',
    greetingBody: 'I can answer questions regarding property features, pricing, square footage, neighborhood amenities, and arrange a viewing with our broker.',
    suggestionChips: [
      '🏡 Property specifications',
      '📍 Location & amenities',
      '📅 Schedule a viewing',
      '💬 Connect with agent'
    ],
    tools: ['getPropertySpecs', 'checkViewingAvailability', 'submitBrokerInquiry', 'requestStaffHandoff'],
    inputPlaceholder: "e.g. 'Is parking included?', 'Book a viewing for tomorrow'",
  },

  rate_card: {
    subtitle: 'Scope & Quote Specialist',
    greetingBody: 'I can break down what is included in each tier, calculate estimated project budgets, or submit a custom scope inquiry to our team.',
    suggestionChips: [
      '📑 Tier breakdown',
      '💰 Estimate my project',
      '📑 Request custom quote',
      '📞 Schedule consultation'
    ],
    tools: ['getPackageDetails', 'calculateEstimate', 'submitCustomQuoteLead', 'requestConsultantCallback', 'requestStaffHandoff'],
    inputPlaceholder: "e.g. 'What is included in the Growth tier?', 'Custom quote'",
  },

  info: {
    subtitle: 'Information Assistant',
    greetingBody: 'I am here to answer your questions about our services, policies, and venue details. What would you like to know?',
    suggestionChips: [
      '🕒 Hours & location',
      '❓ General FAQs',
      '💬 Connect with team'
    ],
    tools: ['requestStaffHandoff'],
    inputPlaceholder: "Ask anything about this venue...",
  },

  custom: {
    subtitle: 'Assistant',
    greetingBody: 'How can I assist you with our services and information today?',
    suggestionChips: [
      '❓ Ask a question',
      '💬 Contact staff'
    ],
    tools: ['requestStaffHandoff'],
    inputPlaceholder: "Ask a question...",
  },
}

/**
 * Derives the business mode from page template + billing config.
 */
export function getBusinessMode(
  templateType: string,
  billingMode?: string | null,
  businessTypePreset?: string | null
): BusinessMode {
  if (templateType === 'catalog') {
    return billingMode === 'table_service'
      ? 'catalog_table_service'
      : 'catalog_standard_checkout'
  }

  if (templateType === 'booking') {
    if (businessTypePreset === 'spa_wellness') return 'booking_spa'
    if (businessTypePreset === 'hotel') return 'booking_hotel'
    if (businessTypePreset === 'salon') return 'booking_salon'
    if (businessTypePreset === 'event_venue') return 'booking_venue'
    return 'booking_generic'
  }

  if (templateType === 'listing') return 'listing'
  if (templateType === 'rate_card' || templateType === 'quote') return 'rate_card'
  if (templateType === 'info') return 'info'
  return 'custom'
}

/**
 * Get the resolved persona, properly branding as Tego (or custom configured AI name)
 * acting on behalf of the specific business, with support for custom quick action chips.
 */
export function resolvePersona(
  mode: BusinessMode,
  customAiName?: string | null,
  businessName?: string | null,
  customQuickActions?: string[] | null
): AIPersona {
  const base = BASE_PERSONAS[mode] || BASE_PERSONAS.custom
  const rawName = customAiName?.trim()
  const baseName = rawName || 'Tego'
  const biz = businessName?.trim()

  const displayName = biz ? `${baseName} • ${biz}` : baseName
  const greeting = `Hi! I'm ${baseName}, your assistant at ${biz || 'our venue'}. ${base.greetingBody}`

  // Merge custom quick actions with base chips if provided
  const validCustomActions = (customQuickActions || []).filter(a => typeof a === 'string' && a.trim().length > 0)
  const finalChips = validCustomActions.length > 0
    ? [...validCustomActions, ...base.suggestionChips.filter(c => !validCustomActions.includes(c))].slice(0, 6)
    : base.suggestionChips

  return {
    defaultName: displayName,
    baseName,
    subtitle: base.subtitle,
    greeting,
    suggestionChips: finalChips,
    tools: base.tools,
    inputPlaceholder: base.inputPlaceholder,
  }
}
