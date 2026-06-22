const fs = require('fs')
const path = require('path')

const filesToFix = [
  'emails/daily-report-email.tsx',
  'emails/fallback-email.tsx',
  'emails/receipt-email.tsx'
]

filesToFix.forEach(f => {
  const fullPath = path.join(__dirname, f)
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8')
    content = content.replace(/\{formatCurrency\(\$1\)\}/g, "{formatCurrency(amountMinor || totalAmountMinor || 0)}")
    
    // Receipt has `item.priceMinor`
    if (f.includes('receipt-email.tsx')) {
      content = content.replace(/\{formatCurrency\(amountMinor \|\| totalAmountMinor \|\| 0\)\}/, "{formatCurrency(totalAmountMinor)}")
      content = content.replace(/\{formatCurrency\(amountMinor \|\| totalAmountMinor \|\| 0\)\}/, "{formatCurrency(item.priceMinor)}")
    } else if (f.includes('fallback-email.tsx')) {
      content = content.replace(/\{formatCurrency\(amountMinor \|\| totalAmountMinor \|\| 0\)\}/, "{formatCurrency(amountMinor)}")
    } else if (f.includes('daily-report-email.tsx')) {
      content = content.replace(/\{formatCurrency\(amountMinor \|\| totalAmountMinor \|\| 0\)\}/, "{formatCurrency(totalRevenueMinor)}")
    }
    
    fs.writeFileSync(fullPath, content)
    console.log(`Fixed $1 in ${f}`)
  }
})
