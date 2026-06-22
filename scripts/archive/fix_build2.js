const fs = require('fs')
const path = require('path')

// 1. Fix login actions
const loginFile = path.join(__dirname, 'app/login/actions.ts')
if (fs.existsSync(loginFile)) {
  let content = fs.readFileSync(loginFile, 'utf8')
  // Fix line 141: `is_demo: true,` inside insert
  content = content.replace(/is_demo: true,\n\s*\}\)/g, 'is_demo: true,\n  } as any)')
  // Fix line 367: `.eq('is_demo', true)`
  content = content.replace(/\.eq\('is_demo', true\)/g, ".eq('is_demo' as any, true)")
  fs.writeFileSync(loginFile, content)
  console.log('Fixed login actions is_demo cast')
}

// 2. Fix pay-client formatCurrency
const clientFile = path.join(__dirname, 'app/pay/[order_id]/pay-client.tsx')
if (fs.existsSync(clientFile)) {
  let content = fs.readFileSync(clientFile, 'utf8')
  if (!content.includes('import { formatCurrency }')) {
    content = content.replace(
      `import { createClient } from '@/lib/supabase/client'`,
      `import { createClient } from '@/lib/supabase/client'\nimport { formatCurrency } from '@/lib/utils/currency'`
    )
    fs.writeFileSync(clientFile, content)
    console.log('Fixed pay-client import formatCurrency')
  }
}
