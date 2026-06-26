// @ts-nocheck
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function run() {
  const crypto = require('crypto');
  const uid = crypto.randomUUID().split('-')[0]
  const email = `demo-${uid}@pacygrills.com`
  const password = `demo-${crypto.randomUUID()}`

  const { data: authData, error: signUpError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (signUpError || !authData.user) {
    throw new Error('signUpError: ' + JSON.stringify(signUpError))
  }

  const userId = authData.user.id

  const { data: org, error: orgError } = await adminClient.from('organizations').insert({
    name: 'Pacy Grills',
    slug: `pacy-grills-${uid}`,
    created_by: userId,
  }).select('id').single()

  if (!org) throw new Error('orgError: ' + JSON.stringify(orgError))

  const { error: memberError } = await adminClient.from('organization_members').insert({
    organization_id: org.id,
    user_id: userId,
    role: 'owner'
  })

  if (memberError) throw new Error('memberError: ' + JSON.stringify(memberError))

  const { data: loc } = await adminClient.from('locations').insert({
    organization_id: org.id,
    name: 'Downtown HQ',
    slug: `downtown-${uid}`,
    address: '123 Tech Lane, Lagos',
    manual_payment_enabled: true,
    manual_payment_bank_name: 'OurMenu Demo Bank',
    manual_payment_account_name: 'Pacy Grills Demo',
    manual_payment_account_number: '0000000000',
    manual_payment_instructions: 'This is a demo. No real payment is required. Just click "I Have Transferred" to test the ordering flow!',
    randomizer_enabled: true,
    spinner_enabled: true,
    spinner_config: { 
      items: ["Free Drink", "10% Off", "Try Again", "Free Dessert", "Try Again", "20% Off"], 
      label: "Spin to Win!" 
    }
  }).select('id').single()

  if (!loc) throw new Error('Failed to create location')

  const { data: menu } = await adminClient.from('menus').insert({
    organization_id: org.id,
    location_id: loc.id,
    name: 'Evening Menu',
    publication_status: 'published'
  }).select('id').single()

  if (!menu) throw new Error('Failed to create menu')

  const { data: cat1 } = await adminClient.from('menu_categories').insert({ organization_id: org.id, menu_id: menu.id, name: 'Starters & Bites', sort_order: 0 }).select('id').single()
  const { data: cat2 } = await adminClient.from('menu_categories').insert({ organization_id: org.id, menu_id: menu.id, name: 'Premium Mains', sort_order: 1 }).select('id').single()
  const { data: cat3 } = await adminClient.from('menu_categories').insert({ organization_id: org.id, menu_id: menu.id, name: 'Signature Cocktails', sort_order: 2 }).select('id').single()
  const { data: cat4 } = await adminClient.from('menu_categories').insert({ organization_id: org.id, menu_id: menu.id, name: 'Desserts', sort_order: 3 }).select('id').single()

  if (!cat1 || !cat2 || !cat3 || !cat4) throw new Error('Failed to create categories')

  const { error: itemsError } = await adminClient.from('menu_items').insert([
    { organization_id: org.id, category_id: cat1.id, name: 'Spicy Asun Rolls', description: 'Smoked goat meat wrapped in crispy pastry, served with pepper sauce.', price_minor: 650000, is_featured: true, image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80' },
    { organization_id: org.id, category_id: cat1.id, name: 'Truffle Plantain Fries', description: 'Crispy plantain tossed in truffle oil and parmesan.', price_minor: 450000, is_featured: false, image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80' },
    { organization_id: org.id, category_id: cat2.id, name: '24-Hour Suya Steak', description: 'Prime ribeye marinated in our signature suya spice blend, grilled to perfection.', price_minor: 2800000, is_featured: true, image_url: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80' },
    { organization_id: org.id, category_id: cat2.id, name: 'Jollof Paella', description: 'Rich, smoky jollof rice mixed with grilled prawns, calamari, and spicy chorizo.', price_minor: 1850000, is_featured: false, image_url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80' },
    { organization_id: org.id, category_id: cat2.id, name: 'Charcoal Grilled Croaker', description: 'Whole croaker fish stuffed with herbs, served with roasted yam.', price_minor: 1500000, is_featured: false, availability_status: 'sold_out', image_url: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?auto=format&fit=crop&w=800&q=80' },
    { organization_id: org.id, category_id: cat3.id, name: 'Zobo Margarita', description: 'Tequila, fresh zobo extract, lime, and a spicy salt rim.', price_minor: 550000, is_featured: true, image_url: 'https://images.unsplash.com/photo-1583267746897-2cf415eb8f4a?auto=format&fit=crop&w=800&q=80' },
    { organization_id: org.id, category_id: cat3.id, name: 'Palm Wine Spritz', description: 'Fresh palm wine, prosecco, and a splash of elderflower.', price_minor: 600000, is_featured: false, image_url: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=800&q=80' },
    { organization_id: org.id, category_id: cat4.id, name: 'Puff-Puff Beignets', description: 'Warm puff-puff served with rich dark chocolate dipping sauce.', price_minor: 400000, is_featured: true, image_url: 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?auto=format&fit=crop&w=800&q=80' },
    { organization_id: org.id, category_id: cat4.id, name: 'Mango Sorbet', description: 'Fresh, icy mango sorbet made in-house.', price_minor: 350000, is_featured: false, image_url: 'https://images.unsplash.com/photo-1563805042-7684c8e9e533?auto=format&fit=crop&w=800&q=80' }
  ])

  if (itemsError) {
    throw new Error('Failed to insert demo menu items: ' + JSON.stringify(itemsError))
  }

  const { error: creditsError } = await adminClient.from('credit_transactions').insert({
    organization_id: org.id,
    amount: 5,
    reason: 'Demo Signup Bonus',
    created_by: userId
  })
  
  if (creditsError) throw new Error('creditsError: ' + JSON.stringify(creditsError))

  const { error: pagesError } = await adminClient.from('location_pages').insert([
    {
      location_id: loc.id,
      slug: 'vip-tables',
      title: 'VIP Table Reservations',
      template_type: 'rate-card',
      content: JSON.stringify({
        items: [
          { name: 'Standard VIP Table', price: '₦250,000', description: 'Includes 1 premium spirit, 1 champagne, seating for 4.' },
          { name: 'VVIP Cabana', price: '₦750,000', description: 'Includes 3 premium spirits, 2 champagnes, dedicated hostess, seating for 8.' }
        ]
      }),
      is_published: true,
      randomizer_enabled: false
    },
    {
      location_id: loc.id,
      slug: 'links',
      title: 'Our Links',
      template_type: 'link-in-bio',
      content: JSON.stringify({
        links: [
          { label: 'Follow our Instagram', url: 'https://instagram.com/pacygrills' },
          { label: 'Leave a Review', url: 'https://google.com' }
        ]
      }),
      is_published: true,
      randomizer_enabled: false
    }
  ])

  if (pagesError) {
    throw new Error('Failed to insert demo pages: ' + JSON.stringify(pagesError))
  }


}

run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
