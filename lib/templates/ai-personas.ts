/**
 * AI Assistant Persona System
 *
 * Maps the page template + billing mode to the right AI persona.
 * The public page AI assistant is entirely different depending on what
 * the business does — a spa should not have an "AI Waiter."
 */

export type AITool =
  | 'addToCart' | 'removeFromCart' | 'clearCart' | 'checkout'  // catalog / food
  | 'callStaff'                                                 // table service only
  | 'checkAvailability' | 'bookSlot'                           // booking
  | 'getServiceInfo'                                            // booking + rate_card
  | 'getProductInfo'                                            // catalog / retail
  | 'getPropertyInfo' | 'submitInquiry'                        // listing

export interface AIPersona {
  /** Default display name — overridden by the business's custom aiName setting */
  defaultName: string
  /** Shown under the name in the chat header */
  subtitle: string
  /** First message shown when chat is opened */
  greeting: string
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

export const AI_PERSONAS: Record<BusinessMode, AIPersona> = {
  catalog_table_service: {
    defaultName: 'AI Waiter',
    subtitle: 'Live Dining Assistant',
    greeting: "Hi! I can recommend dishes, tell you about ingredients, add items to your order, or call a staff member for you. What can I help with?",
    tools: ['addToCart', 'removeFromCart', 'clearCart', 'callStaff', 'checkout'],
    inputPlaceholder: "e.g. 'Recommend a starter', 'No nuts please'",
  },

  catalog_standard_checkout: {
    defaultName: 'AI Shop Assistant',
    subtitle: 'Product Guide',
    greeting: "Hi! I can help you find the right product, check what's in stock, or answer questions about specs. What are you looking for?",
    tools: ['getProductInfo'],
    inputPlaceholder: "e.g. 'Do you have iPhone 15 Pro?', 'What's the difference between...'",
  },

  booking_spa: {
    defaultName: 'AI Concierge',
    subtitle: 'Wellness Assistant',
    greeting: "Welcome! I can help you understand our treatments, check what's available, or guide you through booking. How can I help?",
    tools: ['checkAvailability', 'getServiceInfo'],
    inputPlaceholder: "e.g. 'What does a hot stone massage include?'",
  },

  booking_hotel: {
    defaultName: 'AI Guest Services',
    subtitle: 'Hotel Concierge',
    greeting: "Hello! I can help you find the right room, explain amenities, check availability, or guide you through a reservation. What brings you in?",
    tools: ['checkAvailability', 'getServiceInfo'],
    inputPlaceholder: "e.g. 'Do you have suites with ocean views?'",
  },

  booking_salon: {
    defaultName: 'AI Booking Assistant',
    subtitle: 'Salon & Beauty',
    greeting: "Hi! I can help you understand our services, check open slots, or walk you through booking your appointment.",
    tools: ['checkAvailability', 'getServiceInfo'],
    inputPlaceholder: "e.g. 'How long does a balayage take?'",
  },

  booking_venue: {
    defaultName: 'AI Events Assistant',
    subtitle: 'Venue Coordinator',
    greeting: "Hello! I can tell you about our packages, capacity, included amenities, and help you check availability for your event date.",
    tools: ['checkAvailability', 'getServiceInfo'],
    inputPlaceholder: "e.g. 'Can you hold 200 guests?', 'Do you allow external caterers?'",
  },

  booking_generic: {
    defaultName: 'AI Assistant',
    subtitle: 'Booking Assistant',
    greeting: "Hi! I can help you learn about our services and check availability. What would you like to know?",
    tools: ['checkAvailability', 'getServiceInfo'],
    inputPlaceholder: "e.g. 'What services do you offer?'",
  },

  listing: {
    defaultName: 'AI Property Advisor',
    subtitle: 'Property Assistant',
    greeting: "Hi! I can help you find the right property, answer questions about specs or location, or help you get in touch with the agent.",
    tools: ['getPropertyInfo', 'submitInquiry'],
    inputPlaceholder: "e.g. 'Are there any 3-beds under ₦2M?', 'Is parking included?'",
  },

  rate_card: {
    defaultName: 'AI Assistant',
    subtitle: 'Enquiry Helper',
    greeting: "Hi! I can explain what's included in each package, check availability, or help you get a quote. What are you interested in?",
    tools: ['getServiceInfo', 'submitInquiry'],
    inputPlaceholder: "e.g. 'What's included in the Premium package?'",
  },

  info: {
    defaultName: 'AI Assistant',
    subtitle: 'Page Assistant',
    greeting: "Hi! I can help answer questions about this page. What would you like to know?",
    tools: [],
    inputPlaceholder: "Ask a question...",
  },

  custom: {
    defaultName: 'AI Assistant',
    subtitle: 'Assistant',
    greeting: "Hi! How can I help you today?",
    tools: [],
    inputPlaceholder: "Ask a question...",
  },
}

/**
 * Derives the business mode from page template + billing config.
 * Used to pick the right AI persona for the public page.
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
  if (templateType === 'rate_card') return 'rate_card'
  if (templateType === 'info') return 'info'
  return 'custom'
}

/**
 * Get the resolved persona, merging the business's custom AI name if set.
 */
export function resolvePersona(
  mode: BusinessMode,
  customAiName?: string | null
): AIPersona {
  const base = AI_PERSONAS[mode]
  return customAiName ? { ...base, defaultName: customAiName } : base
}
