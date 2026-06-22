const fs = require('fs')

let content = fs.readFileSync('app/(dashboard)/dashboard/settings/page.tsx', 'utf8')

// 1. Add import
if (!content.includes('CurrencySelector')) {
  content = content.replace(
    `import { savePaymentSettings, saveManualPaymentSettings } from './payment-actions'`,
    `import { savePaymentSettings, saveManualPaymentSettings } from './payment-actions'\nimport { CurrencySelector } from './currency-selector'`
  )
}

// 2. Insert the CurrencySelector block
const targetBlock = `<p className="mt-1 text-xs text-zinc-500">Only lowercase letters, numbers, and hyphens.</p>
            </div>
            <div className="mt-2 flex items-center justify-between">`

const replacementBlock = `<p className="mt-1 text-xs text-zinc-500">Only lowercase letters, numbers, and hyphens.</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Default Currency</label>
              <CurrencySelector defaultValue={organization?.currency_code || 'NGN'} />
              <p className="mt-1 text-xs text-zinc-500">This currency will be used across your venues and reports.</p>
            </div>
            <div className="mt-2 flex items-center justify-between">`

if (content.includes(targetBlock)) {
  content = content.replace(targetBlock, replacementBlock)
  fs.writeFileSync('app/(dashboard)/dashboard/settings/page.tsx', content)
  console.log('Successfully patched page.tsx')
} else {
  console.error('Target block not found!')
}
