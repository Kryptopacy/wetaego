const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim().replace(/^"|"$/g, '');
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');
const { createClient } = require('@supabase/supabase-js');
const c = createClient(url, key);

(async () => {
    const { data: orgs } = await c.from('organizations').select('id, name');
    for (const org of orgs) {
        const { data: locs } = await c.from('locations').select('id, name, slug').eq('organization_id', org.id);
        const { count: menuCount } = await c.from('menu_items').select('*', { count: 'exact', head: true }).eq('organization_id', org.id);
        
        let pageItemCount = 0;
        if (locs && locs.length > 0) {
            for (const loc of locs) {
                const { data: pages } = await c.from('location_pages').select('id, template_type, title').eq('location_id', loc.id);
                if (pages && pages.length > 0) {
                    for (const p of pages) {
                        const { count: pCount } = await c.from('page_items').select('*', { count: 'exact', head: true }).eq('page_id', p.id);
                        pageItemCount += (pCount || 0);
                        console.log(`- Org: ${org.name} | Loc: ${loc.name} (${loc.slug}) | Page: ${p.title} (${p.template_type}) | Page Items: ${pCount}`);
                    }
                } else {
                    console.log(`- Org: ${org.name} | Loc: ${loc.name} (${loc.slug}) | No pages | Menu Items: ${menuCount}`);
                }
            }
        } else {
            console.log(`- Org: ${org.name} | No locations`);
        }
    }
})();
