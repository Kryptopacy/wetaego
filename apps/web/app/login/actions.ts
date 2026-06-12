'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in production, use a validation library like zod
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }
  const redirectTo = (formData.get('redirectTo') as string) || '/dashboard'

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect(`/login?message=Could not authenticate user&redirectTo=${encodeURIComponent(redirectTo)}`)
  }

  revalidatePath('/', 'layout')
  redirect(redirectTo)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }
  const redirectTo = (formData.get('redirectTo') as string) || '/dashboard'

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect(`/login?message=Could not sign up user&redirectTo=${encodeURIComponent(redirectTo)}`)
  }

  revalidatePath('/', 'layout')
  redirect(redirectTo)
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (data.url) {
    redirect(data.url)
  }
}

export async function startInteractiveDemo() {
  const supabase = await createClient()
  
  const uid = crypto.randomUUID().split('-')[0]
  const email = `demo-${uid}@pacygrills.com`
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

  const userId = authData.user.id

  // 2. Provision the 'Pacy Grills' Org
  const { data: org, error: orgError } = await adminClient.from('organizations').insert({
    name: 'Pacy Grills',
    slug: `pacy-grills-${uid}`,
    created_by: userId,
  }).select('id').single()

  if (orgError || !org) {
    console.error(orgError)
    redirect(`/login?message=Could not create demo organization`)
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
    ai_instructions: 'You are the elegant AI assistant for Pacy Grills. Suggest wine pairings for steaks, and signature cocktails for starters. Be very polite.',
    brand_knowledge: 'Pacy Grills is known for its legendary 24-hour marinated Suya steak and craft cocktails.',
    publication_status: 'published'
  }).select('id').single()

  // 5. Create Menu
  const { data: menu } = await adminClient.from('menus').insert({
    organization_id: org.id,
    location_id: loc.id,
    name: 'Evening Menu',
    publication_status: 'published'
  }).select('id').single()

  // 6. Create Categories
  const { data: cat1 } = await adminClient.from('menu_categories').insert({ organization_id: org.id, menu_id: menu.id, name: 'Starters & Bites', sort_order: 0 }).select('id').single()
  const { data: cat2 } = await adminClient.from('menu_categories').insert({ organization_id: org.id, menu_id: menu.id, name: 'Premium Mains', sort_order: 1 }).select('id').single()
  const { data: cat3 } = await adminClient.from('menu_categories').insert({ organization_id: org.id, menu_id: menu.id, name: 'Signature Cocktails', sort_order: 2 }).select('id').single()
  const { data: cat4 } = await adminClient.from('menu_categories').insert({ organization_id: org.id, menu_id: menu.id, name: 'Desserts', sort_order: 3 }).select('id').single()

  // 7. Add Menu Items
  await adminClient.from('menu_items').insert([
    // Starters
    { organization_id: org.id, category_id: cat1.id, name: 'Spicy Asun Rolls', description: 'Smoked goat meat wrapped in crispy pastry, served with pepper sauce.', price_minor: 650000, is_featured: true },
    { organization_id: org.id, category_id: cat1.id, name: 'Truffle Plantain Fries', description: 'Crispy plantain tossed in truffle oil and parmesan.', price_minor: 450000 },
    // Mains
    { organization_id: org.id, category_id: cat2.id, name: '24-Hour Suya Steak', description: 'Prime ribeye marinated in our signature suya spice blend, grilled to perfection.', price_minor: 2800000, is_featured: true },
    { organization_id: org.id, category_id: cat2.id, name: 'Jollof Paella', description: 'Rich, smoky jollof rice mixed with grilled prawns, calamari, and spicy chorizo.', price_minor: 1850000 },
    { organization_id: org.id, category_id: cat2.id, name: 'Charcoal Grilled Croaker', description: 'Whole croaker fish stuffed with herbs, served with roasted yam.', price_minor: 1500000 },
    // Cocktails
    { organization_id: org.id, category_id: cat3.id, name: 'Lagos Sunset', description: 'Vodka, passion fruit puree, fresh lime, and a splash of cranberry.', price_minor: 700000, is_featured: true },
    { organization_id: org.id, category_id: cat3.id, name: 'Smoked Hibiscus Margarita', description: 'Tequila, zobo extract, triple sec, smoked sea salt rim.', price_minor: 850000 },
    // Desserts
    { organization_id: org.id, category_id: cat4.id, name: 'Puff-Puff Beignets', description: 'Warm, fluffy dough dusted with cinnamon sugar, served with chocolate dip.', price_minor: 400000 },
    { organization_id: org.id, category_id: cat4.id, name: 'Mango Sorbet', description: 'Fresh, icy mango sorbet made in-house.', price_minor: 350000 }
  ])

  // 8. Add strict demo credits (financial defense)
  await adminClient.from('credit_transactions').insert({
    organization_id: org.id,
    amount: 5,
    reason: 'Demo Signup Bonus',
    created_by: userId
  })

  // We are fully logged in and provisioned!
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
