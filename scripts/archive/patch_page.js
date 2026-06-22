const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'm', '[slug]', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove the ESLint bypasses at the top
content = content.replace(
  '/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect, @typescript-eslint/ban-ts-comment */\n// FIXME: Developer bypassed types/rules. Requires refactoring for true perfection.',
  "import { QueryData } from '@supabase/supabase-js'"
);

// 2. Wrap the location fetch in QueryData
const oldQuery = `  const { data: locationData } = await supabase
    .from('locations')
    .select('id, name, organization_id, ai_enabled, ai_name, theme_color, cover_image_url, operating_hours, wifi_network, wifi_password, instagram_handle, twitter_handle, facebook_handle, whatsapp_number, phone_number, google_maps_url, randomizer_enabled, spinner_enabled, spinner_config, global_discount_enabled, global_discount_banner_text, global_discount_percentage, manual_payment_enabled, manual_payment_bank_name, manual_payment_account_name, manual_payment_account_number, manual_payment_instructions, organizations(logo_url)')
    .eq('slug', slug)
    .single()

  if (!locationData) {
    notFound()
  }

  const location = locationData as any // temporary until global DB types are generated`;

const newQuery = `  const locationQuery = supabase
    .from('locations')
    .select('id, name, organization_id, ai_enabled, ai_name, theme_color, cover_image_url, operating_hours, wifi_network, wifi_password, instagram_handle, twitter_handle, facebook_handle, whatsapp_number, phone_number, google_maps_url, randomizer_enabled, spinner_enabled, spinner_config, global_discount_enabled, global_discount_banner_text, global_discount_percentage, manual_payment_enabled, manual_payment_bank_name, manual_payment_account_name, manual_payment_account_number, manual_payment_instructions, organizations(logo_url)')
    .eq('slug', slug)
    .single()

  type LocationQueryType = QueryData<typeof locationQuery>

  const { data: locationData } = await locationQuery

  if (!locationData) {
    notFound()
  }

  const location: LocationQueryType = locationData`;

content = content.replace(oldQuery, newQuery);

// 3. Fix the array vs object check for the logo_url join since it might be an array depending on foreign keys
content = content.replace(
  `"logo": location.organizations?.logo_url || undefined,`,
  `"logo": location.organizations && !Array.isArray(location.organizations) ? location.organizations.logo_url : undefined,`
);

// 4. Fix spinner config 'any' cast
content = content.replace(
  `config={location.spinner_config as any}`,
  `config={location.spinner_config as Record<string, unknown>}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched page.tsx');
