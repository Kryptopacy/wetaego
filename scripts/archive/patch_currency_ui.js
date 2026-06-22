const fs = require('fs')
const path = require('path')

const file = 'app/m/[slug]/cart-fab.tsx'

let content = fs.readFileSync(file, 'utf8')

// Inject import
if (!content.includes("import { formatCurrency }")) {
  content = content.replace(
    `import { useCartStore } from '@/lib/store/cart'`,
    `import { useCartStore } from '@/lib/store/cart'\nimport { formatCurrency } from '@/lib/utils/currency'`
  )
}

// Replace patterns
content = content.replace(/₦\{\(([^/]+)\s*\/\s*100\)\.toLocaleString\(\)\}/g, "{formatCurrency($1)}")
content = content.replace(/₦\$\{\(([^/]+)\s*\/\s*100\)\.toLocaleString\(\)\}/g, "${formatCurrency($1)}")
content = content.replace(/₦\{\(Math\.ceil\(([^)]+)\)\s*\/\s*100\)\.toLocaleString\(\)\}/g, "{formatCurrency(Math.ceil($1))}")
content = content.replace(/₦\$\{\(Math\.ceil\(([^)]+)\)\s*\/\s*100\)\.toLocaleString\(\)\}/g, "${formatCurrency(Math.ceil($1))}")
content = content.replace(/-₦\{\(([^/]+)\s*\/\s*100\)\.toLocaleString\(\)\}/g, "-{formatCurrency($1)}")

fs.writeFileSync(file, content)
console.log('Patched cart-fab.tsx')

const file2 = 'app/m/[slug]/item-card.tsx'
let content2 = fs.readFileSync(file2, 'utf8')
if (!content2.includes("import { formatCurrency }")) {
  content2 = content2.replace(
    `import { useCartStore } from '@/lib/store/cart'`,
    `import { useCartStore } from '@/lib/store/cart'\nimport { formatCurrency } from '@/lib/utils/currency'`
  )
}
content2 = content2.replace(/₦\{\(([^/]+)\s*\/\s*100\)\.toLocaleString\(\)\}/g, "{formatCurrency($1)}")
content2 = content2.replace(/₦\$\{\(([^/]+)\s*\/\s*100\)\.toLocaleString\(\)\}/g, "${formatCurrency($1)}")
fs.writeFileSync(file2, content2)
console.log('Patched item-card.tsx')

const file3 = 'app/pay/[order_id]/pay-client.tsx'
let content3 = fs.readFileSync(file3, 'utf8')
if (!content3.includes("import { formatCurrency }")) {
  content3 = content3.replace(
    `import { useRouter } from 'next/navigation'`,
    `import { useRouter } from 'next/navigation'\nimport { formatCurrency } from '@/lib/utils/currency'`
  )
}
content3 = content3.replace(/₦\$\{\(([^/]+)\s*\/\s*100\)\.toLocaleString\(\)\}/g, "${formatCurrency($1)}")
content3 = content3.replace(/₦\{\(([^/]+)\s*\/\s*100\)\.toLocaleString\(\)\}/g, "{formatCurrency($1)}")
fs.writeFileSync(file3, content3)
console.log('Patched pay-client.tsx')

const file4 = 'app/pay/[order_id]/page.tsx'
let content4 = fs.readFileSync(file4, 'utf8')
if (!content4.includes("import { formatCurrency }")) {
  content4 = content4.replace(
    `import { notFound } from 'next/navigation'`,
    `import { notFound } from 'next/navigation'\nimport { formatCurrency } from '@/lib/utils/currency'`
  )
}
content4 = content4.replace(/₦\{\(([^/]+)\s*\/\s*100\)\.toLocaleString\(\)\}/g, "{formatCurrency($1)}")
content4 = content4.replace(/- ₦\{\(\(([^)]+)\)\s*\|\|\s*0\)\s*\/\s*100\)\.toLocaleString\(\)\}/g, "- {formatCurrency($1 || 0)}")
fs.writeFileSync(file4, content4)
console.log('Patched pay page.tsx')
