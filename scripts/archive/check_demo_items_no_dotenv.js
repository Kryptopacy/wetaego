const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '.env.local')
const envData = fs.readFileSync(envPath, 'utf8')
const env = {}
envData.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    let val = match[2].trim()
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1)
    env[match[1]] = val
  }
})

const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY'])

async function run() {
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', 'demo-restaurant')
    .single()

  if (!org) {
    console.log('No demo-restaurant found')
    return
  }

  const { data: items } = await supabase
    .from('menu_items')
    .select('name, image_url')
    .eq('organization_id', org.id)

  console.log(`Demo org found with ${items?.length} items.`)
  const withImages = items?.filter(i => i.image_url) || []
  console.log(`Items with images: ${withImages.length}`)
  if (withImages.length > 0) {
    console.log('Sample images:', withImages.slice(0, 3).map(i => i.name))
  }
}

run()
