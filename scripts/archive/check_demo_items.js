require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', 'demo-restaurant')
    .single();

  if (!org) {
    console.log('No demo-restaurant found');
    return;
  }

  const { data: items, error: itemsErr } = await supabase
    .from('menu_items')
    .select('name, image_url')
    .eq('organization_id', org.id);

  console.log(`Demo org found with ${items?.length} items.`);
  const withImages = items?.filter(i => i.image_url) || [];
  console.log(`Items with images: ${withImages.length}`);
  if (withImages.length > 0) {
    console.log(withImages.slice(0, 3));
  }
}

check();
