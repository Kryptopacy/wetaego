const fs = require('fs');
const file = 'apps/web/app/(dashboard)/dashboard/menu/actions.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('purgeStorefrontCache')) {
  content = content.replace("import { revalidatePath } from 'next/cache'", "import { revalidatePath } from 'next/cache'\r\nimport { purgeStorefrontCache } from '@/lib/cache-purger'");
  
  // replace success blocks
  content = content.replace(/  if \(error\) return \{ error: \(error as Error\)\.message \}\r\n\r\n  revalidatePath\('\/dashboard\/menu'\)\r\n  return \{ success: true \}/g, 
    "  if (error) return { error: (error as Error).message }\r\n\r\n  await purgeStorefrontCache(orgId || item?.organization_id)\r\n  revalidatePath('/dashboard/menu')\r\n  return { success: true }"
  );

  // replace deleteItem
  content = content.replace(/  const \{ error \} = await supabase\.from\('menu_items'\)\.delete\(\)\.eq\('id', itemId\)\r\n  \r\n  if \(error\) return \{ error: \(error as Error\)\.message \}\r\n\r\n  revalidatePath\('\/dashboard\/menu'\)/g, 
  "  const { error } = await supabase.from('menu_items').delete().eq('id', itemId)\r\n  \r\n  if (error) return { error: (error as Error).message }\r\n\r\n  await purgeStorefrontCache(item.organization_id)\r\n  revalidatePath('/dashboard/menu')");

  // replace updateItem
  content = content.replace(/  const \{ error \} = await supabase\.from\('menu_items'\)\.update\(updatePayload\)\.eq\('id', itemId\)\r\n\r\n  if \(error\) return \{ error: \(error as Error\)\.message \}\r\n\r\n  revalidatePath\('\/dashboard\/menu'\)/g,
  "  const { error } = await supabase.from('menu_items').update(updatePayload).eq('id', itemId)\r\n\r\n  if (error) return { error: (error as Error).message }\r\n\r\n  await purgeStorefrontCache(item.organization_id)\r\n  revalidatePath('/dashboard/menu')");

  // replace applyTranslations
  content = content.replace(/  revalidatePath\('\/dashboard\/menu'\)\r\n  return \{ success: true \}\r\n\}$/g,
  "  await purgeStorefrontCache(orgId)\r\n  revalidatePath('/dashboard/menu')\r\n  return { success: true }\r\n}");

  // replace toggleItemStatus
  content = content.replace(/  await supabase\r\n    \.from\('menu_items'\)\r\n    \.update\(\{ availability_status: nextStatus \}\)\r\n    \.eq\('id', itemId\)\r\n\r\n  revalidatePath\('\/dashboard\/menu'\)/g,
  "  const { data: item } = await supabase.from('menu_items').select('organization_id').eq('id', itemId).single()\r\n  await supabase\r\n    .from('menu_items')\r\n    .update({ availability_status: nextStatus })\r\n    .eq('id', itemId)\r\n\r\n  if (item) await purgeStorefrontCache(item.organization_id)\r\n  revalidatePath('/dashboard/menu')");

  // updateCategoryOrder
  content = content.replace(/  for \(const \{ id, sort_order \} of updates\) \{\r\n    await supabase\r\n      \.from\('menu_categories'\)\r\n      \.update\(\{ sort_order \}\)\r\n      \.eq\('id', id\)\r\n  \}\r\n\r\n  revalidatePath\('\/dashboard\/menu'\)/g,
  "  for (const { id, sort_order } of updates) {\r\n    await supabase\r\n      .from('menu_categories')\r\n      .update({ sort_order })\r\n      .eq('id', id)\r\n  }\r\n\r\n  const { data: cat } = await supabase.from('menu_categories').select('organization_id').eq('id', updates[0].id).single()\r\n  if (cat) await purgeStorefrontCache(cat.organization_id)\r\n  revalidatePath('/dashboard/menu')");

  fs.writeFileSync(file, content);
  console.log('Modified successfully.');
} else {
  console.log('Already modified.');
}
