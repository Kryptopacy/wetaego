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
  const { data: org, error: orgError } = await supabase.from('organizations').insert({
    name: 'Pacy Grills',
    slug: `pacy-grills-${uid}`,
    created_by: userId,
  }).select('id').single()

  if (orgError || !org) {
    console.error(orgError)
    redirect(`/login?message=Could not create demo organization`)
  }

  // 3. Make them Owner
  await supabase.from('organization_members').insert({
    organization_id: org.id,
    user_id: userId,
    role: 'owner'
  })

  // 4. Create Location
  const { data: loc } = await supabase.from('locations').insert({
    organization_id: org.id,
    name: 'Main Branch',
    slug: `pacy-grills-${uid}`,
    address: '123 Demo St',
    currency_code: 'NGN',
    theme_color: '#0f7b55',
    ai_enabled: true,
    ai_name: 'Pacy Assistant'
  }).select('id').single()

  // 5. Create Menu
  const { data: menu } = await supabase.from('menus').insert({
    organization_id: org.id,
    location_id: loc.id,
    name: 'Main Menu',
    publication_status: 'published'
  }).select('id').single()

  // 6. Create Categories
  const { data: cat1 } = await supabase.from('menu_categories').insert({
    organization_id: org.id,
    menu_id: menu.id,
    name: 'Signature Cocktails',
    sort_order: 0
  }).select('id').single()

  const { data: cat2 } = await supabase.from('menu_categories').insert({
    organization_id: org.id,
    menu_id: menu.id,
    name: 'Main Courses',
    sort_order: 1
  }).select('id').single()

  // 7. Add Menu Items
  await supabase.from('menu_items').insert([
    {
      organization_id: org.id,
      category_id: cat1.id,
      name: 'Lagos Sunset',
      description: 'Vodka, passion fruit, fresh lime.',
      price_minor: 120000,
      availability_status: 'available'
    },
    {
      organization_id: org.id,
      category_id: cat1.id,
      name: 'Smoked Negroni',
      description: 'Gin, Campari, sweet vermouth, applewood smoke.',
      price_minor: 150000,
      availability_status: 'sold_out'
    },
    {
      organization_id: org.id,
      category_id: cat2.id,
      name: 'Jollof Rice & Grilled Goat',
      description: 'Spicy, rich, and unforgettable.',
      price_minor: 250000,
      availability_status: 'available'
    }
  ])

  // 8. Add strict demo credits (financial defense)
  await supabase.from('credit_transactions').insert({
    organization_id: org.id,
    amount: 5,
    reason: 'Demo Signup Bonus',
    created_by: userId
  })

  // We are fully logged in and provisioned!
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
