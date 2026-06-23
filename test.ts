// @ts-nocheck
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  const { data: orgs } = await supabase.from('organizations').select('*').ilike('name', '%Pacy%')

  if (orgs?.length) {
    const orgId = orgs[0].id
    const { data: items, error } = await supabase.from('menu_items').select('*').eq('organization_id', orgId)


    if (items?.length) {

    }
  }
}
run()
