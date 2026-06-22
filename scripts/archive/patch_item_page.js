const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'm', '[slug]', 'p', '[pageSlug]', '[itemId]', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove bypass and add QueryData import
content = content.replace(
  `/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect, @typescript-eslint/ban-ts-comment, @next/next/no-img-element */\n// FIXME: Developer bypassed types/rules. Requires refactoring for true perfection.`,
  `import { QueryData } from '@supabase/supabase-js'`
);

// 2. Fix generateMetadata item query
const oldMetaItemQuery = `  const { data: item } = await supabase
    .from('page_items')
    .select('title, description, images, location_pages!inner(locations!inner(slug))')
    .eq('id', itemId)
    .single()`;
const newMetaItemQuery = `  const itemQuery = supabase
    .from('page_items')
    .select('title, description, images, location_pages!inner(locations!inner(slug))')
    .eq('id', itemId)
    .single()
  const { data: item } = await itemQuery`;
content = content.replace(oldMetaItemQuery, newMetaItemQuery);

content = content.replace(
  `if (!item || (item.location_pages as any).locations.slug !== slug) return { title: 'Not Found' }`,
  `if (!item || (item.location_pages as { locations: { slug: string } }).locations.slug !== slug) return { title: 'Not Found' }`
);

// 3. Fix main loc query
const oldMainLocQuery = `  const { data: loc } = await supabase
    .from('locations')
    .select('id, name, theme_color, whatsapp_number')
    .eq('slug', slug)
    .single()`;
const newMainLocQuery = `  const locQuery = supabase
    .from('locations')
    .select('id, name, theme_color, whatsapp_number')
    .eq('slug', slug)
    .single()
  const { data: loc } = await locQuery`;
content = content.replace(oldMainLocQuery, newMainLocQuery);

// 4. Fix main item query
const oldMainItemQuery = `  const { data: item } = await supabase
    .from('page_items')
    .select(\`
      *,
      location_pages!inner(id, slug, template_type, billing_enabled, payment_mode, deposit_percentage)
    \`)
    .eq('id', itemId)
    .eq('is_published', true)
    .single()`;
const newMainItemQuery = `  const itemQuery = supabase
    .from('page_items')
    .select(\`
      *,
      location_pages!inner(id, slug, template_type, billing_enabled, payment_mode, deposit_percentage)
    \`)
    .eq('id', itemId)
    .eq('is_published', true)
    .single()
  const { data: item } = await itemQuery`;
content = content.replace(oldMainItemQuery, newMainItemQuery);

content = content.replace(
  `if (!item || (item.location_pages as any).slug !== pageSlug) notFound()`,
  `if (!item || (item.location_pages as { slug: string }).slug !== pageSlug) notFound()`
);

content = content.replace(
  `const pageInfo = item.location_pages as any`,
  `const pageInfo = item.location_pages as { template_type: string }`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched [itemId]/page.tsx');
