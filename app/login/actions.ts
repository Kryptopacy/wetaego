'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/notifications/email'
import { z } from 'zod'
import { actionClient } from '@/lib/safe-action'
import { checkRateLimit } from '@/lib/upstash'

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
    const redirectTo = sanitizeRedirect(rawRedirect || null)

    const rl = await checkRateLimit('auth_login')
    if (!rl.success) {
      return { 
        error: 'Too many login attempts. Please wait a few minutes before trying again.' 
      }
    }

    const supabase = await createClient()

    // If a demo user is currently logged in, clear their session before proceeding
    const { data: { user } } = await supabase.auth.getUser()
    if (user && user.email?.startsWith('demo-')) {
      await supabase.auth.signOut()
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return { 
        error: error.message || 'Invalid email or password. Please try again.' 
      }
    }

    revalidatePath('/', 'layout')
    return { redirect: redirectTo }
  })

export const signup = actionClient
  .schema(signupSchema)
  .action(async ({ parsedInput: { email, password, redirectTo: rawRedirect } }) => {
    const redirectTo = sanitizeRedirect(rawRedirect || null)

    const rl = await checkRateLimit('auth_signup')
    if (!rl.success) {
      return { 
        error: 'Too many signup attempts. Please wait a few minutes before trying again.' 
      }
    }

    const supabase = await createClient()

    // If a demo user is currently logged in, clear their session before proceeding
    const { data: { user } } = await supabase.auth.getUser()
    if (user && user.email?.startsWith('demo-')) {
      await supabase.auth.signOut()
    }

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      return { 
        error: error.message || 'Could not create account. Please try again.' 
      }
    }

    // Trigger welcome email in the background
    sendWelcomeEmail(email).catch(console.error)

    if (data.session) {
      revalidatePath('/', 'layout')
      return { redirect: redirectTo }
    }

    return { 
      success: true, 
      message: 'Account created! If email confirmation is required, please check your inbox.' 
    }
  })

const resetPasswordRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

const updatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const requestPasswordReset = actionClient
  .schema(resetPasswordRequestSchema)
  .action(async ({ parsedInput: { email } }) => {
    const rl = await checkRateLimit('auth_reset_password')
    if (!rl.success) {
      return {
        error: 'Too many password reset requests. Please wait a few minutes before trying again.'
      }
    }

    const { headers } = await import('next/headers')
    const headersList = await headers()
    const forwardedHost = headersList.get('x-forwarded-host')
    const host = forwardedHost || headersList.get('host') || 'ourmenuos.online'
    const proto = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
    
    const origin = (process.env.NEXT_PUBLIC_SITE_URL && !host.includes('localhost'))
      ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
      : `${proto}://${host}`

    const redirectToUrl = `${origin}/auth/callback?next=/reset-password`

    // 1. Generate recovery link using admin client to send our custom branded email
    try {
      const adminClient = await createAdminClient()
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: redirectToUrl,
        }
      })

      if (!linkError && linkData?.properties?.action_link) {
        const { sendPasswordResetEmail } = await import('@/lib/notifications/email')
        await sendPasswordResetEmail(email, linkData.properties.action_link)
        return {
          success: true,
          message: 'Password reset link sent! Please check your email inbox (and spam folder).'
        }
      }
    } catch (adminErr) {
      console.warn('Admin link generation failed, falling back to standard reset:', adminErr)
    }

    // 2. Fallback to standard Supabase auth reset if generateLink is unavailable
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectToUrl,
    })

    if (error) {
      return {
        error: error.message || 'Could not send reset password email. Please try again.'
      }
    }

    return {
      success: true,
      message: 'Password reset link sent! Please check your email inbox (and spam folder).'
    }
  })

