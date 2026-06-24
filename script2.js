const fs = require('fs');
const file = 'apps/web/app/(dashboard)/dashboard/pages/actions.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('purgeStorefrontCache')) {
  content = content.replace("import { revalidatePath } from 'next/cache'", "import { revalidatePath } from 'next/cache'\r\nimport { purgeStorefrontCache } from '@/lib/cache-purger'");

  // createCustomPage
  content = content.replace(/  if \(error\) throw new Error\(\(error as Error\)\.message\)\r\n\r\n  revalidatePath\('\/dashboard\/pages'\)\r\n  redirect\('\/dashboard\/pages'\)\r\n\}/g,
  "  if (error) throw new Error((error as Error).message)\r\n\r\n  await purgeStorefrontCache(orgId)\r\n  revalidatePath('/dashboard/pages')\r\n  redirect('/dashboard/pages')\r\n}");

  // updatePage
  content = content.replace(/  if \(error\) throw new Error\(\(error as Error\)\.message\)\r\n\r\n  revalidatePath\('\/dashboard\/pages'\)\r\n\}/g,
  "  if (error) throw new Error((error as Error).message)\r\n\r\n  const { data: page } = await supabase.from('location_pages').select('locations(organization_id)').eq('id', pageId).single()\r\n  if (page && page.locations && !Array.isArray(page.locations)) await purgeStorefrontCache(page.locations.organization_id)\r\n  revalidatePath('/dashboard/pages')\r\n}");

  // addPageItem
  content = content.replace(/  const \{ error \} = await supabase\.from\('page_items'\)\.insert\(\{([\s\S]*?)\}\)\r\n\r\n  if \(error\) throw new Error\(\(error as Error\)\.message\)\r\n\r\n  revalidatePath\('\/dashboard\/pages'\)\r\n\}/g,
  "  const { error } = await supabase.from('page_items').insert({$1})\r\n\r\n  if (error) throw new Error((error as Error).message)\r\n\r\n  const { data: page } = await supabase.from('location_pages').select('locations(organization_id)').eq('id', page_id).single()\r\n  if (page && page.locations && !Array.isArray(page.locations)) await purgeStorefrontCache(page.locations.organization_id)\r\n  revalidatePath('/dashboard/pages')\r\n}");

  // updatePageItem
  content = content.replace(/  const \{ error \} = await supabase\r\n    \.from\('page_items'\)\r\n    \.update\(updatePayload\)\r\n    \.eq\('id', itemId\)\r\n\r\n  if \(error\) throw new Error\(\(error as Error\)\.message\)\r\n\r\n  revalidatePath\('\/dashboard\/pages'\)\r\n\}/g,
  "  const { error } = await supabase\r\n    .from('page_items')\r\n    .update(updatePayload)\r\n    .eq('id', itemId)\r\n\r\n  if (error) throw new Error((error as Error).message)\r\n\r\n  const { data: item } = await supabase.from('page_items').select('location_pages(locations(organization_id))').eq('id', itemId).single()\r\n  if (item && item.location_pages && !Array.isArray(item.location_pages) && item.location_pages.locations && !Array.isArray(item.location_pages.locations)) await purgeStorefrontCache(item.location_pages.locations.organization_id)\r\n  revalidatePath('/dashboard/pages')\r\n}");

  // deletePageItem
  content = content.replace(/  await supabase\.from\('page_items'\)\.delete\(\)\.eq\('id', itemId\)\r\n  revalidatePath\('\/dashboard\/pages'\)\r\n\}/g,
  "  const { data: item } = await supabase.from('page_items').select('location_pages(locations(organization_id))').eq('id', itemId).single()\r\n  await supabase.from('page_items').delete().eq('id', itemId)\r\n  if (item && item.location_pages && !Array.isArray(item.location_pages) && item.location_pages.locations && !Array.isArray(item.location_pages.locations)) await purgeStorefrontCache(item.location_pages.locations.organization_id)\r\n  revalidatePath('/dashboard/pages')\r\n}");

  // updateItemAvailability
  content = content.replace(/  await supabase\r\n    \.from\('page_items'\)\r\n    \.update\(\{ availability_status: status \}\)\r\n    \.eq\('id', itemId\)\r\n\r\n  revalidatePath\('\/dashboard\/pages'\)\r\n  revalidatePath\('\/dashboard\/manage\/bookings'\)\r\n  revalidatePath\('\/dashboard\/manage\/properties'\)\r\n\}/g,
  "  const { data: item } = await supabase.from('page_items').select('location_pages(locations(organization_id))').eq('id', itemId).single()\r\n  await supabase\r\n    .from('page_items')\r\n    .update({ availability_status: status })\r\n    .eq('id', itemId)\r\n\r\n  if (item && item.location_pages && !Array.isArray(item.location_pages) && item.location_pages.locations && !Array.isArray(item.location_pages.locations)) await purgeStorefrontCache(item.location_pages.locations.organization_id)\r\n  revalidatePath('/dashboard/pages')\r\n  revalidatePath('/dashboard/manage/bookings')\r\n  revalidatePath('/dashboard/manage/properties')\r\n}");

  // togglePageStatus
  content = content.replace(/  await supabase\r\n    \.from\('location_pages'\)\r\n    \.update\(\{ is_published: !currentStatus \}\)\r\n    \.eq\('id', pageId\)\r\n  revalidatePath\('\/dashboard\/pages'\)\r\n\}/g,
  "  await supabase\r\n    .from('location_pages')\r\n    .update({ is_published: !currentStatus })\r\n    .eq('id', pageId)\r\n  const { data: page } = await supabase.from('location_pages').select('locations(organization_id)').eq('id', pageId).single()\r\n  if (page && page.locations && !Array.isArray(page.locations)) await purgeStorefrontCache(page.locations.organization_id)\r\n  revalidatePath('/dashboard/pages')\r\n}");

  // deletePage
  content = content.replace(/  await supabase\.from\('location_pages'\)\.delete\(\)\.eq\('id', pageId\)\r\n  revalidatePath\('\/dashboard\/pages'\)\r\n\}/g,
  "  const { data: page } = await supabase.from('location_pages').select('locations(organization_id)').eq('id', pageId).single()\r\n  await supabase.from('location_pages').delete().eq('id', pageId)\r\n  if (page && page.locations && !Array.isArray(page.locations)) await purgeStorefrontCache(page.locations.organization_id)\r\n  revalidatePath('/dashboard/pages')\r\n}");

  fs.writeFileSync(file, content);
  console.log('Modified successfully.');
} else {
  console.log('Already modified.');
}
