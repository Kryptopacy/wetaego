import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  const { data: orgs } = await supabase.from('organizations').select('*').ilike('name', '%Pacy%')
  console.log('Organizations:', orgs?.length)
  if (orgs?.length) {
    const orgId = orgs[0].id
    const { data: items, error } = await supabase.from('menu_items').select('*').eq('organization_id', orgId)
    console.log('Items Error:', error)
    console.log('Items Count:', items?.length)
    if (items?.length) {
       console.log('Sample item:', items[0])
    }
  }
}
run()
