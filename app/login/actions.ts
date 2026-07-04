'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/notifications/email'
import { z } from 'zod'
import { actionClient } from '@/lib/safe-action'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(2, "1 h"),
  analytics: true,
})


const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  redirectTo: z.string().optional()
})

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  redirectTo: z.string().optional()
})

/** Sanitize redirect target to prevent open redirect attacks */
function sanitizeRedirect(target: string | null): string {
  if (!target || target === '/' || !target.startsWith('/') || target.startsWith('//')) {
    return '/dashboard'
  }
  return target
}

export const login = actionClient
  .schema(loginSchema)
  .action(async ({ parsedInput: { email, password, redirectTo: rawRedirect } }) => {
    const supabase = await createClient()
    const redirectTo = sanitizeRedirect(rawRedirect || null)

    // If a demo user is currently logged in, clear their session before proceeding
    const { data: { user } } = await supabase.auth.getUser()
    if (user && user.email?.startsWith('demo-')) {
      await supabase.auth.signOut()
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return { redirect: `/login?message=${encodeURIComponent('Could not authenticate user')}&redirectTo=${encodeURIComponent(redirectTo)}` }
    }

    revalidatePath('/', 'layout')
    return { redirect: redirectTo }
  })

export const signup = actionClient
  .schema(signupSchema)
  .action(async ({ parsedInput: { email, password, redirectTo: rawRedirect } }) => {
    const supabase = await createClient()
    const redirectTo = sanitizeRedirect(rawRedirect || null)

    // If a demo user is currently logged in, clear their session before proceeding
    const { data: { user } } = await supabase.auth.getUser()
    if (user && user.email?.startsWith('demo-')) {
      await supabase.auth.signOut()
    }

    const { error, data: _data } = await supabase.auth.signUp({ email, password })

    if (error) {
      return { redirect: `/login?message=${encodeURIComponent('Could not sign up user')}&redirectTo=${encodeURIComponent(redirectTo)}` }
    }

    // Trigger welcome email in the background
    sendWelcomeEmail(email).catch(console.error)

    revalidatePath('/', 'layout')
    return { redirect: redirectTo }
  })

