const fs = require('fs')
const path = require('path')

const filesToPatch = [
  'emails/receipt-email.tsx',
  'emails/fallback-email.tsx',
  'emails/daily-report-email.tsx',
]

function patchFile(filePath) {
  const fullPath = path.join(__dirname, filePath)
  if (!fs.existsSync(fullPath)) return

  let content = fs.readFileSync(fullPath, 'utf8')

  if (!content.includes("import { formatCurrency }")) {
    content = content.replace(
      `import * as React from 'react';`,
      `import * as React from 'react';\nimport { formatCurrency } from '@/lib/utils/currency';`
    )
  }

  // Receipt
  content = content.replace(/`₦\$\{\([^/]+\s*\/\s*100\)\.toLocaleString\(\)\}`/g, "formatCurrency($1)")
  content = content.replace(/₦\{\([^/]+\s*\/\s*100\)\.toLocaleString\(\)\}/g, "{formatCurrency($1)}")

  // Fallback
  content = content.replace(/`₦\$\{\(amountMinor\s*\/\s*100\)\.toLocaleString\(\)\}`/g, "formatCurrency(amountMinor)")
  
  // Daily Report
  content = content.replace(/`₦\$\{\(totalRevenueMinor\s*\/\s*100\)\.toLocaleString\(\)\}`/g, "formatCurrency(totalRevenueMinor)")

  fs.writeFileSync(fullPath, content)
  console.log(`Patched ${filePath}`)
}

filesToPatch.forEach(patchFile)
