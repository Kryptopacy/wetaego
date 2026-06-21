const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim().replace(/^"|"$/g, '');
const SUPABASE_SERVICE_ROLE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');

const { createClient } = require('@supabase/supabase-js');
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function run() {
  const { data: orgs } = await adminClient.from('organizations').select('id, name');
  console.log('Orgs:', orgs);
  
  const { data: locs } = await adminClient.from('locations').select('id, slug, organization_id, name');
  console.log('Locations:', locs);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
