// @ts-nocheck
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminClient = createClient(supabaseUrl!, supabaseServiceKey!, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function runDemoLogic() {
  const uid = crypto.randomUUID().split('-')[0]
  const email = `demo-${uid}@pacygrills.com`
  const password = `demo-${crypto.randomUUID()}`
  
  console.log('1. Creating user...')
  const { data: authData, error: signUpError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })
  if (signUpError || !authData.user) {
    console.error('Create user error', signUpError)
    return
  }

  const userId = authData.user.id

  console.log('2. Creating org...')
  const { data: org, error: orgError } = await adminClient.from('organizations').insert({
    name: 'Pacy Grills',
    slug: `pacy-grills-${uid}`,
    created_by: userId,
  }).select('id').single()
  if (orgError) {
    console.error('Org error', orgError)
    return
  }

  console.log('3. Organization member...')
  const { error: memberError } = await adminClient.from('organization_members').insert({
    organization_id: org.id,
    user_id: userId,
    role: 'owner'
  })
  if (memberError) {
    console.error('Member error', memberError)
    return
  }

  console.log('4. Location...')
  const { data: loc, error: locError } = await adminClient.from('locations').insert({
    organization_id: org.id,
    name: 'Downtown HQ',
    slug: `downtown-${uid}`,
    address: '123 Tech Lane, Lagos',
    manual_payment_enabled: true,
    manual_payment_bank_name: 'OurMenu Demo Bank',
    manual_payment_account_name: 'Pacy Grills Demo',
    manual_payment_account_number: '0000000000',
    manual_payment_instructions: 'This is a demo. No real payment is required.'
  }).select('id').single()
  if (locError) {
    console.error('Location error', locError)
    return
  }

  console.log('5. Menu...')
  const { data: menu, error: menuError } = await adminClient.from('menus').insert({
    organization_id: org.id,
    location_id: loc.id,
    name: 'Evening Menu',
    publication_status: 'published'
  }).select('id').single()
  if (menuError) {
    console.error('Menu error', menuError)
    return
  }

  console.log('6. Categories...')
  const { data: cat1, error: cat1Error } = await adminClient.from('categories').insert({ menu_id: menu.id, name: 'Grills', sort_order: 1 }).select('id').single()
  const { data: cat2, error: cat2Error } = await adminClient.from('categories').insert({ menu_id: menu.id, name: 'Drinks', sort_order: 2 }).select('id').single()
  if (cat1Error || cat2Error) {
    console.error('Categories error', cat1Error || cat2Error)
    return
  }

  console.log('7. Items...')
  const { error: itemsError } = await adminClient.from('items').insert([
    { menu_id: menu.id, category_id: cat1.id, name: 'Spicy Suya', description: 'Classic beef suya with onions.', price: 4500, is_available: true },
    { menu_id: menu.id, category_id: cat1.id, name: 'Grilled Catfish', description: 'Whole catfish roasted in spices.', price: 12000, is_available: true },
    { menu_id: menu.id, category_id: cat2.id, name: 'Zobo', description: 'Chilled hibiscus tea.', price: 1500, is_available: true },
    { menu_id: menu.id, category_id: cat2.id, name: 'Palm Wine', description: 'Freshly tapped.', price: 2500, is_available: true }
  ])
  if (itemsError) {
    console.error('Items error', itemsError)
    return
  }

  console.log('8. Credits...')
  const { error: creditsError } = await adminClient.from('credit_transactions').insert({
    organization_id: org.id,
    amount: 150,
    transaction_type: 'grant',
    description: 'Demo Account Initial Credits'
  })
  if (creditsError) {
    console.error('Credits error', creditsError)
    return
  }

  console.log('9. Location Pages...')
  const { error: pagesError } = await adminClient.from('location_pages').insert([
    { location_id: loc.id, slug: 'vip-tables', title: 'VIP Table Reservations', template_type: 'rate_card', content: JSON.stringify({ description: 'Book VIP tables' }), is_published: true },
    { location_id: loc.id, slug: 'about-us', title: 'About Us', template_type: 'info', content: JSON.stringify({ description: 'Welcome' }), is_published: true }
  ])
  if (pagesError) {
    console.error('Pages error', pagesError)
    return
  }

  console.log('10. Custom Domain Settings...')
  const { error: domainError } = await adminClient.from('location_custom_domains').insert({
    location_id: loc.id,
    domain: `demo-${uid}.ourmenu.com`,
    status: 'active'
  })
  if (domainError) {
    console.error('Domain error', domainError)
    return
  }

  console.log('Demo workspace initialized successfully!')
}

runDemoLogic().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); })
