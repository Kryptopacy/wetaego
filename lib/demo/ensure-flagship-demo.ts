import { createAdminClient } from '@/lib/supabase/server'

/**
 * Ensures a permanent, full-featured multi-concept Pacy Group demo storefront
 * exists under slug 'demo', with 100% parity with the interactive demo dataset.
 */
export async function ensureFlagshipDemoLocation() {
  const adminClient = await createAdminClient()

  // 1. Check if 'demo' location exists and has published pages
  const { data: existingLoc } = await adminClient
    .from('locations')
    .select('id, slug, organization_id')
    .eq('slug', 'demo')
    .maybeSingle()

  if (existingLoc) {
    const { data: pages } = await adminClient
      .from('location_pages')
      .select('id')
      .eq('location_id', existingLoc.id)
      .eq('is_published', true)

    if (pages && pages.length >= 3) {
      // Already fully seeded and healthy
      return existingLoc.id
    }
  }

  // 2. Fetch or create the permanent Demo Organization
  let orgId = existingLoc?.organization_id
  if (!orgId) {
    const { data: existingOrg } = await adminClient
      .from('organizations')
      .select('id')
      .eq('slug', 'pacy-group-flagship')
      .maybeSingle()

    if (existingOrg) {
      orgId = existingOrg.id
    } else {
      const { data: newOrg } = await adminClient
        .from('organizations')
        .insert({
          name: 'Pacy Group',
          slug: 'pacy-group-flagship',
          is_demo: false, // Permanent showcase, not cleaned up by 24h cron
        } as never)
        .select('id')
        .single()
      orgId = newOrg?.id
    }
  }

  if (!orgId) return null

  // 3. Upsert Location with slug 'demo'
  let locationId = existingLoc?.id
  if (!locationId) {
    const { data: newLoc } = await adminClient
      .from('locations')
      .insert({
        organization_id: orgId,
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
        ai_name: 'Pacy Assistant',
        ai_base_personality: 'professional',
        ai_escalation_contact: 'ask a staff member nearby or call 0800 000 0000',
        ai_instructions: 'Adapt your recommendations perfectly to the current context. If the user is viewing food, suggest pairings. If they are viewing spa or hotel services, be a helpful concierge. If the user needs staff, use your tool to call them.',
        ai_faqs: [
          { question: 'What are your operating hours?', answer: 'We are generally open from 11:00 AM to 11:00 PM, but please check specific service availability.' },
          { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, Apple Pay, and direct bank transfers.' }
        ],
        brand_knowledge: 'Pacy Group is a multi-concept hospitality brand in Lagos — spanning a restaurant (Pacy Grills), a wellness spa, short-stay apartments, a fashion boutique, a gadget store, a media/creator studio, a hotel, and a gadget repair service. The restaurant is known for its legendary 24-hour marinated Suya steak and craft cocktails.',
        publication_status: 'published',
        manual_payment_enabled: true,
        manual_payment_bank_name: 'WETAEGO Demo Bank',
        manual_payment_account_name: 'Pacy Grills Flagship Demo',
        manual_payment_account_number: '0000000000',
        manual_payment_instructions: 'This is a live multi-concept demo. No real payment is charged. Click "I Have Transferred" to test the live ordering stream!'
      })
      .select('id')
      .single()

    locationId = newLoc?.id
  } else {
    await adminClient
      .from('locations')
      .update({
        publication_status: 'published',
        portal_display_name: 'Pacy Group',
        name: 'Pacy Grills & Lounge',
        manual_payment_enabled: true
      })
      .eq('id', locationId)
  }

  if (!locationId) return null

  // 4. Seed Multi-Concept Pages
  const pagesData = [
    {
      location_id: locationId,
      slug: 'restaurant',
      title: 'Pacy Grills & Lounge',
      template_type: 'catalog',
      is_published: true,
      billing_enabled: true,
      randomizer_enabled: true,
    },
    {
      location_id: locationId,
      slug: 'wellness',
      title: 'Pacy Sanctuary Spa & Wellness',
      template_type: 'booking',
      is_published: true,
      billing_enabled: true,
      randomizer_enabled: false,
    },
    {
      location_id: locationId,
      slug: 'gadgets',
      title: 'Pacy Tech & Gadgets Boutique',
      template_type: 'catalog',
      is_published: true,
      billing_enabled: true,
      randomizer_enabled: false,
    },
    {
      location_id: locationId,
      slug: 'creator',
      title: 'Pacy Studios & Creator Rate Card',
      template_type: 'rate_card',
      is_published: true,
      billing_enabled: true,
      randomizer_enabled: false,
    },
    {
      location_id: locationId,
      slug: 'stay',
      title: 'Pacy Executive Suites & Stays',
      template_type: 'booking',
      is_published: true,
      billing_enabled: true,
      randomizer_enabled: false,
    },
    {
      location_id: locationId,
      slug: 'repairs',
      title: 'Pacy Diagnostic & Device Lab',
      template_type: 'quote',
      is_published: true,
      billing_enabled: true,
      randomizer_enabled: false,
    }
  ]

  for (const p of pagesData) {
    const { data: pageRecord } = await adminClient
      .from('location_pages')
      .upsert(p as never, { onConflict: 'location_id,slug' })
      .select('id, slug')
      .single()

    if (!pageRecord) continue

    // Seed Items for each page
    if (pageRecord.slug === 'restaurant') {
      const items = [
        {
          page_id: pageRecord.id,
          title: 'Prime 24-Hour Marinated Suya Ribeye Steak',
          description: '350g USDA Prime ribeye dry-rubbed in artisanal Yaji spice, smoked over cherrywood embers, served with charred sweet potato purée.',
          price_minor: 3200000,
          sort_order: 1,
          availability_status: 'available',
          images: ['https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'],
          item_data: {
            category: 'Chef Specials & Mains',
            dietary_tags: ['gluten_free', 'halal'],
            variants: [
              { name: 'Meat Temperature', options: ['Medium Rare (Warm Red Center)', 'Medium (Warm Pink Center)', 'Medium Well'], required: true },
              { name: 'Complimentary Side', options: ['Truffle Yam Fries', 'Jollof Infused Quinoa', 'Charred Garden Greens'], required: true }
            ]
          }
        },
        {
          page_id: pageRecord.id,
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
          page_id: pageRecord.id,
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
          page_id: pageRecord.id,
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
          page_id: pageRecord.id,
          title: 'Smoked Hibiscus Mezcalita',
          description: 'Smoked mezcal shaken with artisanal Zobo reduction, fresh lime juice, agave nectar, and black volcanic salt rim.',
          price_minor: 950000,
          sort_order: 5,
          availability_status: 'available',
          images: ['https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80'],
          item_data: {
            category: 'Craft Cocktails & Beverages',
            variants: [
              { name: 'Base Spirit', options: ['Artisanal Mezcal (Smoky Finish)', 'Reposado Tequila', 'Zero-Proof Botanical (Non-Alcoholic)'], required: true }
            ]
          }
        }
      ]

      await adminClient.from('page_items').insert(items as never)
    }

    if (pageRecord.slug === 'wellness') {
      const items = [
        {
          page_id: pageRecord.id,
          title: 'Signature Deep Tissue Swedish Massage',
          description: 'Full-body restorative massage focusing on deep muscle layers, chronic tension release, and circulation improvement.',
          price_minor: 3500000,
          sort_order: 1,
          availability_status: 'available',
          images: ['https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80'],
          item_data: {
            category: 'Massage Therapies',
            variants: [
              { name: 'Duration', options: ['60 Minutes', '90 Minutes Deluxe'], required: true },
              { name: 'Oil Blend', options: ['Sweet Almond & Rose', 'Calming Chamomile'], required: true }
            ]
          }
        },
        {
          page_id: pageRecord.id,
          title: 'Hot Himalayan Stone Body Therapy',
          description: 'Heated volcanic basalt and pink Himalayan salt stones placed along energy meridians to relieve deep tension.',
          price_minor: 4200000,
          sort_order: 2,
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
          page_id: pageRecord.id,
          title: 'Radiance Glow Vitamin C Facial',
          description: '45-minute revitalizing facial treatment using high-potency antioxidants and lymphatic contour massage.',
          price_minor: 2500000,
          sort_order: 3,
          availability_status: 'available',
          images: ['https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80'],
          item_data: {
            category: 'Facial Aesthetics',
            variants: [
              { name: 'Skin Booster Treatment', options: ['Pure Vitamin C Glow', 'Hyaluronic Acid Hydration Boost', 'Collagen LED Therapy'], required: true }
            ]
          }
        }
      ]

      await adminClient.from('page_items').insert(items as never)
    }

    if (pageRecord.slug === 'gadgets') {
      const items = [
        {
          page_id: pageRecord.id,
          title: 'Apple iPhone 16 Pro Max (512GB)',
          description: 'Titanium design with thinner borders, Camera Control, 4K 120 fps Dolby Vision, and the A18 Pro chip.',
          price_minor: 245000000,
          sort_order: 1,
          availability_status: 'available',
          images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80'],
          item_data: {
            category: 'Smartphones & Tablets',
            variants: [
              { name: 'Color', options: ['Desert Titanium', 'Natural Titanium', 'White Titanium', 'Black Titanium'], required: true }
            ]
          }
        },
        {
          page_id: pageRecord.id,
          title: 'MacBook Air 15-inch (M3 Chip)',
          description: 'Liquid Retina display with 500 nits brightness, MagSafe charging, and 18-hour all-day battery life.',
          price_minor: 165000000,
          sort_order: 2,
          availability_status: 'available',
          images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80'],
          item_data: {
            category: 'Laptops & Computers',
            variants: [
              { name: 'Memory', options: ['16GB Unified Memory', '24GB Unified Memory'], required: true },
              { name: 'Finish', options: ['Midnight', 'Starlight', 'Space Gray', 'Silver'], required: true }
            ]
          }
        },
        {
          page_id: pageRecord.id,
          title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
          description: 'Industry-leading noise cancellation with two processors controlling 8 microphones and 30-hour battery.',
          price_minor: 48000000,
          sort_order: 3,
          availability_status: 'available',
          images: ['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80'],
          item_data: {
            category: 'Audio & Wearables',
            variants: [
              { name: 'Color', options: ['Silver White', 'Black Matte', 'Midnight Blue'], required: true }
            ]
          }
        }
      ]

      await adminClient.from('page_items').insert(items as never)
    }

    if (pageRecord.slug === 'creator') {
      const items = [
        {
          page_id: pageRecord.id,
          title: '4K Cinematic Brand Commercial (60s)',
          description: 'Full-service commercial production including concept storyboard, 4K cinema cameras, color grading, sound design, and broadcast licensing.',
          price_minor: 45000000,
          sort_order: 1,
          availability_status: 'available',
          images: ['https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80'],
          item_data: {
            category: 'Video Production Packages',
            variants: [
              { name: 'Turnaround Time', options: ['Standard (10 Business Days)', 'Expedited Rush (3 Business Days)'], required: true }
            ]
          }
        },
        {
          page_id: pageRecord.id,
          title: 'Sponsored Podcast Feature & Video Interview',
          description: 'Dedicated 20-minute interview segment on The Pacy Growth Show with social reel cutdowns and newsletter inclusion.',
          price_minor: 15000000,
          sort_order: 2,
          availability_status: 'available',
          images: ['https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80'],
          item_data: {
            category: 'Sponsorship & Media',
            variants: [
              { name: 'Episode Format', options: ['Studio In-Person', 'Remote 4K Stream'], required: true }
            ]
          }
        }
      ]

      await adminClient.from('page_items').insert(items as never)
    }
  }

  return locationId
}
