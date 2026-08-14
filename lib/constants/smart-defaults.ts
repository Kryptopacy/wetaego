export type BusinessTypePreset = {
  id: string
  name: string
  description: string
  recommended_pages: { title: string, template_type: string }[]
  design_tokens: {
    layout_mode: 'bento_grid' | 'masonry' | 'list'
    corner_radius: 'none' | 'sm' | 'md' | 'lg' | 'full'
    surface_style: 'flat' | 'glassmorphism' | 'neumorphism'
  }
}

export const SMART_DEFAULTS: Record<string, BusinessTypePreset> = {
  restaurant: {
    id: 'restaurant',
    name: 'Restaurant / Cafe',
    description: 'Perfect for dine-in, takeout, and delivery with visual menus.',
    recommended_pages: [
      { title: 'Main Menu', template_type: 'catalog' },
      { title: 'Table Reservations', template_type: 'booking' }
    ],
    design_tokens: {
      layout_mode: 'bento_grid',
      corner_radius: 'md',
      surface_style: 'flat'
    }
  },
  spa_wellness: {
    id: 'spa_wellness',
    name: 'Spa & Wellness',
    description: 'Service menus and appointment booking with deposits.',
    recommended_pages: [
      { title: 'Services', template_type: 'rate_card' },
      { title: 'Book Appointment', template_type: 'booking' }
    ],
    design_tokens: {
      layout_mode: 'list',
      corner_radius: 'full',
      surface_style: 'glassmorphism'
    }
  },
  boutique: {
    id: 'boutique',
    name: 'Fashion Boutique',
    description: 'Showcase clothing and accessories with high-quality galleries.',
    recommended_pages: [
      { title: 'New Arrivals', template_type: 'catalog' },
      { title: 'Lookbook', template_type: 'listing' }
    ],
    design_tokens: {
      layout_mode: 'masonry',
      corner_radius: 'none',
      surface_style: 'flat'
    }
  },
  consultancy: {
    id: 'consultancy',
    name: 'Consulting / Freelance',
    description: 'Highlight your expertise, rates, and schedule calls.',
    recommended_pages: [
      { title: 'Rate Card', template_type: 'rate_card' },
      { title: 'Book a Call', template_type: 'booking' }
    ],
    design_tokens: {
      layout_mode: 'list',
      corner_radius: 'sm',
      surface_style: 'neumorphism'
    }
  },
  real_estate: {
    id: 'real_estate',
    name: 'Real Estate / Property',
    description: 'Property listings and viewing bookings.',
    recommended_pages: [
      { title: 'Available Properties', template_type: 'listing' },
      { title: 'Schedule Viewing', template_type: 'booking' }
    ],
    design_tokens: {
      layout_mode: 'masonry',
      corner_radius: 'sm',
      surface_style: 'glassmorphism'
    }
  },
  tech_gadgets: {
    id: 'tech_gadgets',
    name: 'Tech & Electronics',
    description: 'Detailed spec sheets and electronics sales.',
    recommended_pages: [
      { title: 'Products', template_type: 'catalog' },
      { title: 'Support & Repair', template_type: 'booking' }
    ],
    design_tokens: {
      layout_mode: 'bento_grid',
      corner_radius: 'lg',
      surface_style: 'flat'
    }
  },
  event_ticketing: {
    id: 'event_ticketing',
    name: 'Events & Ticketing',
    description: 'Sell tickets for upcoming events and concerts.',
    recommended_pages: [
      { title: 'Upcoming Events', template_type: 'listing' },
      { title: 'Buy Tickets', template_type: 'catalog' }
    ],
    design_tokens: {
      layout_mode: 'bento_grid',
      corner_radius: 'md',
      surface_style: 'neumorphism'
    }
  },
  b2b_wholesale: {
    id: 'b2b_wholesale',
    name: 'B2B & Wholesale',
    description: 'Dynamic quote generation and bulk ordering.',
    recommended_pages: [
      { title: 'Product Catalog', template_type: 'catalog' },
      { title: 'Request Quote', template_type: 'quote' }
    ],
    design_tokens: {
      layout_mode: 'list',
      corner_radius: 'none',
      surface_style: 'flat'
    }
  },
  automotive: {
    id: 'automotive',
    name: 'Automotive / Dealership',
    description: 'Vehicle galleries and test drive bookings.',
    recommended_pages: [
      { title: 'Inventory', template_type: 'listing' },
      { title: 'Book Test Drive', template_type: 'booking' }
    ],
    design_tokens: {
      layout_mode: 'masonry',
      corner_radius: 'lg',
      surface_style: 'glassmorphism'
    }
  },
  fitness_gym: {
    id: 'fitness_gym',
    name: 'Fitness & Gym',
    description: 'Class schedules and membership signups.',
    recommended_pages: [
      { title: 'Memberships', template_type: 'rate_card' },
      { title: 'Class Schedule', template_type: 'booking' }
    ],
    design_tokens: {
      layout_mode: 'bento_grid',
      corner_radius: 'full',
      surface_style: 'neumorphism'
    }
  }
}

export const getSmartDefaults = (businessType: string): BusinessTypePreset | undefined => {
  return SMART_DEFAULTS[businessType.toLowerCase().replace(/[^a-z0-9]+/g, '_')]
}
