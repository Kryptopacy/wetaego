import { createAdminClient } from '@/lib/supabase/server'

/**
 * Ensures the permanent flagship demo at /m/demo is 100% 1:1 with Pacy Group:
 * - 9 Full Multi-Concept Showcase Businesses (Restaurant, Wellness Spa, Fashion Boutique, Tech Gadgets, Stays, Hotels, Gadget Repairs, Media Studio, Links)
 * - Rich Design Tokens & Unique Aesthetic per Concept (Bento Grid, Masonry, Glassmorphism, Neumorphism, Modern/Elegant/Industrial Typography)
 * - Exhaustive Catalog (75+ items with rich variants, doneness, storage, sizes, images, dietary tags, turnaround times)
 * - Public AI Assistant & Concierge Configured for seamless guest interactions & WebMCP agents
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
    const { data: anyOrg } = await adminClient
      .from('organizations')
      .select('id, created_by')
      .limit(1)
      .maybeSingle()

    let creatorId = anyOrg?.created_by

    if (!creatorId) {
      try {
        const { data: authUsers } = await adminClient.auth.admin.listUsers({ perPage: 1 })
        creatorId = authUsers?.users?.[0]?.id
      } catch (authErr) {
        console.error('[ensureFlagshipDemo] listUsers error:', authErr)
      }
    }

    if (!creatorId) {
      const { data: userProfiles } = await adminClient
        .from('user_profiles')
        .select('id')
        .limit(1)
        .maybeSingle()
      creatorId = userProfiles?.id || '00000000-0000-0000-0000-000000000000'
    }

    const orgPayload = {
      name: 'Pacy Group',
      slug: 'pacy-group-flagship',
      created_by: creatorId,
      is_demo: false, // Permanent showcase
      portal_name: 'Pacy Group',
      portal_theme_color: '#0f7b55',
      status: 'approved',
      subscription_plan: 'enterprise'
    }

    const { data: newOrg, error: orgError } = await adminClient
      .from('organizations')
      .insert(orgPayload as never)
      .select('id, slug, name')
      .single()

    if (orgError) {
      console.error('[ensureFlagshipDemo] Org creation error:', orgError)
      if (anyOrg) {
        org = { id: anyOrg.id, slug: 'pacy-group-flagship', name: 'Pacy Group' }
      }
    } else {
      org = newOrg
    }
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
    name: 'Pacy Group',
    portal_display_name: 'Pacy Group',
    slug: 'demo',
    address: '42 Victoria Island, Lagos, Nigeria',
    currency_code: 'NGN',
    theme_color: '#0f7b55',
    cover_image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1920&h=1080',
    operating_hours: 'Mon-Sun, 24/7 Multi-Service Operations',
    wifi_network: 'Pacy_Guest_5G',
    wifi_password: 'pacygroup2026',
    instagram_handle: '@pacygroup',
    twitter_handle: '@pacygroup',
    facebook_handle: 'Pacy Group Global',
    whatsapp_number: '+2348000000000',
    phone_number: '0800 7229 4768',
    google_maps_url: 'https://maps.google.com',
    ai_enabled: true,
    ai_name: 'Pacy Concierge AI',
    ai_base_personality: 'professional',
    ai_escalation_contact: 'ask a staff member nearby or WhatsApp 0800 7229 4768',
    ai_instructions: 'You are the intelligent concierge for Pacy Group — a premier multi-concept conglomerate in Lagos. Intelligently answer guest questions regarding dining reservations, spa bookings, luxury stays, boutique fashion sizing, gadget purchases, repair diagnostics, and media production quotes. Seamlessly suggest pairings and guide users through checkout.',
    ai_faqs: [
      { question: 'What businesses operate under Pacy Group?', answer: 'Pacy Group encompasses Pacy Grills & Lounge (Fine Dining), Pacy Wellness Spa, Pacy Fashion Boutique, Pacy Gadgets, Pacy Stays (Serviced Lofts), Pacy Hotels, Pacy Gadget Repairs, and Pacy Media & Creators.' },
      { question: 'What payment methods do you accept?', answer: 'We accept all Nigerian and International Debit/Credit Cards (Mastercard, Visa, Verve), Apple Pay, Google Pay, direct bank transfers, and our signature Payment Roulette for group dinners.' },
      { question: 'Can I book multiple services in one visit?', answer: 'Absolutely. You can book dining, spa appointments, and hotel accommodations seamlessly through our unified concierge system.' }
    ],
    brand_knowledge: 'Pacy Group is an elite commercial conglomerate in Lagos, Nigeria. Spanning hospitality, wellness, fashion, electronics, serviced short-lets, luxury hotels, gadget micro-soldering, and media creation studios.',
    publication_status: 'published' as const,
    manual_payment_enabled: true,
    manual_payment_bank_name: 'WETAEGO Commercial Bank',
    manual_payment_account_name: 'Pacy Group Conglomerate Demo',
    manual_payment_account_number: '0123456789',
    manual_payment_instructions: 'This is the live flagship multi-concept demo. No actual card will be charged. Click "I Have Transferred" to test the complete order fulfillment and receipt workflow!'
  }

  if (!loc) {
    const { data: newLoc, error: locError } = await adminClient
      .from('locations')
      .insert(locationPayload as never)
      .select('id, slug, name, organization_id')
      .single()

    if (locError) {
      console.error('[ensureFlagshipDemo] Location creation error:', locError)
    }
    loc = newLoc
  } else {
    await adminClient
      .from('locations')
      .update(locationPayload as never)
      .eq('id', loc.id)
  }

  if (!loc) {
    console.error('[ensureFlagshipDemo] Failed to locate or create demo location row.')
    return null
  }

  // 3. Verify if all 9 pages exist with the correct Pacy slugs and rich inventory
  const { data: existingPages } = await adminClient
    .from('location_pages')
    .select('id, slug')
    .eq('location_id', loc.id)

  const expectedSlugs = ['restaurant', 'pacy-media', 'pacy-wellness', 'pacy-stays', 'pacy-boutique', 'pacy-hotels', 'pacy-repairs', 'pacy-gadgets', 'links']
  const existingSlugs = existingPages?.map((p: { slug: string }) => p.slug) || []
  const hasAllCorrectPages = expectedSlugs.every((s: string) => existingSlugs.includes(s))

  // Always re-sync pages and items if stale or missing
  const isStale = !hasAllCorrectPages
  if (isStale) {
    if (existingPages && existingPages.length > 0) {
      const pageIds = existingPages.map((p: { id: string }) => p.id)
      await adminClient.from('page_items').delete().in('page_id', pageIds)
      await adminClient.from('location_pages').delete().eq('location_id', loc.id)
    }
  } else {
    // If all pages exist, check if items count is rich (>= 50 items)
    if (existingPages && existingPages.length > 0) {
      const pageIds = existingPages.map((p: { id: string }) => p.id)
      const { count: itemCount } = await adminClient
        .from('page_items')
        .select('id', { count: 'exact', head: true })
        .in('page_id', pageIds)

      if (itemCount && itemCount >= 50) {
        return loc.id
      }

      // Otherwise purge old sparse items and re-insert rich catalog
      await adminClient.from('page_items').delete().in('page_id', pageIds)
      await adminClient.from('location_pages').delete().eq('location_id', loc.id)
    }
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
      deals_enabled: true,
      theme_color: '#0f7b55',
      design_tokens: { layout_mode: 'bento_grid', surface_style: 'glassmorphism', typography: 'modern', corner_radius: '2xl' }
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
      deals_enabled: true,
      theme_color: '#8b5cf6',
      design_tokens: { layout_mode: 'list', surface_style: 'glassmorphism', typography: 'elegant', corner_radius: '2xl' }
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
      deals_enabled: true,
      theme_color: '#d97706',
      design_tokens: { layout_mode: 'masonry', surface_style: 'flat', typography: 'elegant', corner_radius: 'lg' }
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
      deals_enabled: true,
      theme_color: '#2563eb',
      design_tokens: { layout_mode: 'bento_grid', surface_style: 'glassmorphism', typography: 'industrial', corner_radius: 'xl' }
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
      deals_enabled: true,
      theme_color: '#059669',
      design_tokens: { layout_mode: 'masonry', surface_style: 'flat', typography: 'modern', corner_radius: 'xl' }
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
      deals_enabled: true,
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
      deals_enabled: true,
      theme_color: '#0284c7',
      design_tokens: { layout_mode: 'bento_grid', surface_style: 'neumorphism', typography: 'industrial', corner_radius: 'md' }
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
      deals_enabled: true,
      theme_color: '#ec4899',
      design_tokens: { layout_mode: 'list', surface_style: 'glassmorphism', typography: 'modern', corner_radius: 'xl' }
    },
    {
      location_id: loc.id,
      slug: 'links',
      title: 'Our Links',
      template_type: 'info',
      content: JSON.stringify({
        links: [
          { label: 'Follow on Instagram', url: 'https://instagram.com/pacygroup' },
          { label: 'Follow on X (Twitter)', url: 'https://x.com/pacygroup' },
          { label: 'Corporate Headquarters on Google Maps', url: 'https://maps.google.com' },
          { label: 'Leave a Verified Customer Review', url: 'https://google.com' }
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

  // ── A. RESTAURANT: Pacy Grills & Lounge (16 Curated Items) ───────────────────
  const restaurantPage = createdPages.find((p: { slug: string }) => p.slug === 'restaurant')
  if (restaurantPage) {
    pageItems.push(
      {
        page_id: restaurantPage.id,
        title: '24-Hour Suya Ribeye Steak',
        description: 'Prime 350g Angus ribeye marinated in artisanal suya spice rub, flame-seared over scented cherrywood charcoal.',
        price_minor: 2800000,
        sort_order: 0,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Chef Signature Steaks & Mains',
          dietary_tags: ['halal', 'gluten_free'],
          variants: [
            { name: 'Doneness', options: ['Medium Rare (Chef Recommended)', 'Medium', 'Medium Well', 'Well Done'], required: true },
            { name: 'Spice Level', options: ['Mild Yaji Dust', 'Classic Lagos Heat', 'Extra Hot Pepper Fire'], required: true },
            { name: 'Complimentary Side', options: ['Truffle Plantain Fries', 'Smoky Jollof Rice', 'Grilled Sweet Potato Mash', 'Sautéed Garlic Greens'], required: true }
          ]
        }
      },
      {
        page_id: restaurantPage.id,
        title: 'Smoked Jollof Paella',
        description: 'Firewood-smoked jollof rice tossed with jumbo tiger prawns, calamari rings, artisanal beef chorizo, and saffron aioli.',
        price_minor: 1950000,
        sort_order: 1,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Chef Signature Steaks & Mains',
          dietary_tags: ['pescatarian', 'gluten_free', 'halal'],
          variants: [
            { name: 'Seafood Add-on', options: ['Standard Seafood Mix', 'Extra Jumbo Tiger Prawns (+₦4,500)', 'Whole Grilled Lobster Tail (+₦12,000)'] }
          ]
        }
      },
      {
        page_id: restaurantPage.id,
        title: 'Wild Mushroom Truffle Tagliatelle',
        description: 'Fresh handmade pasta ribbons tossed in silky black truffle cream, sautéed king oyster mushrooms, and aged parmesan crisp.',
        price_minor: 1850000,
        sort_order: 2,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Chef Signature Steaks & Mains',
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
        description: 'Whole Atlantic croaker stuffed with aromatic lemongrass and scotch bonnet relish, served with charred sweet plantain.',
        price_minor: 2200000,
        sort_order: 3,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Chef Signature Steaks & Mains',
          dietary_tags: ['pescatarian', 'gluten_free', 'halal'],
          variants: [
            { name: 'Spice Level', options: ['Mild Herb Butter', 'Medium Pepper Glaze', 'Hot Lagos Fire'], required: true }
          ]
        }
      },
      {
        page_id: restaurantPage.id,
        title: 'Slow-Braised Tamarind Short Ribs',
        description: 'Melt-in-mouth beef short ribs braised for 8 hours in spiced tamarind reduction, served on creamed yam purée.',
        price_minor: 3200000,
        sort_order: 4,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Chef Signature Steaks & Mains',
          dietary_tags: ['halal', 'gluten_free']
        }
      },
      {
        page_id: restaurantPage.id,
        title: 'Flame-Grilled Lobster Thermidor',
        description: 'Whole Atlantic lobster meat baked in rich brandy Dijon velouté, gruyère cheese, and fresh tarragon crust.',
        price_minor: 4800000,
        sort_order: 5,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Chef Signature Steaks & Mains',
          dietary_tags: ['pescatarian', 'halal']
        }
      },
      {
        page_id: restaurantPage.id,
        title: 'Crispy Truffle Plantain Bites',
        description: 'Golden sweet plantain cubes tossed in white truffle oil, rosemary flakes, and freshly grated grana padano.',
        price_minor: 650000,
        sort_order: 6,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Starters & Small Plates',
          dietary_tags: ['vegetarian', 'gluten_free'],
          variants: [
            { name: 'Dipping Sauce', options: ['Smoked Garlic Aioli', 'Spicy Scotch Bonnet Jam', 'Herb Vegan Mayo'] }
          ]
        }
      },
      {
        page_id: restaurantPage.id,
        title: 'Spicy Fire-Baked Asun Rolls',
        description: 'Tender smoked goat meat tossed in habanero relish, wrapped in flaky golden oven-baked pastry crisps.',
        price_minor: 750000,
        sort_order: 7,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Starters & Small Plates',
          dietary_tags: ['halal'],
          variants: [
            { name: 'Pastry Finish', options: ['Crispy Oven-Baked', 'Golden Deep-Fried'] }
          ]
        }
      },
      {
        page_id: restaurantPage.id,
        title: 'Panko Calamari with Yaji Aioli',
        description: 'Flash-fried tender baby squid rings crusted in seasoned panko crumbs, served with lime wedges and spicy yaji aioli.',
        price_minor: 850000,
        sort_order: 8,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1527477378375-ed367cb8b871?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Starters & Small Plates',
          dietary_tags: ['pescatarian', 'halal']
        }
      },
      {
        page_id: restaurantPage.id,
        title: 'Charcoal Goat Meat Pepper Soup',
        description: 'Aromatic restorative broth infused with roasted African nutmeg, uziza leaves, and tender bone-in goat cutlets.',
        price_minor: 950000,
        sort_order: 9,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Starters & Small Plates',
          dietary_tags: ['halal', 'gluten_free']
        }
      },
      {
        page_id: restaurantPage.id,
        title: 'Smoked Hibiscus Zobo Margarita',
        description: 'Reposado tequila, cold-pressed organic hibiscus extract, fresh lime juice, agave nectar, and a spicy yaji salt rim.',
        price_minor: 650000,
        sort_order: 10,
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
        title: 'Lagos Gold Smoked Old Fashioned',
        description: 'Bourbon infused with toasted coconut and kola nut bitters, smoked live tableside with cherrywood smoke.',
        price_minor: 850000,
        sort_order: 11,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Craft Cocktails & Drinks',
          dietary_tags: ['vegan', 'gluten_free']
        }
      },
      {
        page_id: restaurantPage.id,
        title: 'Passionfruit Coconut Mojito',
        description: 'White rum, freshly crushed mint leaves, passionfruit purée, sparkling coconut water, and raw cane sugar syrup.',
        price_minor: 600000,
        sort_order: 12,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Craft Cocktails & Drinks',
          dietary_tags: ['vegan', 'gluten_free']
        }
      },
      {
        page_id: restaurantPage.id,
        title: 'Organic Mango Coconut Sorbet',
        description: 'Pure Alphonso mango churned with fresh coconut milk, topped with passionfruit coulis and mint leaves.',
        price_minor: 450000,
        sort_order: 13,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1563805042-7684c8a9e9cb?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Desserts & Sweets',
          dietary_tags: ['vegan', 'gluten_free', 'dairy_free', 'halal']
        }
      },
      {
        page_id: restaurantPage.id,
        title: 'Warm Plantain Brioche Bread Pudding',
        description: 'Caramelized sweet plantain and buttery brioche baked in vanilla custard, served with salted rum gelato.',
        price_minor: 550000,
        sort_order: 14,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Desserts & Sweets',
          dietary_tags: ['vegetarian', 'halal']
        }
      },
      {
        page_id: restaurantPage.id,
        title: 'Pacy Grand Meat & Seafood Sharing Board',
        description: 'Giant platter featuring Suya Angus Ribeye, Jumbo Tiger Prawns, Asun Goat bites, Truffle plantain, and 4 artisanal dipping sauces. Feeds 3-4 guests.',
        price_minor: 6500000,
        sort_order: 15,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Sharing Platters & Feasts',
          dietary_tags: ['halal', 'gluten_free']
        }
      }
    )
  }

  // ── B. WELLNESS SPA: Pacy Wellness Spa (12 Curated Therapies) ────────────────
  const wellnessPage = createdPages.find((p: { slug: string }) => p.slug === 'pacy-wellness')
  if (wellnessPage) {
    pageItems.push(
      {
        page_id: wellnessPage.id,
        title: 'Deep Tissue Recovery Therapy',
        description: 'Intensive muscle release therapy targeting chronic tension points, enhanced with therapeutic eucalyptus botanicals.',
        price_minor: 3500000,
        sort_order: 0,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Signature Massage Therapies',
          variants: [
            { name: 'Session Duration', options: ['60 Minutes Full Body', '90 Minutes Extended Focus (+₦15,000)'], required: true },
            { name: 'Essential Oil Blend', options: ['Eucalyptus & Peppermint (Muscle Relief)', 'Lavender & Bergamot (Deep Relaxation)', 'Lemongrass & Ginger (Invigorating)'], required: true }
          ]
        }
      },
      {
        page_id: wellnessPage.id,
        title: 'Hot Himalayan Stone Body Therapy',
        description: 'Heated volcanic basalt and pink Himalayan salt stones placed along energy meridians to melt deep muscular stress.',
        price_minor: 4200000,
        sort_order: 1,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Signature Massage Therapies',
          variants: [
            { name: 'Duration', options: ['75 Minutes Standard', '90 Minutes VIP Sanctuary (+₦12,000)'], required: true }
          ]
        }
      },
      {
        page_id: wellnessPage.id,
        title: 'Aromatherapy Serenity Massage',
        description: 'Gentle rhythmic Swedish strokes combined with bespoke pure botanical essences to restore emotional and physical balance.',
        price_minor: 3000000,
        sort_order: 2,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Signature Massage Therapies',
          variants: [
            { name: 'Aroma Goal', options: ['Stress Relief & Sleep', 'Energy & Focus Revival', 'Detox & Circulation'], required: true }
          ]
        }
      },
      {
        page_id: wellnessPage.id,
        title: 'Swedish Lymphatic Drainage Therapy',
        description: 'Specialized light-pressure therapy promoting natural lymphatic fluid circulation to reduce bloating and eliminate metabolic waste.',
        price_minor: 3800000,
        sort_order: 3,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Signature Massage Therapies'
        }
      },
      {
        page_id: wellnessPage.id,
        title: 'Radiance Glow Vitamin C Facial',
        description: '45-minute revitalizing clinical facial treatment utilizing high-potency antioxidant serum and sculpting lymphatic drainage.',
        price_minor: 2500000,
        sort_order: 4,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Facial Aesthetics & Clinical Skincare',
          variants: [
            { name: 'Skin Booster', options: ['Pure Vitamin C Glow Serum', 'Triple Hyaluronic Acid Plumping Serum'], required: true }
          ]
        }
      },
      {
        page_id: wellnessPage.id,
        title: '24K Gold Collagen Lift Facial',
        description: 'Elite 75-minute anti-aging ritual applying real 24K gold foil sheets, micro-current lifting, and deep marine collagen infusion.',
        price_minor: 5500000,
        sort_order: 5,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1512290900672-1f023330ff22?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Facial Aesthetics & Clinical Skincare'
        }
      },
      {
        page_id: wellnessPage.id,
        title: 'Deep Pore Clarifying Detox Facial',
        description: 'Ultrasonic pore vacuuming, salicylic exfoliation, botanical steam, and antibacterial blue LED light therapy for blemish-free skin.',
        price_minor: 2800000,
        sort_order: 6,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Facial Aesthetics & Clinical Skincare'
        }
      },
      {
        page_id: wellnessPage.id,
        title: 'Moroccan Hammam & Coffee Body Polish',
        description: 'Full-body steam ritual with authentic black soap exfoliation, kessa glove scrub, and organic ground coffee bean buffing.',
        price_minor: 3800000,
        sort_order: 7,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Body Exfoliation & Hammam Rituals'
        }
      },
      {
        page_id: wellnessPage.id,
        title: 'Gold Shimmer Body Cocoon Scrub',
        description: 'Luxurious organic shea butter wrap infused with crushed mineral gold shimmer to leave skin luminous and velvety soft.',
        price_minor: 4000000,
        sort_order: 8,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Body Exfoliation & Hammam Rituals'
        }
      },
      {
        page_id: wellnessPage.id,
        title: 'Luxury Russian Gel Manicure',
        description: 'Precision e-file cuticle care, strengthening builder base, and chip-free gel polish finished with organic cuticle oil.',
        price_minor: 1800000,
        sort_order: 9,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Nail Sanctum & Hand Care'
        }
      },
      {
        page_id: wellnessPage.id,
        title: 'Diamond Pedicure & Paraffin Bath',
        description: 'Volcano foot soak, callus elimination, diamond scrub, heated paraffin wax treatment, and deep reflexology foot massage.',
        price_minor: 2200000,
        sort_order: 10,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Nail Sanctum & Hand Care'
        }
      },
      {
        page_id: wellnessPage.id,
        title: 'Couples Royal Sanctuary Retreat',
        description: '120-minute private VIP suite ritual including twin 90-min Aromatherapy massages, private jacuzzi soak, and chilled champagne with chocolate strawberries.',
        price_minor: 9500000,
        sort_order: 11,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'VIP Sanctuary & Couples Packages'
        }
      }
    )
  }

  // ── C. BOUTIQUE: Pacy Fashion (12 Curated Apparel & Accessories) ─────────────
  const boutiquePage = createdPages.find((p: { slug: string }) => p.slug === 'pacy-boutique')
  if (boutiquePage) {
    pageItems.push(
      {
        page_id: boutiquePage.id,
        title: 'Emerald Silk Wrap Dress',
        description: '100% pure mulberry silk wrap dress tailored with cascading drape pleats and an adjustable self-tie waist.',
        price_minor: 4500000,
        sort_order: 0,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Womenswear & Haute Prêt-à-Porter',
          variants: [
            { name: 'Size', options: ['XS (UK 6)', 'S (UK 8)', 'M (UK 10)', 'L (UK 12)', 'XL (UK 14)'], required: true },
            { name: 'Color', options: ['Emerald Jewel Green', 'Midnight Obsidian', 'Champagne Silk Gold'], required: true }
          ]
        }
      },
      {
        page_id: boutiquePage.id,
        title: 'Structured Velvet Evening Gown',
        description: 'Sculpted corseted bodice with off-shoulder velvet drape and a dramatic side slit, handcrafted in Milan.',
        price_minor: 8500000,
        sort_order: 1,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Womenswear & Haute Prêt-à-Porter',
          variants: [
            { name: 'Size', options: ['UK 8', 'UK 10', 'UK 12', 'UK 14'], required: true },
            { name: 'Color', options: ['Burgundy Velvet', 'Royal Midnight Blue'], required: true }
          ]
        }
      },
      {
        page_id: boutiquePage.id,
        title: 'Tailored Italian Linen Blazer',
        description: 'Unstructured single-breasted jacket crafted from breathable organic Italian flax linen with genuine horn buttons.',
        price_minor: 7500000,
        sort_order: 2,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Menswear & Bespoke Tailoring',
          variants: [
            { name: 'Chest Size', options: ['38R (Slim)', '40R (Standard)', '42R (Comfort)', '44R (Broad)'], required: true },
            { name: 'Color', options: ['Sand Dune Beige', 'Olive Sage Green', 'Sky Horizon Blue'], required: true }
          ]
        }
      },
      {
        page_id: boutiquePage.id,
        title: 'Double-Breasted Wool Tuxedo',
        description: 'Super 150s Merino wool evening tuxedo featuring satin peak lapels, tailored trousers, and hand-finished pick stitching.',
        price_minor: 14500000,
        sort_order: 3,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Menswear & Bespoke Tailoring',
          variants: [
            { name: 'Size', options: ['38R', '40R', '42R', '44R', '46R'], required: true }
          ]
        }
      },
      {
        page_id: boutiquePage.id,
        title: 'Pure Cashmere Knit Sweater',
        description: 'Ultra-soft 2-ply Mongolian cashmere crewneck with ribbed cuffs and hem, designed for all-season effortless layering.',
        price_minor: 3800000,
        sort_order: 4,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Menswear & Bespoke Tailoring',
          variants: [
            { name: 'Size', options: ['S', 'M', 'L', 'XL'], required: true },
            { name: 'Color', options: ['Oatmeal Heather', 'Charcoal Gray', 'Navy Blue'], required: true }
          ]
        }
      },
      {
        page_id: boutiquePage.id,
        title: 'Artisanal Full-Grain Leather Tote',
        description: 'Hand-stitched Italian vegetable-tanned leather tote with solid brass hardware, laptop sleeve, and interior zip pouch.',
        price_minor: 8500000,
        sort_order: 5,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Luxury Leather Goods & Bags',
          variants: [
            { name: 'Leather Finish', options: ['Cognac Heritage Tan', 'Obsidian Jet Black', 'Oxblood Burgundy'], required: true }
          ]
        }
      },
      {
        page_id: boutiquePage.id,
        title: 'Quilted Leather Crossbody Chain Bag',
        description: 'Supple lambskin leather with diamond quilt pattern, palladium chain strap, and signature turnlock closure.',
        price_minor: 6800000,
        sort_order: 6,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Luxury Leather Goods & Bags',
          variants: [
            { name: 'Hardware', options: ['Gold-Tone Brass', 'Silver Palladium'], required: true }
          ]
        }
      },
      {
        page_id: boutiquePage.id,
        title: 'Handmade Suede Chelsea Ankle Boots',
        description: 'Calfskin suede ankle boots constructed with Goodyear welt, elasticated side gussets, and cushioned crepe soles.',
        price_minor: 9500000,
        sort_order: 7,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Artisanal Footwear',
          variants: [
            { name: 'Shoe Size (EU)', options: ['40', '41', '42', '43', '44', '45'], required: true },
            { name: 'Suede Shade', options: ['Sandstone Tan', 'Espresso Dark Brown', 'Jet Black'], required: true }
          ]
        }
      },
      {
        page_id: boutiquePage.id,
        title: 'Italian Calfskin Double Monkstrap Shoes',
        description: 'Hand-burnished museum calf leather dress shoes with dual silver buckles and channel-stitched leather outsoles.',
        price_minor: 11500000,
        sort_order: 8,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Artisanal Footwear',
          variants: [
            { name: 'Shoe Size (EU)', options: ['41', '42', '43', '44', '45'], required: true }
          ]
        }
      },
      {
        page_id: boutiquePage.id,
        title: 'Hand-Engraved Gold Signet Ring',
        description: 'Solid 18K recycled yellow gold signet ring featuring a polished flat face ready for custom bespoke monogramming.',
        price_minor: 12000000,
        sort_order: 9,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Fine Accessories & Jewelry',
          variants: [
            { name: 'Ring Size', options: ['US 7', 'US 8', 'US 9', 'US 10', 'US 11'], required: true }
          ]
        }
      },
      {
        page_id: boutiquePage.id,
        title: 'Polarized Acetate Aviator Sunglasses',
        description: 'Handcrafted Japanese cellulose acetate frames fitted with anti-reflective polarized scratch-resistant category 3 lenses.',
        price_minor: 3200000,
        sort_order: 10,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Fine Accessories & Jewelry'
        }
      },
      {
        page_id: boutiquePage.id,
        title: 'Woven Silk Pocket Square & Tie Set',
        description: 'Jacquard-woven 100% Como silk necktie and matching hand-rolled pocket square with subtle geometric texture.',
        price_minor: 1800000,
        sort_order: 11,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Fine Accessories & Jewelry'
        }
      }
    )
  }

  // ── D. GADGETS: Pacy Gadgets (10 Flagship Electronics) ──────────────────────
  const gadgetsPage = createdPages.find((p: { slug: string }) => p.slug === 'pacy-gadgets')
  if (gadgetsPage) {
    pageItems.push(
      {
        page_id: gadgetsPage.id,
        title: 'iPhone 16 Pro Max',
        description: 'Grade-5 titanium unibody, A18 Pro silicon, Camera Control tactile button, 48MP Fusion camera, and 5x tetraprism optical zoom.',
        price_minor: 245000000,
        sort_order: 0,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Smartphones & Flagship Mobile',
          variants: [
            { name: 'Internal Storage', options: ['256GB NVMe', '512GB NVMe (+₦35,000)', '1TB Extreme (+₦85,000)'], required: true },
            { name: 'Finish', options: ['Desert Titanium', 'Natural Titanium', 'Black Titanium', 'White Titanium'], required: true }
          ]
        }
      },
      {
        page_id: gadgetsPage.id,
        title: 'Samsung Galaxy S24 Ultra',
        description: 'Titanium frame, built-in S-Pen, Snapdragon 8 Gen 3 for Galaxy, Galaxy AI live translation, and 200MP quad telephoto camera.',
        price_minor: 215000000,
        sort_order: 1,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1509741102003-ca64bfe5f069?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Smartphones & Flagship Mobile',
          variants: [
            { name: 'Storage', options: ['256GB', '512GB (+₦30,000)'], required: true },
            { name: 'Color', options: ['Titanium Gray', 'Titanium Black', 'Titanium Violet', 'Titanium Yellow'], required: true }
          ]
        }
      },
      {
        page_id: gadgetsPage.id,
        title: 'MacBook Air 15-inch (M3 Chip)',
        description: 'Liquid Retina display with 500 nits brightness, 1080p FaceTime HD camera, MagSafe 3 charging, and 18-hour battery endurance.',
        price_minor: 165000000,
        sort_order: 2,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Laptops & Creator Workstations',
          variants: [
            { name: 'Unified Memory (RAM)', options: ['16GB Unified RAM', '24GB High-Speed RAM (+₦45,000)'], required: true },
            { name: 'Color Finish', options: ['Midnight', 'Starlight', 'Space Gray', 'Silver'], required: true }
          ]
        }
      },
      {
        page_id: gadgetsPage.id,
        title: 'MacBook Pro 16-inch (M3 Max Chip)',
        description: '16-core CPU, 40-core GPU, Liquid Retina XDR extreme dynamic range display, 128GB unified memory support, and HDMI 2.1.',
        price_minor: 485000000,
        sort_order: 3,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Laptops & Creator Workstations',
          variants: [
            { name: 'Unified Memory', options: ['36GB Unified RAM', '48GB Unified RAM (+₦80,000)', '64GB Extreme RAM (+₦150,000)'], required: true },
            { name: 'Finish', options: ['Space Black', 'Silver'], required: true }
          ]
        }
      },
      {
        page_id: gadgetsPage.id,
        title: 'Sony WH-1000XM5 Wireless Headphones',
        description: 'Dual noise-cancelling processors controlling 8 microphones, Auto NC Optimizer, Hi-Res Audio wireless, and 30 hours of battery.',
        price_minor: 48000000,
        sort_order: 4,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Premium Audio & Wearables',
          variants: [
            { name: 'Color', options: ['Silver White', 'Black Matte', 'Midnight Blue'], required: true }
          ]
        }
      },
      {
        page_id: gadgetsPage.id,
        title: 'Apple AirPods Pro (2nd Gen, USB-C)',
        description: 'H2 chip power, up to 2x more Active Noise Cancellation, Adaptive Audio, Conversation Awareness, and IP54 dust & sweat resistance.',
        price_minor: 32000000,
        sort_order: 5,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Premium Audio & Wearables'
        }
      },
      {
        page_id: gadgetsPage.id,
        title: 'Apple Watch Ultra 2 (Titanium)',
        description: '49mm aerospace titanium case, 3000-nit brightest display, dual-frequency precision GPS, Depth gauge, and 72h Low Power Mode.',
        price_minor: 115000000,
        sort_order: 6,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Premium Audio & Wearables',
          variants: [
            { name: 'Band Style', options: ['Ocean Band (Blue)', 'Alpine Loop (Olive)', 'Trail Loop (Black/Orange)'], required: true }
          ]
        }
      },
      {
        page_id: gadgetsPage.id,
        title: 'DJI Osmo Pocket 3 Creator Combo',
        description: '1-inch CMOS sensor, 4K/120fps recording, 2-inch rotatable OLED touchscreen, 3-axis mechanical stabilization, and DJI Mic 2 included.',
        price_minor: 89000000,
        sort_order: 7,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Creator Gear & Accessories'
        }
      },
      {
        page_id: gadgetsPage.id,
        title: 'Anker Prime 100W GaN Charging Station',
        description: 'Ultra-compact Gallium Nitride 3-port fast wall charger with PowerIQ 4.0 dynamic power distribution and active heat management.',
        price_minor: 9500000,
        sort_order: 8,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Creator Gear & Accessories'
        }
      },
      {
        page_id: gadgetsPage.id,
        title: 'Nomad Horween Leather MagSafe Case',
        description: 'Rugged polycarbonate chassis wrapped in premium American Horween leather that develops a gorgeous rich patina over time.',
        price_minor: 8500000,
        sort_order: 9,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Creator Gear & Accessories',
          variants: [
            { name: 'Device Model', options: ['iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 15 Pro Max'], required: true },
            { name: 'Leather Color', options: ['Rustic Brown', 'Deep Black', 'English Tan'], required: true }
          ]
        }
      }
    )
  }

  // ── E. STAYS: Pacy Stays (6 Luxury Residences) ──────────────────────────────
  const staysPage = createdPages.find((p: { slug: string }) => p.slug === 'pacy-stays')
  if (staysPage) {
    pageItems.push(
      {
        page_id: staysPage.id,
        title: 'Victoria Island Luxury Waterfront Loft',
        subtitle: '2 Bed / 2.5 Bath / High Floor',
        description: 'Contemporary designer loft featuring private chef kitchen, smart home automation, high-speed fiber internet, and infinity pool access.',
        price_minor: 9500000,
        price_display: '95,000 / night',
        sort_order: 0,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          beds: 2,
          baths: 2.5,
          category: 'Luxury Serviced Residences',
          variants: [
            { name: 'Housekeeping Frequency', options: ['Daily Morning Turndown', 'On-Demand Service Only'] }
          ]
        }
      },
      {
        page_id: staysPage.id,
        title: 'Lekki Sky Villa Penthouse',
        subtitle: '3 Bed / 3.5 Bath / Private Rooftop Pool',
        description: 'Unmatched skyline luxury with 360° panoramic views, private plunge pool, outdoor BBQ terrace, and dedicated 24/7 armed security.',
        price_minor: 16500000,
        price_display: '165,000 / night',
        sort_order: 1,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          beds: 3,
          baths: 3.5,
          category: 'Penthouse Collection'
        }
      },
      {
        page_id: staysPage.id,
        title: 'Ikoyi Colonial Heritage Executive Villa',
        subtitle: '4 Bed / 4.5 Bath / Private Garden & Cinema',
        description: 'Sprawling private estate with lush botanical gardens, 8-seater private 4K cinema room, full solar backup power, and chef quarters.',
        price_minor: 25000000,
        price_display: '250,000 / night',
        sort_order: 2,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          beds: 4,
          baths: 4.5,
          category: 'Private Estates & Villas'
        }
      },
      {
        page_id: staysPage.id,
        title: 'Eko Atlantic Minimalist Ocean Studio',
        subtitle: '1 Bed / 1 Bath / Atlantic Views',
        description: 'Floor-to-ceiling Atlantic ocean views, minimalist Scandinavian furnishings, Nespresso bar, gym & Olympic pool access in Eko Atlantic.',
        price_minor: 6500000,
        price_display: '65,000 / night',
        sort_order: 3,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          beds: 1,
          baths: 1,
          category: 'Executive Studios'
        }
      },
      {
        page_id: staysPage.id,
        title: 'Banana Island Ultra-Luxury Waterfront Villa',
        subtitle: '5 Bed / 6 Bath / Private Boat Jetty',
        description: 'Elite mansion with private yacht jetty, temperature-controlled wine cellar, indoor elevator, Finnish sauna, and 24/7 personal butler.',
        price_minor: 45000000,
        price_display: '450,000 / night',
        sort_order: 4,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          beds: 5,
          baths: 6,
          category: 'Private Estates & Villas'
        }
      },
      {
        page_id: staysPage.id,
        title: 'Lekki Phase 1 Modern Art Loft',
        subtitle: '2 Bed / 2 Bath / Double-Height Ceilings',
        description: 'Sun-drenched loft with double-height 6m glass windows, curated Nigerian modern art collection, vinyl sound system, and dedicated workspace.',
        price_minor: 8500000,
        price_display: '85,000 / night',
        sort_order: 5,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          beds: 2,
          baths: 2,
          category: 'Luxury Serviced Residences'
        }
      }
    )
  }

  // ── F. HOTELS: Pacy Hotels (5 Luxury Suites & Rooms) ────────────────────────
  const hotelsPage = createdPages.find((p: { slug: string }) => p.slug === 'pacy-hotels')
  if (hotelsPage) {
    pageItems.push(
      {
        page_id: hotelsPage.id,
        title: 'Penthouse Ocean Panorama Suite',
        subtitle: 'King Bed / Private Terrace / Butler Service',
        description: 'Luxury 120sqm penthouse suite with unobstructed Atlantic Ocean views, freestanding soaking tub, walk-in closet, and 24/7 dedicated butler.',
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
            { name: 'Breakfast Experience', options: ['Complimentary Continental Breakfast', 'Full Champagne Gourmet Brunch (+₦15,000)'], required: true }
          ]
        }
      },
      {
        page_id: hotelsPage.id,
        title: 'Executive Lagoon View King Room',
        subtitle: 'King Bed / Work Desk / Skyline Views',
        description: 'Sophisticated 45sqm room with floor-to-ceiling windows overlooking the Lagos lagoon, marble rain shower, and complimentary executive lounge access.',
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
      },
      {
        page_id: hotelsPage.id,
        title: 'Royal Diplomatic Suite',
        subtitle: '2 King Bedrooms / Boardroom / Jacuzzi',
        description: 'Expansive 160sqm VIP suite with separate formal dining salon for 8, secure boardroom table, master jacuzzi, and private elevator entry.',
        price_minor: 22000000,
        price_display: '220,000 / night',
        sort_order: 2,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          beds: 2,
          occupancy: 4,
          category: 'Suites & Penthouses'
        }
      },
      {
        page_id: hotelsPage.id,
        title: 'Deluxe Heritage King Room',
        subtitle: 'King Bed / Artisanal Woodwork / Nespresso',
        description: '38sqm tranquil haven featuring artisanal African walnut woodwork, high-thread-count Egyptian cotton linens, and luxury Molton Brown amenities.',
        price_minor: 4800000,
        price_display: '48,000 / night',
        sort_order: 3,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          beds: 1,
          occupancy: 2,
          category: 'Deluxe Rooms'
        }
      },
      {
        page_id: hotelsPage.id,
        title: 'Garden Sanctuary Pool Villa',
        subtitle: 'King Bed / Private Plunge Pool / Outdoor Shower',
        description: '90sqm private pavilion nestled in tropical courtyard gardens with personal plunge pool, outdoor rain shower, and inclusive daily chef breakfast.',
        price_minor: 14500000,
        price_display: '145,000 / night',
        sort_order: 4,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          beds: 1,
          occupancy: 2,
          category: 'Garden Villas'
        }
      }
    )
  }

  // ── G. GADGET REPAIRS: Pacy Gadget Repairs (8 Precision Lab Services) ──────
  const repairsPage = createdPages.find((p: { slug: string }) => p.slug === 'pacy-repairs')
  if (repairsPage) {
    pageItems.push(
      {
        page_id: repairsPage.id,
        title: 'OEM OLED Screen & Digitizer Replacement',
        description: 'Factory-original 120Hz OLED display replacement with TrueTone color recalibration, 3D Touch testing, and IP68 water seal restoration.',
        price_minor: 4500000,
        price_display: 'From ₦45,000',
        sort_order: 0,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          turnaround: '1-2 Hours Rapid',
          category: 'Display & Touchscreen',
          variants: [
            { name: 'Device Series', options: ['iPhone 16 Series', 'iPhone 15 Series', 'iPhone 14 Series', 'Samsung Galaxy S24 Ultra', 'Samsung Galaxy Z Fold 5'], required: true }
          ]
        }
      },
      {
        page_id: repairsPage.id,
        title: 'Water Damage Ultrasonic Board Restoration',
        description: 'Ultrasonic chemical bath decontamination, micro-corrosion chemical scrubbing, thermal camera short-circuit tracing, and board rehabilitation.',
        price_minor: 1500000,
        price_display: 'From ₦15,000',
        sort_order: 1,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1590487988256-9ed24133863e?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          turnaround: '24-48 Hours Diagnostic',
          category: 'Motherboard & Micro-Soldering'
        }
      },
      {
        page_id: repairsPage.id,
        title: 'High-Capacity OEM Battery Replacement',
        description: 'Brand-new 0-cycle OEM grade lithium battery installation, thermal heat barrier renewal, and 100% battery health diagnostic calibration.',
        price_minor: 2500000,
        price_display: 'From ₦25,000',
        sort_order: 2,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          turnaround: '30-45 Minutes',
          category: 'Power & Battery',
          variants: [
            { name: 'Device Type', options: ['iPhone (All Models)', 'MacBook Air / Pro', 'Samsung Galaxy', 'iPad Pro'], required: true }
          ]
        }
      },
      {
        page_id: repairsPage.id,
        title: 'Motherboard Logic Board Microsoldering & IC Repair',
        description: 'Component-level microscope soldering to replace damaged Power Management ICs (PMIC), Audio Codecs, NAND flash, or restore dead power rails.',
        price_minor: 3500000,
        price_display: 'From ₦35,000',
        sort_order: 3,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          turnaround: '48-72 Hours Lab Time',
          category: 'Motherboard & Micro-Soldering'
        }
      },
      {
        page_id: repairsPage.id,
        title: 'Rear Camera Module & Sapphire Lens Replacement',
        description: 'Optical image stabilization (OIS) recalibration, dust-free cleanroom module replacement, and sapphire glass back cover repair.',
        price_minor: 3200000,
        price_display: 'From ₦32,000',
        sort_order: 4,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          turnaround: '1-2 Hours',
          category: 'Camera & Optics'
        }
      },
      {
        page_id: repairsPage.id,
        title: 'Back Glass & Frame Laser Refurbishment',
        description: 'Precision automated laser beam ablation to strip shattered rear glass cleanly without dismantling sensitive internal coils or magnets.',
        price_minor: 2800000,
        price_display: 'From ₦28,000',
        sort_order: 5,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          turnaround: '2-3 Hours',
          category: 'Chassis & Housing'
        }
      },
      {
        page_id: repairsPage.id,
        title: 'Cleanroom Emergency Data Recovery',
        description: 'Advanced chip-off extraction and direct NAND flash reading from severely smashed, water-logged, or non-booting smart devices and laptops.',
        price_minor: 6500000,
        price_display: 'From ₦65,000',
        sort_order: 6,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1590487988256-9ed24133863e?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          turnaround: '3-5 Business Days',
          category: 'Data & Recovery'
        }
      },
      {
        page_id: repairsPage.id,
        title: 'USB-C Charging Port & Flex Cable Replacement',
        description: 'Replacement of loose or burnt charging port assemblies with fast-charge power delivery testing and microphone verification.',
        price_minor: 1800000,
        price_display: 'From ₦18,000',
        sort_order: 7,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          turnaround: '45-60 Minutes',
          category: 'Power & Battery'
        }
      }
    )
  }

  // ── H. MEDIA: Pacy Media & Creators (7 B2B Rate-Card Packages) ──────────────
  const mediaPage = createdPages.find((p: { slug: string }) => p.slug === 'pacy-media')
  if (mediaPage) {
    pageItems.push(
      {
        page_id: mediaPage.id,
        title: 'Dedicated 4K Cinematic Brand Film',
        description: '60-second narrative commercial video production with cinema-grade RED/ARRI cameras, master color grading, sound design, and full distribution rights.',
        price_minor: 15000000,
        sort_order: 0,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Commercial Video Production',
          variants: [
            { name: 'Platform Optimization', options: ['Instagram Reel & YouTube Shorts (9:16)', 'Full 4K Landscape Master (16:9)', 'Omnichannel Multi-Cut Bundle (+₦35,000)'], required: true }
          ]
        }
      },
      {
        page_id: mediaPage.id,
        title: 'Sponsored Podcast Feature & Founder Deep-Dive',
        description: '25-minute featured guest interview on The Pacy Growth Show with 4 viral short-form reel cutdowns, YouTube chapter marks, and newsletter spotlight.',
        price_minor: 12000000,
        sort_order: 1,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Sponsorship & Media Placements'
        }
      },
      {
        page_id: mediaPage.id,
        title: 'Viral Short-Form Video Campaign (3x Reels / TikToks)',
        description: 'Full end-to-end creative ideation, hooks, on-camera talent presentation, fast-paced kinetic editing, and paid Spark Ads commercial authorization.',
        price_minor: 8500000,
        sort_order: 2,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Commercial Video Production'
        }
      },
      {
        page_id: mediaPage.id,
        title: 'Commercial Photography & Editorial Lookbook',
        description: 'Full-day studio and on-location commercial shoot yielding 25 masterfully retouched high-res hero images with professional lighting and styling.',
        price_minor: 6500000,
        sort_order: 3,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Photography & Editorial'
        }
      },
      {
        page_id: mediaPage.id,
        title: 'Quarterly Executive Brand Ambassador Retainer',
        description: 'Keynote speaking appearance, 12 monthly dedicated social integrations, VIP event co-hosting, and exclusive category exclusivity across West Africa.',
        price_minor: 45000000,
        sort_order: 4,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Executive Retainers'
        }
      },
      {
        page_id: mediaPage.id,
        title: 'Newsletter & Digital Ecosystem Sponsor Banner (Monthly)',
        description: 'Top-tier dedicated sponsorship banner across our 40,000+ verified business founders & executive email newsletter list with direct link attribution.',
        price_minor: 3500000,
        sort_order: 5,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Sponsorship & Media Placements'
        }
      },
      {
        page_id: mediaPage.id,
        title: 'Live Event Multi-Cam 4K Broadcast & Drone Coverage',
        description: '3-camera live studio switching, crystal-clear line-level audio capture, 4K RTMP streaming, drone aerial cinematography, and same-day highlights.',
        price_minor: 18000000,
        sort_order: 6,
        availability_status: 'available',
        images: ['https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&w=800&q=80'],
        item_data: {
          category: 'Commercial Video Production'
        }
      }
    )
  }

  // 6. Insert all 75+ curated items in batches
  if (pageItems.length > 0) {
    await adminClient.from('page_items').insert(pageItems as never)
  }

  return loc.id
}
