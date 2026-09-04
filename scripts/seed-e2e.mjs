/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in environment")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seed() {
  console.log('Starting seed process...')
  
  // 1. Check if user exists, if not create
  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers()
  if (usersErr) throw usersErr
  
  let testUser = usersData.users.find(u => u.email === 'test-admin@ourmenuos.online')
  if (!testUser) {
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: 'test-admin@ourmenuos.online',
      password: 'testpassword123',
      email_confirm: true
    })
    if (createErr) throw createErr
    testUser = newUser.user
    console.log('Created test user')
  } else {
    console.log('Test user already exists')
  }

  // 2. Check if org exists
  const { data: orgs, error: orgErr } = await supabase.from('organizations').select('id').eq('slug', 'test-org')
  if (orgErr) throw orgErr
  
  let orgId = orgs?.[0]?.id
  if (!orgId) {
    const { data: newOrg, error: insertOrgErr } = await supabase.from('organizations').insert({
      name: 'Test Organization',
      slug: 'test-org',
      created_by: testUser.id
    }).select('id').single()
    if (insertOrgErr) throw insertOrgErr
    orgId = newOrg.id
    console.log('Created test org')
    
    // Create members
    await supabase.from('organization_members').insert({
      organization_id: orgId,
      user_id: testUser.id,
      role: 'owner'
    })
  }

  // 3. Create locations (demo, lounge)
  for (const slug of ['demo', 'lounge']) {
    const { data: locs, error: locErr } = await supabase.from('locations').select('id').eq('slug', slug)
    if (locErr) throw locErr
    
    let locId = locs?.[0]?.id
    if (!locId) {
      const { data: newLoc, error: insertLocErr } = await supabase.from('locations').insert({
        organization_id: orgId,
        name: slug.toUpperCase() + ' Location',
        slug: slug,
        publication_status: 'published'
      }).select('id').single()
      if (insertLocErr) throw insertLocErr
      locId = newLoc.id
      console.log('Created location: ' + slug)

      // Create a menu
      const { data: newMenu } = await supabase.from('menus').insert({
        organization_id: orgId,
        location_id: locId,
        name: 'Main Menu',
        publication_status: 'published'
      }).select('id').single()

      // Create a category
      const { data: newCat } = await supabase.from('menu_categories').insert({
        organization_id: orgId,
        menu_id: newMenu.id,
        name: 'Specials'
      }).select('id').single()

      // Create an item
      await supabase.from('menu_items').insert({
        organization_id: orgId,
        category_id: newCat.id,
        name: 'Test Burger',
        price_minor: 500000,
        availability_status: 'available'
      })
      console.log(`Created menu for location: ${slug}`)
    } else {
        console.log(`Location ${slug} already exists`)
    }
  }

  console.log('Seeding complete!')
}

seed().catch(console.error)
