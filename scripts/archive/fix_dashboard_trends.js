const fs = require('fs')

const path = 'app/(dashboard)/dashboard/page.tsx'
let content = fs.readFileSync(path, 'utf8')

// Fix 1: Add newMenuItemsRes and menuChange definition
content = content.replace(
  `  let orderCount = 127
  let requestCount = 3

  if (orgId) {`,
  `  let orderCount = 127
  let requestCount = 3
  let menuChange = '+2 this week'

  if (orgId) {`
)

// Fix 2: Add newMenuItemsRes query and use Date.now()
content = content.replace(
  `    const [menuItemsRes, qrScansRes, ordersRes, requestsRes] = await Promise.all([
      supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('qr_codes').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)
        .gte('created_at', new Date(1718236800000 - 86400000).toISOString()),
      supabase.from('service_requests').select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId).eq('status', 'pending'),
    ])`,
  `    const [menuItemsRes, newMenuItemsRes, qrScansRes, ordersRes, requestsRes] = await Promise.all([
      supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('qr_codes').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('service_requests').select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId).eq('status', 'pending'),
    ])`
)

// Fix 3: Read newMenuItemsRes
content = content.replace(
  `    menuCount = menuItemsRes.count ?? 0
    qrCount = qrScansRes.count ?? 0`,
  `    menuCount = menuItemsRes.count ?? 0
    const newMenuCount = newMenuItemsRes.count ?? 0
    menuChange = newMenuCount > 0 ? \`+\${newMenuCount} this week\` : 'No new items'
    qrCount = qrScansRes.count ?? 0`
)

// Fix 4: Apply menuChange
content = content.replace(
  `      change: '+2 this week',
      trend: 'up',`,
  `      change: menuChange,
      trend: menuChange.includes('+') ? 'up' : 'neutral',`
)

fs.writeFileSync(path, content)
console.log('Fixed trends')