export async function signInWithGoogle() {
  const supabase = await createClient()
  
  // If a demo user is currently logged in, clear their session before proceeding
  const { data: { user } } = await supabase.auth.getUser()
  if (user && user.email?.startsWith('demo-')) {
    await supabase.auth.signOut()
  }

  const { headers } = await import('next/headers')
  
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const origin = `${protocol}://${host}`
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    redirect(`/login?message=Could not authenticate via Google`)
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function startInteractiveDemo() {
  const { headers } = await import('next/headers')
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'

  if (ip !== 'unknown') {
    const { success } = await ratelimit.limit(`demo_creation_${ip}`)
    if (!success) {
      redirect(`/login?message=${encodeURIComponent('Too many demo workspaces created. Try again later.')}`)
      return
    }
  }

  const supabase = await createClient()
  
  const uid = crypto.randomUUID().split('-')[0]
  const email = `demo-${uid}@ourmenuos.online`
  const password = 'demo-password-123'

  // 1. Create a real ephemeral user (bypassing email confirmation using admin client)
  const adminClient = await createAdminClient()
  const { data: authData, error: signUpError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true // Force confirmation so they can log in immediately
  })

  if (signUpError || !authData.user) {
    console.error(signUpError)
    redirect(`/login?message=Could not initialize demo workspace`)
  }

  // 1.5 Log them in (creates the session cookie)
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (signInError) {
    console.error(signInError)
    redirect(`/login?message=Could not sign into demo workspace`)
  }

  if (!authData.user) {
    redirect(`/login?message=Could not sign into demo workspace`)
    return
  }

  const userId = authData.user.id

  // 2. Provision the 'Pacy Grills' Org
  const { data: org, error: orgError } = await adminClient.from('organizations').insert({
    name: 'Pacy Grills',
    slug: `pacy-grills-${uid}`,
    created_by: userId,
    is_demo: true,
  } as never).select('id').single()

  if (orgError || !org) {
    console.error(orgError)
    redirect(`/login?message=Could not create demo organization`)
    return
  }

  // 3. Make them Owner
  await adminClient.from('organization_members').insert({
    organization_id: org.id,
    user_id: userId,
    role: 'owner'
  })

  // 4. Create Location
  const { data: loc } = await adminClient.from('locations').insert({
    organization_id: org.id,
    name: 'Pacy Grills & Lounge',
    portal_display_name: 'Pacy Group',
    slug: `pacy-grills-${uid}`,
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
      { question: 'What are your operating hours?', answer: 'We are generally open from 11:00 AM to 11:00 PM, but please check the specific service availability.' },
      { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards and bank transfers.' }
    ],
    brand_knowledge: 'Pacy Grills is known for its legendary 24-hour marinated Suya steak and craft cocktails.',
    publication_status: 'published',
    manual_payment_enabled: true,
    manual_payment_bank_name: 'OurMenu Demo Bank',
    manual_payment_account_name: 'Pacy Grills Demo',
    manual_payment_account_number: '0000000000',
    manual_payment_instructions: 'This is a demo. No real payment is required. Just click "I Have Transferred" to test the ordering flow!'
  }).select('id, slug').single()

  if (!loc) return { error: 'Location not found' }


  // 8. Add strict demo credits (financial defense)
  await adminClient.from('credit_transactions').insert({
    organization_id: org.id,
    amount: 5,
    reason: 'Demo Signup Bonus',
    created_by: userId
  })

  // Update the organization's actual credit balance
  await adminClient.from('organizations').update({ purchased_credits: 5 }).eq('id', org.id)

  // 9. Add Demo Custom Pages for them to preview the multi-template architecture
  const { data: pages, error: pagesError } = await adminClient.from('location_pages').insert([
    {
      location_id: loc.id,
      slug: 'restaurant',
      title: 'Pacy Grills & Lounge',
      template_type: 'catalog',
      is_published: true,
      billing_enabled: true
    },
    {
      location_id: loc.id,
      slug: 'pacy-media',
      title: 'Pacy Media & Creators',
      template_type: 'rate_card',
      business_type_preset: 'influencer',
      is_published: true,
      randomizer_enabled: false,
      billing_enabled: true
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
      billing_enabled: false
    }
  ]).select('id, slug')

  if (pagesError || !pages) {
    console.error('Failed to insert demo pages', pagesError)
  } else {
    // Insert page items for the demo templates
    const pageItems = []

    const restaurantPage = pages.find((p: { id: string, slug: string }) => p.slug === 'restaurant')
    if (restaurantPage) {
      pageItems.push(
        { page_id: restaurantPage.id, title: 'Spicy Asun Rolls', description: 'Smoked goat meat wrapped in crispy pastry, served with pepper sauce.', price_minor: 650000, sort_order: 0, availability_status: 'available', images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'], item_data: { category: 'Starters & Bites' } },
        { page_id: restaurantPage.id, title: 'Truffle Plantain Fries', description: 'Crispy plantain tossed in truffle oil and parmesan.', price_minor: 450000, sort_order: 1, availability_status: 'available', images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80'], item_data: { category: 'Starters & Bites' } },
        { page_id: restaurantPage.id, title: '24-Hour Suya Steak', description: 'Prime ribeye marinated in our signature suya spice blend, grilled to perfection.', price_minor: 2800000, sort_order: 2, availability_status: 'available', images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80'], item_data: { category: 'Premium Mains' } },
        { page_id: restaurantPage.id, title: 'Jollof Paella', description: 'Rich, smoky jollof rice mixed with grilled prawns, calamari, and spicy chorizo.', price_minor: 1850000, sort_order: 3, availability_status: 'available', images: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'], item_data: { category: 'Premium Mains' } },
        { page_id: restaurantPage.id, title: 'Charcoal Grilled Croaker', description: 'Whole croaker fish stuffed with herbs, served with roasted yam.', price_minor: 1500000, sort_order: 4, availability_status: 'sold_out', images: ['https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80'], item_data: { category: 'Premium Mains' } },
        { page_id: restaurantPage.id, title: 'Zobo Margarita', description: 'Tequila, fresh zobo extract, lime, and a spicy salt rim.', price_minor: 550000, sort_order: 5, availability_status: 'available', images: ['https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80'], item_data: { category: 'Signature Cocktails' } },
        { page_id: restaurantPage.id, title: 'Palm Wine Spritz', description: 'Fresh palm wine, prosecco, and a splash of elderflower.', price_minor: 600000, sort_order: 6, availability_status: 'available', images: ['https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=800&q=80'], item_data: { category: 'Signature Cocktails' } },
        { page_id: restaurantPage.id, title: 'Puff-Puff Beignets', description: 'Warm puff-puff served with rich dark chocolate dipping sauce.', price_minor: 400000, sort_order: 7, availability_status: 'available', images: ['https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80'], item_data: { category: 'Desserts' } },
        { page_id: restaurantPage.id, title: 'Mango Sorbet', description: 'Fresh, icy mango sorbet made in-house.', price_minor: 350000, sort_order: 8, availability_status: 'available', images: ['https://images.unsplash.com/photo-1563805042-7684c8a9e9cb?auto=format&fit=crop&w=800&q=80'], item_data: { category: 'Desserts' } }
      )
    }

    const mediaPage = pages.find((p: { id: string, slug: string }) => p.slug === 'pacy-media')
    if (mediaPage) {
      pageItems.push(
        { page_id: mediaPage.id, title: 'Dedicated Instagram Reel', description: 'Up to 60 seconds. High-quality editing included.', price_minor: 15000000, sort_order: 0, availability_status: 'available', images: ['https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&w=800&q=80'] },
        { page_id: mediaPage.id, title: 'TikTok Integration', description: 'Brand integration in a lifestyle TikTok video.', price_minor: 10000000, sort_order: 1, availability_status: 'available', images: ['https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80'] }
      )
    }

    const wellnessPage = pages.find((p: { id: string, slug: string }) => p.slug === 'pacy-wellness')
    if (wellnessPage) {
      pageItems.push(
        { page_id: wellnessPage.id, title: 'Deep Tissue Massage', description: '60-minute intensive muscle therapy.', price_minor: 3500000, sort_order: 0, availability_status: 'available', images: ['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80'] },
        { page_id: wellnessPage.id, title: 'Signature Facial', description: '45-minute glow restoration facial.', price_minor: 2500000, sort_order: 1, availability_status: 'available', images: ['https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80'] }
      )
    }

    const staysPage = pages.find((p: { id: string, slug: string }) => p.slug === 'pacy-stays')
    if (staysPage) {
      pageItems.push(
        { page_id: staysPage.id, title: 'Lekki Penthouse', subtitle: '3 Bed / 3.5 Bath', description: 'Stunning ocean views with private chef access.', price_minor: 15000000, price_display: '150,000 / night', sort_order: 0, availability_status: 'available', item_data: { beds: 3, baths: 3.5, sqft: 2500 }, images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'] },
        { page_id: staysPage.id, title: 'Ikoyi Studio', subtitle: '1 Bed / 1 Bath', description: 'Cozy luxury studio in the heart of Ikoyi.', price_minor: 6500000, price_display: '65,000 / night', sort_order: 1, availability_status: 'available', item_data: { beds: 1, baths: 1, sqft: 600 }, images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'] }
      )
    }

    const boutiquePage = pages.find((p: { id: string, slug: string }) => p.slug === 'pacy-boutique')
    if (boutiquePage) {
      pageItems.push(
        { page_id: boutiquePage.id, title: 'Silk Wrap Dress', description: 'Emerald green 100% silk dress.', price_minor: 4500000, sort_order: 0, availability_status: 'available', images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80'], item_data: { variants: [{ name: 'Size', options: ['S', 'M', 'L', 'XL'], required: true }, { name: 'Color', options: ['Emerald Green', 'Navy Blue'], required: true }] } },
        { page_id: boutiquePage.id, title: 'Leather Tote Bag', description: 'Handcrafted genuine leather tote.', price_minor: 8500000, sort_order: 1, availability_status: 'available', images: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80'] },
        { page_id: boutiquePage.id, title: 'Gold Hoop Earrings', description: '18k gold plated hoops.', price_minor: 1200000, sort_order: 2, availability_status: 'available', images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80'] },
        { page_id: boutiquePage.id, title: 'Summer Maxi Dress', description: 'Floral pattern maxi dress perfect for the beach.', price_minor: 3500000, sort_order: 3, availability_status: 'available', images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80'], item_data: { variants: [{ name: 'Size', options: ['S', 'M', 'L'], required: true }] } },
        { page_id: boutiquePage.id, title: 'Classic Denim Jacket', description: 'Vintage wash denim jacket.', price_minor: 5500000, sort_order: 4, availability_status: 'available', images: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80'], item_data: { variants: [{ name: 'Size', options: ['S', 'M', 'L', 'XL'], required: true }] } },
        { page_id: boutiquePage.id, title: 'Suede Ankle Boots', description: 'Tan suede boots with a small heel.', price_minor: 9500000, sort_order: 5, availability_status: 'available', images: ['https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80'], item_data: { variants: [{ name: 'Shoe Size (EU)', options: ['38', '39', '40', '41', '42'], required: true }] } }
      )
    }

    const gadgetsPage = pages.find((p: { id: string, slug: string }) => p.slug === 'pacy-gadgets')
    if (gadgetsPage) {
      pageItems.push(
        { page_id: gadgetsPage.id, title: 'iPhone 15 Pro Max', description: 'Titanium design with A17 Pro chip and 5x optical zoom camera system.', price_minor: 185000000, sort_order: 0, availability_status: 'available', images: ['https://images.unsplash.com/photo-1695048065096-749e7b28292c?auto=format&fit=crop&w=800&q=80'], item_data: { variants: [{ name: 'Storage', options: ['256GB', '512GB', '1TB'], required: true }, { name: 'Color', options: ['Natural Titanium', 'Blue Titanium', 'Black Titanium'], required: true }] } },
        { page_id: gadgetsPage.id, title: 'Samsung Galaxy S24 Ultra', description: 'Galaxy AI is here. Titanium exterior and a 6.8" flat display.', price_minor: 175000000, sort_order: 1, availability_status: 'available', images: ['https://images.unsplash.com/photo-1706691147573-009139fb2b75?auto=format&fit=crop&w=800&q=80'], item_data: { variants: [{ name: 'Storage', options: ['256GB', '512GB', '1TB'], required: true }, { name: 'Color', options: ['Titanium Gray', 'Titanium Black'], required: true }] } },
        { page_id: gadgetsPage.id, title: 'PlayStation 5 Slim (Disc Edition)', description: 'Next-gen gaming console with ultra-high speed SSD and haptic feedback.', price_minor: 85000000, sort_order: 2, availability_status: 'available', images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80'] },
        { page_id: gadgetsPage.id, title: 'Apple AirPods Pro (2nd Gen)', description: 'Up to 2x more Active Noise Cancellation with USB-C case.', price_minor: 32000000, sort_order: 3, availability_status: 'available', images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80'], item_data: { variants: [{ name: 'Case Type', options: ['USB-C', 'Lightning'], required: true }] } },
        { page_id: gadgetsPage.id, title: 'MacBook Air M3 (13-inch)', description: 'Supercharged by M3, lightweight design, and up to 18 hours of battery life.', price_minor: 165000000, sort_order: 4, availability_status: 'available', images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80'], item_data: { variants: [{ name: 'Unified Memory', options: ['8GB', '16GB', '24GB'], required: true }, { name: 'Color', options: ['Midnight', 'Starlight', 'Space Gray'], required: true }] } },
        { page_id: gadgetsPage.id, title: 'Sony WH-1000XM5 Wireless Headphones', description: 'Industry leading noise cancellation with two processors controlling 8 microphones.', price_minor: 48000000, sort_order: 5, availability_status: 'available', images: ['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80'], item_data: { variants: [{ name: 'Color', options: ['Black', 'Silver', 'Midnight Blue'], required: true }] } }
      )
    }

    const hotelsPage = pages.find((p: { id: string, slug: string }) => p.slug === 'pacy-hotels')
    if (hotelsPage) {
      pageItems.push(
        { page_id: hotelsPage.id, title: 'Ocean View Suite', subtitle: 'King Bed / Balcony', description: 'Luxury suite with panoramic ocean views and complementary breakfast.', price_minor: 12000000, price_display: '120,000 / night', sort_order: 0, availability_status: 'available', item_data: { beds: 1, occupancy: 2 }, images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'] },
        { page_id: hotelsPage.id, title: 'Standard Double', subtitle: 'Queen Bed', description: 'Comfortable room perfect for business travelers.', price_minor: 4500000, price_display: '45,000 / night', sort_order: 1, availability_status: 'available', item_data: { beds: 1, occupancy: 2 }, images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80'] }
      )
    }

    if (pageItems.length > 0) {
      const { error: piError } = await adminClient.from('page_items').insert(pageItems)
      if (piError) console.error('Failed to insert page items', piError)
    }

    // Insert legacy menu categories and items for the restaurant to fix the onboarding tracker
    const { data: category } = await adminClient.from('menu_categories').insert({
      organization_id: org.id,
      name: 'Starters & Bites',
      sort_order: 0
    }).select('id').single()

    if (category) {
      await adminClient.from('menu_items').insert([
        {
          organization_id: org.id,
          category_id: category.id,
          name: 'Spicy Asun Rolls',
          description: 'Smoked goat meat wrapped in crispy pastry, served with pepper sauce.',
          price_minor: 650000,
          image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
          sort_order: 0
        },
        {
          organization_id: org.id,
          category_id: category.id,
          name: 'Truffle Plantain Fries',
          description: 'Crispy plantain tossed in truffle oil and parmesan.',
          price_minor: 450000,
          image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
          sort_order: 1
        }
      ])
    }
  }

  // Clean up old demo organizations (asynchronous, fire-and-forget, zero latency cost)
  // Uses the is_demo flag to safely target only demo orgs (never real businesses)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  adminClient.from('organizations')
    .delete()
    .eq('is_demo' as never, true)
    .lt('created_at', twentyFourHoursAgo)
    .then(({ error }) => { if (error) console.error('Cleanup error:', error) })

  // We are fully logged in and provisioned!
  const cookieStore = await import('next/headers').then(m => m.cookies())
  ;(await cookieStore).set('demo_mode', '1', { path: '/', maxAge: 60 * 60 * 2 }) // Expires in 2 hours

  revalidatePath('/', 'layout')
  revalidateTag(`location_${loc.slug}`, 'default')
  revalidateTag(`location_pages_${loc.id}`, 'default')
  redirect('/dashboard')
}
