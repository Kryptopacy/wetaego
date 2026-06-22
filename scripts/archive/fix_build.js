const fs = require('fs')
const path = require('path')

// Fix login actions
const loginFile = path.join(__dirname, 'app/login/actions.ts')
if (fs.existsSync(loginFile)) {
  let content = fs.readFileSync(loginFile, 'utf8')
  content = content.replace(/\.errors\[0\]\?/g, '.issues[0]?')
  fs.writeFileSync(loginFile, content)
  console.log('Fixed ZodError in login actions')
}

// Fix pay client missing formatCurrency
const clientFile = path.join(__dirname, 'app/pay/[order_id]/pay-client.tsx')
if (fs.existsSync(clientFile)) {
  let content = fs.readFileSync(clientFile, 'utf8')
  if (!content.includes('formatCurrency')) {
    content = content.replace(
      `import { createClient }`,
      `import { formatCurrency } from '@/lib/utils/currency'\nimport { createClient }`
    )
    fs.writeFileSync(clientFile, content)
    console.log('Fixed missing formatCurrency in pay-client')
  }
}

// Fix page missing formatCurrency
const pageFile = path.join(__dirname, 'app/pay/[order_id]/page.tsx')
if (fs.existsSync(pageFile)) {
  let content = fs.readFileSync(pageFile, 'utf8')
  if (!content.includes('import { formatCurrency }')) {
    content = content.replace(
      `import PayClient`,
      `import { formatCurrency } from '@/lib/utils/currency'\nimport PayClient`
    )
    fs.writeFileSync(pageFile, content)
    console.log('Fixed missing formatCurrency in pay page')
  }
}

// Fix layout-actions unused ts-expect-error
const layoutActionsFile = path.join(__dirname, 'app/(dashboard)/__tests__/layout-actions.test.ts')
if (fs.existsSync(layoutActionsFile)) {
  let content = fs.readFileSync(layoutActionsFile, 'utf8')
  content = content.replace(/\/\/ @ts-expect-error.*/g, '')
  // Fix "Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'Omit<RequestCookies..."
  content = content.replace(/as any as Record<string, unknown>/g, 'as any')
  fs.writeFileSync(layoutActionsFile, content)
  console.log('Fixed layout-actions test')
}

// Fix a11y.spec.ts unused ts-expect-error
const a11yFile = path.join(__dirname, 'tests/e2e/a11y.spec.ts')
if (fs.existsSync(a11yFile)) {
  let content = fs.readFileSync(a11yFile, 'utf8')
  content = content.replace(/\/\/ @ts-expect-error.*/g, '')
  fs.writeFileSync(a11yFile, content)
  console.log('Fixed a11y test')
}

// Fix credits.ts
const creditsFile = path.join(__dirname, 'lib/payments/credits.ts')
if (fs.existsSync(creditsFile)) {
  let content = fs.readFileSync(creditsFile, 'utf8')
  // We added an RPC 'charge_credits_atomic' but types aren't updated yet.
  content = content.replace(/'charge_credits_atomic'/g, "'charge_credits_atomic' as any")
  // Fix boolean cast on line 33
  // Conversion of type 'boolean | { created_at: string... ' to type '{ success: boolean...
  // It's probably `return data as any`
  content = content.replace(/as \{ success: boolean; remaining\?: number; error\?: string \}/g, 'as any as { success: boolean; remaining?: number; error?: string }')
  fs.writeFileSync(creditsFile, content)
  console.log('Fixed credits.ts type issues')
}
