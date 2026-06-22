require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function run() {
  // 1. Update locations to enable randomizer
  const { error: locError } = await adminClient
    .from('locations')
    .update({
      randomizer_enabled: true,
      spinner_enabled: true,
      spinner_config: { items: ["Free Drink", "10% Off", "Try Again", "Free Dessert", "Try Again", "20% Off"], label: "Spin to Win!" }
    })
    .like('slug', '%pacy%');
  
  if (locError) {
    console.error('locError:', locError);
  } else {
    console.log('Locations updated!');
  }

  // 2. We don't know exact item IDs, so we'll just fetch all items belonging to Pacy Grills 
  // and give them random images from our list.
  const { data: orgs } = await adminClient.from('organizations').select('id').like('name', 'Pacy%');
  
  if (orgs && orgs.length > 0) {
    const orgIds = orgs.map(o => o.id);
    const { data: items } = await adminClient.from('menu_items').select('id, name').in('organization_id', orgIds);
    
    if (items) {
      const images = [
        'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1583267746897-2cf415eb8f4a?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1563805042-7684c8e9e533?auto=format&fit=crop&w=800&q=80'
      ];
      
      let count = 0;
      for (const item of items) {
        await adminClient.from('menu_items').update({
          image_url: images[count % images.length]
        }).eq('id', item.id);
        count++;
      }
      console.log(`Updated ${count} items with images.`);
    }
  }
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