export const updatePassword = actionClient
  .schema(updatePasswordSchema)
  .action(async ({ parsedInput: { password } }) => {
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      return {
        error: error.message || 'Could not update password. Please try requesting a new reset link.'
      }
    }

    revalidatePath('/', 'layout')
    return {
      success: true,
      redirect: '/dashboard'
    }
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
  const forwardedHost = headersList.get('x-forwarded-host')
  const host = forwardedHost || headersList.get('host') || 'ourmenuos.online'
  const proto = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  
  const origin = (process.env.NEXT_PUBLIC_SITE_URL && !host.includes('localhost'))
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
    : `${proto}://${host}`
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function startInteractiveDemo() {
  try {
    const rl = await checkRateLimit('demo_creation')
    if (!rl.success) {
      redirect(`/login?message=${encodeURIComponent('Too many demo workspaces created. Try again later.')}`)
      return
    }
  } catch {
    // Fail open if rate limit check fails
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
    name: 'Pacy Group',
    slug: `pacy-group-${uid}`,
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
    slug: `pacy-group-${uid}`,
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
    brand_knowledge: 'Pacy Group is a multi-concept hospitality brand in Lagos — spanning a restaurant (Pacy Grills), a wellness spa, short-stay apartments, a fashion boutique, a gadget store, a media/creator studio, a hotel, and a gadget repair service. The restaurant is known for its legendary 24-hour marinated Suya steak and craft cocktails.',
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
      billing_enabled: true,
      randomizer_enabled: true
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
      slug: 'pacy-repairs',
      title: 'Pacy Gadget Repairs',
      template_type: 'quote',
      business_type_preset: 'repair_services',
      billing_enabled: false,
      billing_mode: 'standard_checkout',
      payment_mode: 'deposit',
      deposit_percentage: 50,
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
        { 
          page_id: restaurantPage.id, 
          title: '24-Hour Suya Ribeye Steak', 
          description: 'Prime 350g Angus ribeye marinated in artisanal suya spices, flame-grilled over scented charcoal.', 
          price_minor: 2800000, 
          sort_order: 0, 
          availability_status: 'available', 
          images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80'], 
          item_data: { 
            category: 'Chef Specials & Mains',
            dietary_tags: ['halal', 'gluten_free'],
            variants: [
              { name: 'Doneness', options: ['Medium Rare (Recommended)', 'Medium', 'Medium Well', 'Well Done'], required: true },
              { name: 'Spice Level', options: ['Mild Yaji Dust', 'Classic Lagos Heat (Chef Favorite)', 'Extra Hot Pepper Fire'], required: true },
              { name: 'Complimentary Side', options: ['Truffle Plantain Fries', 'Smoky Jollof Rice', 'Grilled Sweet Potato Mash', 'Charred Asparagus'], required: true }
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
          title: 'Charred Tiger Prawn Skewers', 
          description: 'Grilled jumbo prawns brushed with garlic-herb and chili butter, served with lime wedges.', 
          price_minor: 1200000, 
          sort_order: 6, 
          availability_status: 'available', 
          images: ['https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80'], 
          item_data: { 
            category: 'Starters & Bites',
            dietary_tags: ['pescatarian', 'gluten_free', 'halal'],
            variants: [
              { name: 'Butter Glaze', options: ['Lemon Garlic Herb', 'Spicy Scotch Bonnet Butter'] }
            ]
          } 
        },
        { 
          page_id: restaurantPage.id, 
          title: 'Smoked Hibiscus Zobo Margarita', 
          description: 'Reposado tequila, cold-pressed organic hibiscus extract, fresh lime juice, agave, and a spicy yaji salt rim.', 
          price_minor: 650000, 
          sort_order: 7, 
          availability_status: 'available', 
          images: ['https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80'], 
          item_data: { 
            category: 'Craft Cocktails & Drinks',
            dietary_tags: ['vegan', 'gluten_free', 'dairy_free'],
            variants: [
              { name: 'Base Spirit', options: ['Reposado Tequila', 'Artisanal Mezcal (Smoky Finish)', 'Seedlip Spice (Zero-Proof / Non-Alcoholic)'], required: true },
              { name: 'Glass Rim Style', options: ['Spicy Yaji Pepper Salt', 'Sweet Hibiscus Sugar', 'Half-and-Half Rim'], required: true }
            ]
          } 
        },
        { 
          page_id: restaurantPage.id, 
          title: 'Artisanal Palm Wine Spritz', 
          description: 'Fresh palm wine infused with sparkling Italian prosecco, elderflower liqueur, and fresh mint.', 
          price_minor: 700000, 
          sort_order: 8, 
          availability_status: 'available', 
          images: ['https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=800&q=80'], 
          item_data: { 
            category: 'Craft Cocktails & Drinks',
            dietary_tags: ['vegan', 'gluten_free'],
            variants: [
              { name: 'Garnish', options: ['Fresh Mint & Dehydrated Lime', 'Edible Orchid Flower'] }
            ]
          } 
        },
        { 
          page_id: restaurantPage.id, 
          title: 'Organic Mango Coconut Sorbet', 
          description: 'Pure Alphonso mango churned with coconut cream, topped with fresh passionfruit coulis and mint leaves.', 
          price_minor: 450000, 
          sort_order: 9, 
          availability_status: 'available', 
          images: ['https://images.unsplash.com/photo-1563805042-7684c8a9e9cb?auto=format&fit=crop&w=800&q=80'], 
          item_data: { 
            category: 'Desserts',
            dietary_tags: ['vegan', 'gluten_free', 'dairy_free', 'halal'],
            variants: [
              { name: 'Topping', options: ['Toasted Coconut Flakes', 'Fresh Mint & Chili Glaze', 'Crushed Pistachios'] }
            ]
          } 
        },
        { 
          page_id: restaurantPage.id, 
          title: 'Warm Puff-Puff Beignets', 
          description: 'Spiced golden Nigerian puff-puff dusted in cinnamon sugar with warm Belgian dark chocolate dip.', 
          price_minor: 500000, 
          sort_order: 10, 
          availability_status: 'available', 
          images: ['https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80'], 
          item_data: { 
            category: 'Desserts',
            dietary_tags: ['vegetarian', 'halal'],
            variants: [
              { name: 'Dipping Sauce', options: ['Belgian Dark Chocolate', 'Salted Spiced Caramel', 'Condensed Milk Glaze'], required: true }
            ]
          } 
        }
      )
    }

    const wellnessPage = pages.find((p: { id: string, slug: string }) => p.slug === 'pacy-wellness')
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
              { name: 'Essential Oil Blend', options: ['Eucalyptus & Peppermint (Muscle Relief)', 'Lavender & Bergamot (Deep Relaxation)', 'Organic Lemongrass (Detox)'], required: true },
              { name: 'Pressure Preference', options: ['Medium Firm', 'Deep Intense Pressure'], required: true }
            ]
          }
        },
        { 
          page_id: wellnessPage.id, 
          title: 'Swedish Botanical Relaxation Massage', 
          description: 'Gentle, flowing strokes combined with warm sweet almond oil to dissolve stress and improve circulation.', 
          price_minor: 2800000, 
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
          page_id: wellnessPage.id, 
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
          page_id: wellnessPage.id, 
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
        },
        { 
          page_id: wellnessPage.id, 
          title: 'Hydrafacial Deluxe Deep Pore Refine', 
          description: 'Vortex-fusion medical grade extraction, gentle chemical peel, and antioxidant infusion.', 
          price_minor: 4800000, 
          sort_order: 4, 
          availability_status: 'available', 
          images: ['https://images.unsplash.com/photo-1512290900672-1f4a9ce8020e?auto=format&fit=crop&w=800&q=80'],
          item_data: {
            category: 'Facial Aesthetics',
            variants: [
              { name: 'Serum Infusion', options: ['Peptide Firming Complex', 'Salicylic Clarifying Serum'], required: true }
            ]
          }
        },
        { 
          page_id: wellnessPage.id, 
          title: 'Moroccan Hammam & Coffee Body Polish', 
          description: 'Full-body exfoliation with authentic black soap, kessa glove scrub, and organic coffee bean polish.', 
          price_minor: 3800000, 
          sort_order: 5, 
          availability_status: 'available', 
          images: ['https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80'],
          item_data: {
            category: 'Body Rituals',
            variants: [
              { name: 'Scrub Texture', options: ['Organic Arabica Coffee & Shea', 'Dead Sea Salt & Rosemary'], required: true }
            ]
          }
        }
      )
    }

    const boutiquePage = pages.find((p: { id: string, slug: string }) => p.slug === 'pacy-boutique')
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
              { name: 'Leather Finish', options: ['Cognac Heritage Tan', 'Obsidian Black', 'Oxblood Burgundy'], required: true },
              { name: 'Monogramming (Gold Foil)', options: ['No Monogram', 'Custom 2-3 Letters (+₦5,000)'] }
            ]
          }
        },
        { 
          page_id: boutiquePage.id, 
          title: 'Cashmere Crewneck Knit Sweater', 
          description: 'Grade-A 2-ply Mongolian cashmere sweater with ribbed cuffs and hem.', 
          price_minor: 5800000, 
          sort_order: 3, 
          availability_status: 'available', 
          images: ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80'],
          item_data: {
            category: 'Knitwear',
            variants: [
              { name: 'Size', options: ['S', 'M', 'L', 'XL'], required: true },
              { name: 'Color', options: ['Oatmeal Heather', 'Charcoal Grey', 'Soft Cream'], required: true }
            ]
          }
        },
        { 
          page_id: boutiquePage.id, 
          title: '18K Gold Hammered Hoop Earrings', 
          description: 'Handcrafted hollow hoops with a light-catching textured hammered finish.', 
          price_minor: 1800000, 
          sort_order: 4, 
          availability_status: 'available', 
          images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80'],
          item_data: {
            category: 'Jewelry',
            variants: [
              { name: 'Diameter', options: ['25mm Medium', '35mm Statement'], required: true }
            ]
          }
        },
        { 
          page_id: boutiquePage.id, 
          title: 'Handmade Suede Chelsea Ankle Boots', 
          description: 'Supple calfskin suede boots with Goodyear welt construction and durable crepe soles.', 
          price_minor: 9500000, 
          sort_order: 5, 
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

    const gadgetsPage = pages.find((p: { id: string, slug: string }) => p.slug === 'pacy-gadgets')
    if (gadgetsPage) {
      pageItems.push(
        { 
          page_id: gadgetsPage.id, 
          title: 'iPhone 15 Pro Max', 
          description: 'Aerospace-grade titanium design with A17 Pro chip, Action button, and 5x optical zoom camera.', 
          price_minor: 185000000, 
          sort_order: 0, 
          availability_status: 'available', 
          images: ['https://images.unsplash.com/photo-1695048065096-749e7b28292c?auto=format&fit=crop&w=800&q=80'], 
          item_data: { 
            category: 'Smartphones & Mobile',
            variants: [
              { name: 'Internal Storage', options: ['256GB', '512GB', '1TB'], required: true }, 
              { name: 'Finish', options: ['Natural Titanium', 'Blue Titanium', 'Black Titanium', 'White Titanium'], required: true },
              { name: 'Warranty Protection', options: ['Standard 1-Year Apple Warranty', '2-Year AppleCare+ with Accidental Damage'] }
            ] 
          } 
        },
        { 
          page_id: gadgetsPage.id, 
          title: 'Samsung Galaxy S24 Ultra', 
          description: 'Galaxy AI is here. Titanium exterior, built-in S Pen, and a 6.8" flat Dynamic AMOLED 2X display.', 
          price_minor: 175000000, 
          sort_order: 1, 
          availability_status: 'available', 
          images: ['https://images.unsplash.com/photo-1706691147573-009139fb2b75?auto=format&fit=crop&w=800&q=80'], 
          item_data: { 
            category: 'Smartphones & Mobile',
            variants: [
              { name: 'Storage', options: ['256GB', '512GB', '1TB'], required: true }, 
              { name: 'Color', options: ['Titanium Gray', 'Titanium Black', 'Titanium Violet'], required: true }
            ] 
          } 
        },
        { 
          page_id: gadgetsPage.id, 
          title: 'MacBook Air 15-inch (M3 Chip)', 
          description: 'Liquid Retina display with 500 nits brightness, MagSafe charging, and 18-hour all-day battery life.', 
          price_minor: 165000000, 
          sort_order: 2, 
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
          sort_order: 3, 
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
          sort_order: 4, 
          availability_status: 'available', 
          images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80'],
          item_data: {
            category: 'Audio & Wearables',
            variants: [
              { name: 'Engraving', options: ['No Engraving', 'Custom Free Emoji / Name Engraving'] }
            ]
          }
        },
        { 
          page_id: gadgetsPage.id, 
          title: 'PlayStation 5 Slim (Disc Edition)', 
          description: 'Next-gen gaming console with 1TB ultra-high speed SSD, ray tracing, and DualSense haptic feedback.', 
          price_minor: 85000000, 
          sort_order: 5, 
          availability_status: 'available', 
          images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80'],
          item_data: {
            category: 'Gaming',
            variants: [
              { name: 'Controller Bundle', options: ['1x DualSense Controller', '2x DualSense Controllers + Charging Dock (+₦35,000)'] }
            ]
          }
        }
      )
    }

    const hotelsPage = pages.find((p: { id: string, slug: string }) => p.slug === 'pacy-hotels')
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
              { name: 'Breakfast Experience', options: ['Complimentary Continental Breakfast', 'Full Champagne Gourmet Brunch'], required: true },
              { name: 'Airport VIP Transfer', options: ['Standard Concierge Check-in', 'Private Chauffeur Airport Pickup'] }
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
            category: 'Executive Rooms',
            variants: [
              { name: 'Floor Level', options: ['High Floor (15+)', 'Mid Floor (8-14)'], required: true }
            ]
          } 
        },
        { 
          page_id: hotelsPage.id, 
          title: 'Deluxe Twin City Room', 
          subtitle: '2 Queen Beds / Balcony', 
          description: 'Spacious room designed for colleagues or small families, featuring high-speed WiFi and espresso bar.', 
          price_minor: 4800000, 
          price_display: '48,000 / night', 
          sort_order: 2, 
          availability_status: 'available', 
          images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
          item_data: { 
            beds: 2, 
            occupancy: 4,
            category: 'Deluxe Rooms'
          } 
        }
      )
    }

    const staysPage = pages.find((p: { id: string, slug: string }) => p.slug === 'pacy-stays')
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
            sqft: 1800,
            category: 'Luxury Residences',
            variants: [
              { name: 'Housekeeping Frequency', options: ['Daily Morning Turndown', 'On-Demand Service Only'] },
              { name: 'Private Chef Service', options: ['Self Catering', 'Full-Day In-House Private Chef (+₦35,000/day)'] }
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
            sqft: 3200,
            category: 'Penthouses',
            variants: [
              { name: 'Vehicle & Chauffeur', options: ['No Vehicle', 'Range Rover with Private Driver Included (+₦50,000/day)'] }
            ]
          } 
        },
        { 
          page_id: staysPage.id, 
          title: 'Ikoyi Minimalist Designer Studio', 
          subtitle: '1 Bed / 1 Bath / Superfast Fiber', 
          description: 'Modern, quiet studio apartment equipped with dedicated ergonomic workspace, perfect for remote executives.', 
          price_minor: 5500000, 
          price_display: '55,000 / night', 
          sort_order: 2, 
          availability_status: 'available', 
          images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
          item_data: { 
            beds: 1, 
            baths: 1, 
            sqft: 650,
            category: 'Executive Studios'
          } 
        }
      )
    }

    const repairsPage = pages.find((p: { id: string, slug: string }) => p.slug === 'pacy-repairs')
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
              { name: 'Device Series', options: ['iPhone 15 Series', 'iPhone 14 Series', 'Samsung Galaxy S24/S23 Ultra'], required: true },
              { name: 'Tempered Glass Shield', options: ['No Screen Guard', '9H Sapphire Glass Protector Installed (+₦5,000)'] }
            ]
          } 
        },
        { 
          page_id: repairsPage.id, 
          title: 'High-Capacity OEM Battery Replacement', 
          description: 'Brand new certified battery cell with zero cycle count and 6-month full replacement warranty.', 
          price_minor: 2500000, 
          price_display: 'From 25,000', 
          sort_order: 1, 
          availability_status: 'available', 
          images: ['https://images.unsplash.com/photo-1628126235206-5260b9ea6441?auto=format&fit=crop&w=800&q=80'],
          item_data: {
            turnaround: '45 mins',
            category: 'Battery & Power',
            variants: [
              { name: 'Device Type', options: ['Apple iPhone / iPad', 'MacBook Air / Pro', 'Samsung Galaxy Series'], required: true }
            ]
          }
        },
        { 
          page_id: repairsPage.id, 
          title: 'Water Damage Ultrasonic Board Diagnostic', 
          description: 'Complete ultrasonic chemical bath cleaning, micro-corrosion removal, and motherboard circuit diagnostic.', 
          price_minor: 1200000, 
          price_display: '12,000', 
          sort_order: 2, 
          availability_status: 'available', 
          images: ['https://images.unsplash.com/photo-1590487988256-9ed24133863e?auto=format&fit=crop&w=800&q=80'],
          item_data: {
            turnaround: '24-48 hours',
            category: 'Motherboard Diagnostics'
          }
        }
      )
    }

    const mediaPage = pages.find((p: { id: string, slug: string }) => p.slug === 'pacy-media')
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
          title: 'Short-Form Viral TikTok / Reel Integration', 
          description: 'Fast-paced, authentic product integration created specifically for organic algorithmic virality.', 
          price_minor: 8500000, 
          sort_order: 1, 
          availability_status: 'available', 
          images: ['https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80'],
          item_data: {
            category: 'Short-Form Content',
            variants: [
              { name: 'Turnaround Time', options: ['Standard 5 Days', 'Rush 48-Hour Delivery (+₦2,500,000)'] }
            ]
          }
        }
      )
    }

    if (pageItems.length > 0) {
      const { data: insertedItems, error: piError } = await adminClient.from('page_items').insert(pageItems).select()
      if (piError) {
        console.error('Failed to insert page items', piError)
      } else if (insertedItems) {
        // Build new page_collections from the 'category' key in item_data
        const collectionsMap = new Map() // slug -> { name, page_id }
        const itemCollectionLinks = [] // array of { item_id, category_slug }

        for (const item of insertedItems) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const itemData = item.item_data as Record<string, any>;
          const catName = itemData?.category;
          if (catName) {
            const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            if (!collectionsMap.has(slug)) {
              collectionsMap.set(slug, {
                page_id: item.page_id,
                name: catName,
                slug: slug
              })
            }
            itemCollectionLinks.push({ item_id: item.id, slug })
            
            // Remove 'category' from item_data
            if (item.item_data && typeof item.item_data === 'object' && !Array.isArray(item.item_data)) {
              delete (item.item_data as Record<string, any>).category;
            }
          }
        }

        if (collectionsMap.size > 0) {
          const collectionsToInsert = Array.from(collectionsMap.values())
          const { data: insertedCollections, error: colError } = await adminClient
            .from('page_collections')
            .insert(collectionsToInsert)
            .select()

          if (colError) {
            console.error('Failed to insert page collections', colError)
          } else if (insertedCollections) {
            const slugToId = new Map(insertedCollections.map(c => [c.slug, c.id]))
            const linksToInsert = itemCollectionLinks.map(link => ({
              item_id: link.item_id,
              collection_id: slugToId.get(link.slug)
            })).filter((l): l is { item_id: string; collection_id: string } => Boolean(l.collection_id))

            if (linksToInsert.length > 0) {
              const { error: linkError } = await adminClient
                .from('page_item_collections')
                .insert(linksToInsert)
              if (linkError) console.error('Failed to link items to collections', linkError)
            }
          }
          
          // Update the items to remove the category from item_data
          for (const item of insertedItems) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await adminClient.from('page_items').update({ item_data: item.item_data as Record<string, any> }).eq('id', item.id)
          }
        }
      }
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
  // Persist the active location so all dashboard pages (Catalog Manager, etc.) resolve it immediately
  ;(await cookieStore).set('ourmenu_active_location_id', loc.id, { path: '/', maxAge: 60 * 60 * 2 })

  revalidatePath('/', 'layout')
  revalidateTag(`location_${loc.slug}`, 'default')
  revalidateTag(`location_pages_${loc.id}`, 'default')
  redirect('/dashboard')
}
