const fs = require('fs')
const path = require('path')

const files = {
  'emails/daily-report-email.tsx': 'totalRevenueMinor',
  'emails/fallback-email.tsx': 'amountMinor',
  'emails/receipt-email.tsx': 'totalAmountMinor'
}

for (const [file, variable] of Object.entries(files)) {
  const fullPath = path.join(__dirname, file)
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8')
    content = content.replace(/formatCurrency\(\$1\)/g, `formatCurrency(${variable})`)
    
    // Receipt has a second one for item.priceMinor
    if (file.includes('receipt-email.tsx')) {
      // The second occurrence is usually for item.priceMinor
      // It is usually within `{items.map((item, index) =>`
      content = content.replace(/formatCurrency\(totalAmountMinor\)([\s\S]*?\{items\.map[\s\S]*?)formatCurrency\(totalAmountMinor\)/, "formatCurrency(totalAmountMinor)$1formatCurrency(item.priceMinor)")
    }
    
    fs.writeFileSync(fullPath, content)
    console.log(`Fixed ${file}`)
  }
}
