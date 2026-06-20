const fs = require('fs');

const path = 'd:/pacy_labs/ourmenu/apps/web/app/login/actions.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Replace categories inserts
const oldCatInserts = `  // 6. Create Categories
  const { data: cat1 } = await adminClient.from('menu_categories').insert({ organization_id: org.id, menu_id: menu.id, name: 'Starters & Bites', sort_order: 0 }).select('id').single()
  const { data: cat2 } = await adminClient.from('menu_categories').insert({ organization_id: org.id, menu_id: menu.id, name: 'Premium Mains', sort_order: 1 }).select('id').single()
  const { data: cat3 } = await adminClient.from('menu_categories').insert({ organization_id: org.id, menu_id: menu.id, name: 'Signature Cocktails', sort_order: 2 }).select('id').single()
  const { data: cat4 } = await adminClient.from('menu_categories').insert({ organization_id: org.id, menu_id: menu.id, name: 'Desserts', sort_order: 3 }).select('id').single()

  if (!cat1 || !cat2 || !cat3 || !cat4) throw new Error('Failed to create categories')`;

const newCatInserts = `  // 6. Create Categories (Bulk Insert to reduce network requests)
  const { data: cats, error: catsError } = await adminClient.from('menu_categories').insert([
    { organization_id: org.id, menu_id: menu.id, name: 'Starters & Bites', sort_order: 0 },
    { organization_id: org.id, menu_id: menu.id, name: 'Premium Mains', sort_order: 1 },
    { organization_id: org.id, menu_id: menu.id, name: 'Signature Cocktails', sort_order: 2 },
    { organization_id: org.id, menu_id: menu.id, name: 'Desserts', sort_order: 3 }
  ]).select('id')

  if (catsError || !cats || cats.length < 4) throw new Error('Failed to create categories: ' + (catsError?.message || 'Missing data'))
  
  const [cat1, cat2, cat3, cat4] = cats;`;

content = content.replace(oldCatInserts, newCatInserts);

// 2. Wrap menu_items insert in retry
const oldItemsInsert = `  // 7. Add Menu Items
  const { error: itemsError } = await adminClient.from('menu_items').insert([`;

const newItemsInsert = `  // 7. Add Menu Items
  let itemsError = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { error } = await adminClient.from('menu_items').insert([`;

content = content.replace(oldItemsInsert, newItemsInsert);

const oldItemsEnd = `    { organization_id: org.id, category_id: cat4.id, name: 'Mango Sorbet', description: 'Fresh, icy mango sorbet made in-house.', price_minor: 350000, is_featured: false, availability_status: 'available' }
  ])

  if (itemsError) {`;

const newItemsEnd = `    { organization_id: org.id, category_id: cat4.id, name: 'Mango Sorbet', description: 'Fresh, icy mango sorbet made in-house.', price_minor: 350000, is_featured: false, availability_status: 'available' }
    ]);
    
    itemsError = error;
    if (!itemsError) break;
    await new Promise(r => setTimeout(r, 500));
  }

  if (itemsError) {`;

content = content.replace(oldItemsEnd, newItemsEnd);

// 3. Wrap location_pages insert in retry
const oldPagesInsert = `  // 9. Add Demo Custom Pages for them to preview the multi-template architecture
  const { data: pages, error: pagesError } = await adminClient.from('location_pages').insert([`;

const newPagesInsert = `  // 9. Add Demo Custom Pages for them to preview the multi-template architecture
  let pages = null;
  let pagesError = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { data, error } = await adminClient.from('location_pages').insert([`;

content = content.replace(oldPagesInsert, newPagesInsert);

const oldPagesEnd = `      is_published: true,
      randomizer_enabled: false
    }
  ]).select('id, slug')

  if (pagesError || !pages) {`;

const newPagesEnd = `      is_published: true,
      randomizer_enabled: false
    }
  ]).select('id, slug');
  
    pages = data;
    pagesError = error;
    if (!pagesError && pages) break;
    await new Promise(r => setTimeout(r, 500));
  }

  if (pagesError || !pages) {`;

content = content.replace(oldPagesEnd, newPagesEnd);

fs.writeFileSync(path, content, 'utf8');
console.log('actions.ts patched successfully!');
