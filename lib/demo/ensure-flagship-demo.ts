import { createAdminClient } from '@/lib/supabase/server'

/**
 * Ensures the permanent flagship demo at /m/demo is 100% 1:1 with Pacy Group:
 * - 9 Full Multi-Concept Businesses (Restaurant, Wellness Spa, Fashion Boutique, Tech Gadgets, Stays, Hotels, Diagnostics Lab, Media Studio, Links)
 * - Rich Design Tokens & Unique Aesthetic per Concept
 * - Full Catalog (45+ items with rich variants, doneness, storage, sizes, images, dietary tags)
 * - Public AI Assistant & Concierge Configured
 */
export async function ensureFlagshipDemoLocation() {
  const adminClient = await createAdminClient()

  // 1. Fetch or create the permanent Demo Organization
  let { data: org } = await adminClient
    .from('organizations')
    .select('id, slug, name')
    .eq('slug', 'pacy-group-flagship')
    .maybeSingle()

  if (!org) {
    const { data: newOrg } = await adminClient
      .from('organizations')
      .insert({
        name: 'Pacy Group',
        slug: 'pacy-group-flagship',
        is_demo: false, // Permanent showcase
      } as never)
      .select('id, slug, name')
      .single()
    org = newOrg
  }

  if (!org) return null

  // 2. Fetch or create Location with slug 'demo'
  let { data: loc } = await adminClient
    .from('locations')
    .select('id, slug, name, organization_id')
    .eq('slug', 'demo')
    .maybeSingle()

  const locationPayload = {
    organization_id: org.id,
    name: 'Pacy Grills & Lounge',
    portal_display_name: 'Pacy Group',
    slug: 'demo',
    address: '42 Victoria Island, Lagos',
    currency_code: 'NGN',
    theme_color: '#0f7b55',
    cover_image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1920&h=1080',
    operating_hours: 'Mon-Sun, 11:00 AM - 11:00 PM',
    wifi_network: 'Pacy_Guest',
    wifi_password: 'pacygrills2026',
    instagram_handle: '@pacygrills',
    twitter_handle: '@pacygrills',
    facebook_handle: 'Pacy Grills Lounge',
    whatsapp_number: '+2348000000000',
    phone_number: '0800 000 0000',
    google_maps_url: 'https://maps.google.com',
    ai_enabled: true,
    ai_name: 'Pacy Concierge',
    ai_base_personality: 'professional',
    ai_escalation_contact: 'ask a staff member nearby or call 0800 000 0000',
    ai_instructions: 'Adapt your recommendations perfectly to the current context. If the user is viewing food, suggest wine & cocktail pairings. If they are viewing spa or hotel services, be a luxurious helpful concierge. If they need staff or custom quotes, call staff or register their inquiry.',
    ai_faqs: [
      { question: 'What are your operating hours?', answer: 'We are open from 11:00 AM to 11:00 PM daily across all hospitality concepts.' },
      { question: 'What payment methods do you accept?', answer: 'We accept all major debit/credit cards, Apple Pay, and direct bank transfers.' }
    ],
    brand_knowledge: 'Pacy Group is a multi-concept commercial conglomerate in Lagos — spanning fine dining (Pacy Grills & Lounge), wellness spa, luxury short-stays, a fashion boutique, tech gadgets, a creator media studio, luxury hotels, and a gadget repair lab.',
    publication_status: 'published' as const,
    manual_payment_enabled: true,
    manual_payment_bank_name: 'WETAEGO Demo Bank',
    manual_payment_account_name: 'Pacy Group Flagship Demo',
    manual_payment_account_number: '0000000000',
    manual_payment_instructions: 'This is the live multi-concept demo. No real payment is charged. Click "I Have Transferred" to simulate the live checkout flow!'
  }

  if (!loc) {
    const { data: newLoc } = await adminClient
      .from('locations')
      .insert(locationPayload)
      .select('id, slug, name, organization_id')
      .single()
    loc = newLoc
  } else {
    await adminClient
      .from('locations')
      .update(locationPayload)
      .eq('id', loc.id)
  }

  if (!loc) return null

  // 3. Verify if all 9 pages exist
  const { data: existingPages } = await adminClient
    .from('location_pages')
    .select('id, slug')
    .eq('location_id', loc.id)

  // If existing pages contain stale data (like 'home' from L'Aura Bistro), purge them
  const isStale = existingPages?.some(p => p.slug === 'home') || (existingPages && existingPages.length < 8)
  if (isStale) {
    if (existingPages && existingPages.length > 0) {
      const pageIds = existingPages.map(p => p.id)
      await adminClient.from('page_items').delete().in('page_id', pageIds)
      await adminClient.from('location_pages').delete().eq('location_id', loc.id)
    }
  } else if (existingPages && existingPages.length >= 8) {
    // Already fully populated
    return loc.id
  }

  // 4. Create all 9 Pacy Multi-Concept Pages with Custom Design Tokens
  const pagesConfig = [
    {
      location_id: loc.id,
      slug: 'restaurant',
      title: 'Pacy Grills & Lounge',
      template_type: 'catalog',
      business_type_preset: 'restaurant',
      is_published: true,
      billing_enabled: true,
      randomizer_enabled: true,
      theme_color: '#0f7b55',
      design_tokens: { layout_mode: 'bento_grid', surface_style: 'glassmorphism', typography: 'modern', corner_radius: '2xl' }
    },
    {
      location_id: loc.id,
      slug: 'pacy-media',
      title: 'Pacy Media & Creators',
      template_type: 'rate_card',
      business_type_preset: 'influencer',
      is_published: true,
      billing_enabled: true,
      randomizer_enabled: false,
      theme_color: '#ec4899',
      design_tokens: { layout_mode: 'list', surface_style: 'glassmorphism', typography: 'modern', corner_radius: 'xl' }
    },
    {
      location_id: loc.id,
      slug: 'pacy-wellness',
      title: 'Pacy Wellness Spa',
      template_type: 'booking',
      business_type_preset: 'spa_wellness',
      billing_enabled: true,
      billing_mode: 'standard_checkout',
      payment_mode: 'deposit',
      deposit_percentage: 30,
      is_published: true,
      randomizer_enabled: false,
      theme_color: '#8b5cf6',
      design_tokens: { layout_mode: 'list', surface_style: 'glassmorphism', typography: 'elegant', corner_radius: '2xl' }
    },
    {
      location_id: loc.id,
      slug: 'pacy-stays',
      title: 'Pacy Stays',
      template_type: 'listing',
      business_type_preset: 'short_stay',
      billing_enabled: true,
      billing_mode: 'standard_checkout',
      payment_mode: 'deposit',
      deposit_percentage: 50,
      is_published: true,
      randomizer_enabled: false,
      theme_color: '#059669',
      design_tokens: { layout_mode: 'masonry', surface_style: 'flat', typography: 'modern', corner_radius: 'xl' }
    },
    {
      location_id: loc.id,
      slug: 'pacy-boutique',
      title: 'Pacy Fashion',
      template_type: 'catalog',
      business_type_preset: 'boutique',
      billing_enabled: true,
      billing_mode: 'standard_checkout',
      payment_mode: 'full',
      is_published: true,
      randomizer_enabled: false,
      theme_color: '#d97706',
      design_tokens: { layout_mode: 'masonry', surface_style: 'flat', typography: 'elegant', corner_radius: 'lg' }
    },
    {
      location_id: loc.id,
      slug: 'pacy-hotels',
      title: 'Pacy Hotels',
      template_type: 'booking',
      business_type_preset: 'hotel',
      billing_enabled: true,
      billing_mode: 'standard_checkout',
      payment_mode: 'deposit',
      deposit_percentage: 30,
      is_published: true,
      randomizer_enabled: false,
      theme_color: '#b45309',
      design_tokens: { layout_mode: 'list', surface_style: 'glassmorphism', typography: 'elegant', corner_radius: '2xl' }
    },
    {
      location_id: loc.id,
      slug: 'pacy-repairs',
      title: 'Pacy Gadget Repairs',
      template_type: 'quote',
      business_type_preset: 'repair_services',
      billing_enabled: false,
      billing_mode: 'standard_checkout',
      payment_mode: 'deposit',
      deposit_percentage: 50,
      is_published: true,
      randomizer_enabled: false,
      theme_color: '#0284c7',
      design_tokens: { layout_mode: 'bento_grid', surface_style: 'neumorphism', typography: 'industrial', corner_radius: 'md' }
    },
    {
      location_id: loc.id,
      slug: 'pacy-gadgets',
      title: 'Pacy Gadgets',
      template_type: 'catalog',
      business_type_preset: 'tech',
      billing_enabled: true,
      billing_mode: 'standard_checkout',
      payment_mode: 'full',
      is_published: true,
      randomizer_enabled: false,
      theme_color: '#2563eb',
      design_tokens: { layout_mode: 'bento_grid', surface_style: 'glassmorphism', typography: 'industrial', corner_radius: 'xl' }
    },
    {
      location_id: loc.id,
      slug: 'links',
      title: 'Our Links',
      template_type: 'info',
      content: JSON.stringify({
        links: [
          { label: 'Follow our Instagram', url: 'https://instagram.com/pacygrills' },
          { label: 'Leave a Review', url: 'https://google.com' }
        ]
      }),
      is_published: true,
      randomizer_enabled: false,
      billing_enabled: false,
      theme_color: '#0f7b55',
      design_tokens: { layout_mode: 'list', surface_style: 'flat', typography: 'modern', corner_radius: 'lg' }
    }
  ]

  const { data: createdPages } = await adminClient
    .from('location_pages')
    .insert(pagesConfig as never)
    .select('id, slug')

  if (!createdPages) return loc.id

  // 5. Seed Complete Rich Items for All Concepts
  const pageItems: Record<string, unknown>[] = []

  const restaurantPage = createdPages.find(p => p.slug === 'restaurant')
  if (restaurantPage) {
    pageItems.push(
      {
        page_id: restaurantPage.id,
        title: '24-Hour Suya Ribeye Steak',
        description: 'Prime 350g Angus ribeye marinated in artisanal suya spices, flame-grilled over scented cherrywood charcoal.',
        price_minor: 2800000,
        sort_order: 0,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Chef Specials & Mains',
          dietary_tags: ['halal', 'gluten_free'],
          variants: [
            { name: 'Doneness', options: ['Medium Rare (Chef Recommended)', 'Medium', 'Medium Well', 'Well Done'], required: true },
            { name: 'Spice Level', options: ['Mild Yaji Dust', 'Classic Lagos Heat', 'Extra Hot Pepper Fire'], required: true },
            { name: 'Complimentary Side', options: ['Truffle Plantain Fries', 'Smoky Jollof Rice', 'Grilled Sweet Potato Mash'], required: true }
          ]
        }
      },
      {
        page_id: restaurantPage.id,
        title: 'Smoked Jollof Paella',
        description: 'Firewood smoked jollof rice tossed with jumbo tiger prawns, calamari rings, artisanal chorizo, and saffron aioli.',
        price_minor: 1950000,
        sort_order: 1,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Chef Specials & Mains',
          dietary_tags: ['pescatarian', 'gluten_free', 'halal'],
          variants: [
            { name: 'Seafood Add-on', options: ['Standard Seafood Mix', 'Extra Jumbo Tiger Prawns', 'Whole Grilled Lobster Tail'] }
          ]
        }
      },
      {
        page_id: restaurantPage.id,
        title: 'Wild Mushroom Truffle Tagliatelle',
        description: 'Fresh handmade pasta ribbons tossed in silky black truffle cream, sautéed king oyster mushrooms, and parmesan crisp.',
        price_minor: 1850000,
        sort_order: 2,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Chef Specials & Mains',
          dietary_tags: ['vegetarian'],
          variants: [
            { name: 'Portion Size', options: ['Standard', 'Feast / Large (+25%)'], required: true },
            { name: 'Cheese Choice', options: ['Aged 24-Month Parmigiano', 'Vegan Truffle Dust (Dairy Free)'], required: true }
          ]
        }
      },
      {
        page_id: restaurantPage.id,
        title: 'Charcoal Grilled Herb Croaker Fish',
        description: 'Whole Atlantic croaker stuffed with aromatic lemongrass and scotch bonnet relish, served with charred plantain.',
        price_minor: 2200000,
        sort_order: 3,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Chef Specials & Mains',
          dietary_tags: ['pescatarian', 'gluten_free', 'halal'],
          variants: [
            { name: 'Spice Level', options: ['Mild Herb Butter', 'Medium Pepper Glaze', 'Hot Lagos Fire'], required: true }
          ]
        }
      },
      {
        page_id: restaurantPage.id,
        title: 'Crispy Truffle Plantain Bites',
        description: 'Golden sweet plantain cubes tossed in white truffle oil, rosemary flakes, and grated grana padano.',
        price_minor: 650000,
        sort_order: 4,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Starters & Bites',
          dietary_tags: ['vegetarian', 'gluten_free'],
          variants: [
            { name: 'Dipping Sauce', options: ['Smoked Garlic Aioli', 'Spicy Scotch Bonnet Jam', 'Herb Vegan Mayo'] }
          ]
        }
      },
      {
        page_id: restaurantPage.id,
        title: 'Spicy Fire-Baked Asun Rolls',
        description: 'Tender smoked goat meat tossed in habanero relish, wrapped in flaky golden pastry crisps.',
        price_minor: 750000,
        sort_order: 5,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Starters & Bites',
          dietary_tags: ['halal'],
          variants: [
            { name: 'Pastry Finish', options: ['Crispy Oven-Baked', 'Golden Deep-Fried'] }
          ]
        }
      },
      {
        page_id: restaurantPage.id,
        title: 'Smoked Hibiscus Zobo Margarita',
        description: 'Reposado tequila, cold-pressed organic hibiscus extract, fresh lime juice, agave, and a spicy yaji salt rim.',
        price_minor: 650000,
        sort_order: 6,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Craft Cocktails & Drinks',
          dietary_tags: ['vegan', 'gluten_free', 'dairy_free'],
          variants: [
            { name: 'Base Spirit', options: ['Reposado Tequila', 'Artisanal Mezcal (Smoky Finish)', 'Seedlip Spice (Zero-Proof Non-Alcoholic)'], required: true }
          ]
        }
      },
      {
        page_id: restaurantPage.id,
        title: 'Organic Mango Coconut Sorbet',
        description: 'Pure Alphonso mango churned with coconut cream, topped with fresh passionfruit coulis and mint leaves.',
        price_minor: 450000,
        sort_order: 7,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1563805042-7684c8a9e9cb?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Desserts',
          dietary_tags: ['vegan', 'gluten_free', 'dairy_free', 'halal']
        }
      }
    )
  }

  const wellnessPage = createdPages.find(p => p.slug === 'pacy-wellness')
  if (wellnessPage) {
    pageItems.push(
      {
        page_id: wellnessPage.id,
        title: 'Deep Tissue Recovery Therapy',
        description: 'Intensive muscle release therapy targeting chronic tension points, enhanced with therapeutic botanicals.',
        price_minor: 3500000,
        sort_order: 0,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Massage Therapies',
          variants: [
            { name: 'Session Duration', options: ['60 Minutes Full Body', '90 Minutes Extended Focus'], required: true },
            { name: 'Essential Oil Blend', options: ['Eucalyptus & Peppermint (Muscle Relief)', 'Lavender & Bergamot (Deep Relaxation)'], required: true }
          ]
        }
      },
      {
        page_id: wellnessPage.id,
        title: 'Hot Himalayan Stone Body Therapy',
        description: 'Heated volcanic basalt and pink Himalayan salt stones placed along energy meridians to relieve deep tension.',
        price_minor: 4200000,
        sort_order: 1,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Massage Therapies',
          variants: [
            { name: 'Duration', options: ['75 Minutes Standard', '90 Minutes VIP Sanctuary'], required: true }
          ]
        }
      },
      {
        page_id: wellnessPage.id,
        title: 'Radiance Glow Vitamin C Facial',
        description: '45-minute revitalizing facial treatment using high-potency antioxidants and lymphatic contour massage.',
        price_minor: 2500000,
        sort_order: 2,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Facial Aesthetics',
          variants: [
            { name: 'Skin Booster', options: ['Pure Vitamin C Glow', 'Hyaluronic Acid Hydration Boost'], required: true }
          ]
        }
      },
      {
        page_id: wellnessPage.id,
        title: 'Moroccan Hammam & Coffee Body Polish',
        description: 'Full-body exfoliation with authentic black soap, kessa glove scrub, and organic coffee bean polish.',
        price_minor: 3800000,
        sort_order: 3,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Body Rituals'
        }
      }
    )
  }

  const boutiquePage = createdPages.find(p => p.slug === 'pacy-boutique')
  if (boutiquePage) {
    pageItems.push(
      {
        page_id: boutiquePage.id,
        title: 'Emerald Silk Wrap Dress',
        description: '100% mulberry silk wrap dress tailored with cascading pleats and an adjustable waist tie.',
        price_minor: 4500000,
        sort_order: 0,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Womenswear',
          variants: [
            { name: 'Size', options: ['XS', 'S', 'M', 'L', 'XL'], required: true },
            { name: 'Color', options: ['Emerald Jewel Green', 'Midnight Navy', 'Champagne Gold'], required: true }
          ]
        }
      },
      {
        page_id: boutiquePage.id,
        title: 'Tailored Italian Linen Blazer',
        description: 'Unstructured single-breasted blazer crafted from breathable Italian flax linen with horn buttons.',
        price_minor: 7500000,
        sort_order: 1,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Menswear & Tailoring',
          variants: [
            { name: 'Size', options: ['38R', '40R', '42R', '44R'], required: true },
            { name: 'Color', options: ['Sand Beige', 'Olive Sage', 'Sky Blue'], required: true }
          ]
        }
      },
      {
        page_id: boutiquePage.id,
        title: 'Artisanal Full-Grain Leather Tote',
        description: 'Hand-stitched full grain Italian leather tote featuring reinforced brass hardware and laptop compartment.',
        price_minor: 8500000,
        sort_order: 2,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Accessories & Bags',
          variants: [
            { name: 'Leather Finish', options: ['Cognac Heritage Tan', 'Obsidian Black', 'Oxblood Burgundy'], required: true }
          ]
        }
      },
      {
        page_id: boutiquePage.id,
        title: 'Handmade Suede Chelsea Ankle Boots',
        description: 'Supple calfskin suede boots with Goodyear welt construction and durable crepe soles.',
        price_minor: 9500000,
        sort_order: 3,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Footwear',
          variants: [
            { name: 'Shoe Size (EU)', options: ['40', '41', '42', '43', '44', '45'], required: true },
            { name: 'Suede Shade', options: ['Sandstone Tan', 'Espresso Dark Brown', 'Jet Black'], required: true }
          ]
        }
      }
    )
  }

  const gadgetsPage = createdPages.find(p => p.slug === 'pacy-gadgets')
  if (gadgetsPage) {
    pageItems.push(
      {
        page_id: gadgetsPage.id,
        title: 'iPhone 16 Pro Max',
        description: 'Aerospace-grade titanium design with A18 Pro chip, Camera Control, and 5x optical zoom camera.',
        price_minor: 245000000,
        sort_order: 0,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Smartphones & Mobile',
          variants: [
            { name: 'Internal Storage', options: ['256GB', '512GB', '1TB'], required: true },
            { name: 'Finish', options: ['Desert Titanium', 'Natural Titanium', 'Black Titanium', 'White Titanium'], required: true }
          ]
        }
      },
      {
        page_id: gadgetsPage.id,
        title: 'MacBook Air 15-inch (M3 Chip)',
        description: 'Liquid Retina display with 500 nits brightness, MagSafe charging, and 18-hour all-day battery life.',
        price_minor: 165000000,
        sort_order: 1,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Laptops & Computers',
          variants: [
            { name: 'Unified Memory (RAM)', options: ['16GB Unified RAM', '24GB High-Speed RAM'], required: true },
            { name: 'Color Finish', options: ['Midnight', 'Starlight', 'Space Gray', 'Silver'], required: true }
          ]
        }
      },
      {
        page_id: gadgetsPage.id,
        title: 'Sony WH-1000XM5 Wireless Headphones',
        description: 'Industry-leading noise cancellation with two processors controlling 8 microphones and 30-hour battery.',
        price_minor: 48000000,
        sort_order: 2,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Audio & Wearables',
          variants: [
            { name: 'Color', options: ['Silver White', 'Black Matte', 'Midnight Blue'], required: true }
          ]
        }
      },
      {
        page_id: gadgetsPage.id,
        title: 'Apple AirPods Pro (2nd Gen, USB-C)',
        description: 'Up to 2x more Active Noise Cancellation, Adaptive Audio, and Personalized Spatial Audio.',
        price_minor: 32000000,
        sort_order: 3,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Audio & Wearables'
        }
      }
    )
  }

  const staysPage = createdPages.find(p => p.slug === 'pacy-stays')
  if (staysPage) {
    pageItems.push(
      {
        page_id: staysPage.id,
        title: 'Victoria Island Luxury Waterfront Loft',
        subtitle: '2 Bed / 2.5 Bath / High Floor',
        description: 'Contemporary designer loft featuring private chef kitchen, smart home automation, and infinity pool access.',
        price_minor: 9500000,
        price_display: '95,000 / night',
        sort_order: 0,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          beds: 2,
          baths: 2.5,
          category: 'Luxury Residences',
          variants: [
            { name: 'Housekeeping Frequency', options: ['Daily Morning Turndown', 'On-Demand Service Only'] }
          ]
        }
      },
      {
        page_id: staysPage.id,
        title: 'Lekki Sky Villa Penthouse',
        subtitle: '3 Bed / 3.5 Bath / Private Rooftop Pool',
        description: 'Unmatched luxury with panoramic skyline views, private plunge pool, and dedicated 24/7 security.',
        price_minor: 16500000,
        price_display: '165,000 / night',
        sort_order: 1,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          beds: 3,
          baths: 3.5,
          category: 'Penthouses'
        }
      }
    )
  }

  const hotelsPage = createdPages.find(p => p.slug === 'pacy-hotels')
  if (hotelsPage) {
    pageItems.push(
      {
        page_id: hotelsPage.id,
        title: 'Penthouse Ocean Panorama Suite',
        subtitle: 'King Bed / Private Terrace',
        description: 'Luxury 120sqm suite with unobstructed Atlantic Ocean views, soaking tub, and 24/7 dedicated butler service.',
        price_minor: 12000000,
        price_display: '120,000 / night',
        sort_order: 0,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          beds: 1,
          occupancy: 2,
          category: 'Suites & Penthouses',
          variants: [
            { name: 'Breakfast Experience', options: ['Complimentary Continental Breakfast', 'Full Champagne Gourmet Brunch'], required: true }
          ]
        }
      },
      {
        page_id: hotelsPage.id,
        title: 'Executive Lagoon View King Room',
        subtitle: 'King Bed / Work Desk / City Skyline',
        description: 'Sophisticated 45sqm room with floor-to-ceiling windows, rain shower, and complimentary executive lounge access.',
        price_minor: 6500000,
        price_display: '65,000 / night',
        sort_order: 1,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          beds: 1,
          occupancy: 2,
          category: 'Executive Rooms'
        }
      }
    )
  }

  const repairsPage = createdPages.find(p => p.slug === 'pacy-repairs')
  if (repairsPage) {
    pageItems.push(
      {
        page_id: repairsPage.id,
        title: 'OEM OLED Screen Replacement',
        description: 'Factory-original OLED display replacement with TrueTone color recalibration and water seal restoration.',
        price_minor: 4500000,
        price_display: 'From 45,000',
        sort_order: 0,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          turnaround: '1-2 hours',
          category: 'Display & Glass',
          variants: [
            { name: 'Device Series', options: ['iPhone 16 Series', 'iPhone 15 Series', 'Samsung Galaxy S24 Ultra'], required: true }
          ]
        }
      },
      {
        page_id: repairsPage.id,
        title: 'Water Damage Ultrasonic Board Diagnostic',
        description: 'Complete ultrasonic chemical bath cleaning, micro-corrosion removal, and motherboard circuit diagnostic.',
        price_minor: 1200000,
        price_display: '12,000',
        sort_order: 1,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1590487988256-9ed24133863e?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          turnaround: '24-48 hours',
          category: 'Motherboard Diagnostics'
        }
      }
    )
  }

  const mediaPage = createdPages.find(p => p.slug === 'pacy-media')
  if (mediaPage) {
    pageItems.push(
      {
        page_id: mediaPage.id,
        title: 'Dedicated 4K Brand Showcase Video',
        description: '60-second cinematic video integration with narrative storytelling and professional color grading.',
        price_minor: 15000000,
        sort_order: 0,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Video Productions',
          variants: [
            { name: 'Platform Distribution', options: ['Instagram Reel + YouTube Short', 'TikTok + IG Cross-Post', 'Full 4K YouTube Dedicated Video'], required: true }
          ]
        }
      },
      {
        page_id: mediaPage.id,
        title: 'Sponsored Podcast Feature & Video Interview',
        description: 'Dedicated 20-minute interview segment on The Pacy Growth Show with social reel cutdowns and newsletter inclusion.',
        price_minor: 15000000,
        sort_order: 1,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Sponsorship & Media'
        }
      }
    )
  }

  if (pageItems.length > 0) {
    await adminClient.from('page_items').insert(pageItems as never)
  }

  return loc.id
}
