const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim().replace(/^"|"$/g, '');
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');
const { createClient } = require('@supabase/supabase-js');
const c = createClient(url, key);

(async () => {
    // 1. Force update Pacy Grills location
    const { data: orgs } = await c.from('organizations').select('id').ilike('name', '%pacy%');
    if (!orgs || orgs.length === 0) { console.log('No Pacy org found'); process.exit(1); }
    const orgId = orgs[0].id;
    
    const { error: updErr } = await c.from('locations').update({
        randomizer_enabled: true,
        spinner_enabled: true
    }).eq('organization_id', orgId);
    
    if (updErr) console.error('Update error:', updErr);

    const { data: loc } = await c.from('locations').select('*').eq('organization_id', orgId).limit(1).single();
    if (loc) {
        console.log('Location:', loc.slug, 'Randomizer:', loc.randomizer_enabled, 'Spinner:', loc.spinner_enabled);
    }

    // 2. Fix images
    const images = [
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'
    ];
    
    const { data: items } = await c.from('menu_items').select('id, name').eq('organization_id', orgId);
    if (items) {
        let count = 0;
        for (const item of items) {
            await c.from('menu_items').update({
                image_url: images[count % images.length]
            }).eq('id', item.id);
            count++;
        }
        console.log('Updated', count, 'menu_items with images');
    }
})();
