const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'm', '[slug]', 'p', '[pageSlug]', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove bypass and add QueryData import
content = content.replace(
  `/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect, @typescript-eslint/ban-ts-comment */\n// FIXME: Developer bypassed types/rules. Requires refactoring for true perfection.`,
  `import { QueryData } from '@supabase/supabase-js'`
);

// 2. Fix generateMetadata location query
const oldMetaLocQuery = `  const { data: loc } = await supabase
    .from('locations')
    .select('id, name, cover_image_url')
    .eq('slug', slug)
    .returns<Record<string, any>[]>()
    .single()`;
const newMetaLocQuery = `  const locQuery = supabase
    .from('locations')
    .select('id, name, cover_image_url')
    .eq('slug', slug)
    .single()
  const { data: loc } = await locQuery`;
content = content.replace(oldMetaLocQuery, newMetaLocQuery);

// 3. Fix generateMetadata page query
const oldMetaPageQuery = `  const { data: page } = await supabase
    .from('location_pages')
    .select('title, content, template_type')
    .eq('location_id', loc.id)
    .eq('slug', pageSlug)
    .eq('is_published', true)
    .returns<Record<string, any>[]>()
    .single()`;
const newMetaPageQuery = `  const pageQuery = supabase
    .from('location_pages')
    .select('title, content, template_type')
    .eq('location_id', loc.id)
    .eq('slug', pageSlug)
    .eq('is_published', true)
    .single()
  const { data: page } = await pageQuery`;
content = content.replace(oldMetaPageQuery, newMetaPageQuery);

// 4. Fix main page location query
const oldMainLocQuery = `  const { data: loc } = await supabase
    .from('locations')
    .select('id, name, organization_id, theme_color, cover_image_url, ai_enabled, ai_name, instagram_handle, whatsapp_number, phone_number, organizations(logo_url), manual_payment_enabled, manual_payment_bank_name, manual_payment_account_name, manual_payment_account_number, manual_payment_instructions')
    .eq('slug', slug)
    .returns<Record<string, any>[]>()
    .single()`;
const newMainLocQuery = `  const locQuery = supabase
    .from('locations')
    .select('id, name, organization_id, theme_color, cover_image_url, ai_enabled, ai_name, instagram_handle, whatsapp_number, phone_number, organizations(logo_url), manual_payment_enabled, manual_payment_bank_name, manual_payment_account_name, manual_payment_account_number, manual_payment_instructions')
    .eq('slug', slug)
    .single()
  const { data: loc } = await locQuery`;
content = content.replace(oldMainLocQuery, newMainLocQuery);

// 5. Fix main page query
const oldMainPageQuery = `  const { data: page } = await supabase
    .from('location_pages')
    .select('id, title, slug, content, template_type, billing_enabled, billing_mode, payment_mode, deposit_percentage, business_type_preset, randomizer_enabled')
    .eq('location_id', loc.id)
    .eq('slug', pageSlug)
    .eq('is_published', true)
    .returns<Record<string, any>[]>()
    .single()`;
const newMainPageQuery = `  const pageQuery = supabase
    .from('location_pages')
    .select('id, title, slug, content, template_type, billing_enabled, billing_mode, payment_mode, deposit_percentage, business_type_preset, randomizer_enabled')
    .eq('location_id', loc.id)
    .eq('slug', pageSlug)
    .eq('is_published', true)
    .single()
  const { data: page } = await pageQuery`;
content = content.replace(oldMainPageQuery, newMainPageQuery);

// 6. Fix main items query
const oldMainItemsQuery = `  const { data: items } = await supabase
    .from('page_items')
    .select('*')
    .eq('page_id', page.id)
    .eq('is_published', true)
    .order('sort_order')
    .returns<Record<string, any>[]>()`;
const newMainItemsQuery = `  const itemsQuery = supabase
    .from('page_items')
    .select('*')
    .eq('page_id', page.id)
    .eq('is_published', true)
    .order('sort_order')
  const { data: items } = await itemsQuery`;
content = content.replace(oldMainItemsQuery, newMainItemsQuery);

// 7. Fix any casting in sharedProps and AIChat
const oldSharedProps = `  const sharedProps = {
    location: loc as any,
    page: page as any,
    items: (items as any[]) || [],
    locationSlug: slug,
    referralSource: ref,
    paymentIsLive: paymentSettings?.is_active ?? false,
  }`;
const newSharedProps = `  const sharedProps = {
    location: loc as QueryData<typeof locQuery>,
    page: page as QueryData<typeof pageQuery>,
    items: items as QueryData<typeof itemsQuery> || [],
    locationSlug: slug,
    referralSource: ref,
    paymentIsLive: paymentSettings?.is_active ?? false,
  }`;
content = content.replace(oldSharedProps, newSharedProps);

// Fix AI Chat cast
content = content.replace(`menuItems={items as any}`, `menuItems={(items as QueryData<typeof itemsQuery>).map(i => ({ id: i.id, name: i.name, price_minor: i.price_minor || 0 })) || []}`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched p/[pageSlug]/page.tsx');
