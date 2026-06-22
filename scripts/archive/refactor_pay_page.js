const fs = require('fs')
const path = require('path')

// 1. Refactor page.tsx
const pageFile = path.join(__dirname, 'app/pay/[order_id]/page.tsx')
if (fs.existsSync(pageFile)) {
  let content = fs.readFileSync(pageFile, 'utf8')
  
  // Add imports
  if (!content.includes('mapSupabaseOrderToUI')) {
    content = content.replace(
      `import PayClient from './pay-client'`,
      `import PayClient from './pay-client'\nimport { mapSupabaseOrderToUI } from '@/lib/utils/transformers'`
    )
  }

  // Remove local interfaces
  content = content.replace(/interface Organization \{[\s\S]*?\}\n\ninterface Order \{[\s\S]*?\}\n\n/, '')

  // Replace 'as any as Order' with DTO transformer
  content = content.replace(
    /const order = orderRaw as any as Order/,
    `const order = orderRaw ? mapSupabaseOrderToUI(orderRaw) : null`
  )

  fs.writeFileSync(pageFile, content)
  console.log('Refactored page.tsx')
}

// 2. Refactor pay-client.tsx
const clientFile = path.join(__dirname, 'app/pay/[order_id]/pay-client.tsx')
if (fs.existsSync(clientFile)) {
  let content = fs.readFileSync(clientFile, 'utf8')
  
  // Add imports
  if (!content.includes('UIOrder')) {
    content = content.replace(
      `import { createClient } from '@/lib/supabase/client'`,
      `import { createClient } from '@/lib/supabase/client'\nimport { UIOrder } from '@/lib/types/frontend'`
    )
  }

  // Remove local interfaces
  content = content.replace(/export interface Organization \{[\s\S]*?\}\n\nexport interface Order \{[\s\S]*?\}\n\n/, '')

  // Replace usages of Order with UIOrder
  content = content.replace(/order: Order/g, 'order: UIOrder')
  content = content.replace(/\(prev: Order\)/g, '(prev: UIOrder)')
  content = content.replace(/as Order\)/g, 'as UIOrder)')

  // ensure formatCurrency is imported because line 101 uses it but it wasn't imported in the snippet? Let's check
  if (!content.includes('formatCurrency')) {
    content = content.replace(
      `import { createClient } from '@/lib/supabase/client'`,
      `import { createClient } from '@/lib/supabase/client'\nimport { formatCurrency } from '@/lib/utils/currency'`
    )
  }

  fs.writeFileSync(clientFile, content)
  console.log('Refactored pay-client.tsx')
}
