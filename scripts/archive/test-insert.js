require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminClient = createClient(url, key);

async function run() {
  const { data: org } = await adminClient.from('organizations').select('id').limit(1).single();
  const { data: cat } = await adminClient.from('menu_categories').select('id').limit(1).single();

  const { error: itemsError } = await adminClient.from('menu_items').insert([
    { organization_id: org.id, category_id: cat.id, name: 'Spicy Asun Rolls', description: 'Smoked goat meat wrapped in crispy pastry, served with pepper sauce.', price_minor: 650000, is_featured: true, availability_status: 'available' },
    { organization_id: org.id, category_id: cat.id, name: 'Truffle Plantain Fries', description: 'Crispy plantain tossed in truffle oil and parmesan.', price_minor: 450000, is_featured: false, availability_status: 'available' }
  ]);
  
  console.log('Error:', itemsError);
}
run();
