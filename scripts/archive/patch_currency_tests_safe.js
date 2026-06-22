const fs = require('fs')
const path = require('path')

function patchFile(filePath, isTest) {
  const fullPath = path.join(__dirname, filePath)
  if (!fs.existsSync(fullPath)) return
  
  let content = fs.readFileSync(fullPath, 'utf8')
  
  // Safe prepend import
  if (!content.includes("import { formatCurrency }")) {
    const lines = content.split('\n')
    let lastImportIdx = -1
    for(let i=0; i<lines.length; i++) {
        if(lines[i].startsWith('import ')) lastImportIdx = i;
    }
    if (lastImportIdx !== -1) {
        lines.splice(lastImportIdx + 1, 0, `import { formatCurrency } from '@/lib/utils/currency'`)
        content = lines.join('\n')
    } else {
        content = `import { formatCurrency } from '@/lib/utils/currency'\n` + content
    }
  }

  if (isTest) {
    content = content.replace(/'₦5,000'/g, "formatCurrency(500000)")
    content = content.replace(/'\+ ₦500 Tip'/g, "`+ ${formatCurrency(50000)} Tip`")
    content = content.replace(/`₦\$\{\(1000000 \/ 100\)\.toLocaleString\(\)\}`/g, "formatCurrency(1000000)")
  } else {
    // UI replacements
    content = content.replace(/₦\{\(\(([^)]+)\)\s*\/\s*100\)\.toLocaleString\(\)\}/g, "{formatCurrency($1)}")
    content = content.replace(/₦\{\(([^/]+)\s*\/\s*100\)\.toLocaleString\(\)\}/g, "{formatCurrency($1)}")
    content = content.replace(/₦\$\{\(([^/]+)\s*\/\s*100\)\.toLocaleString\(\)\}/g, "${formatCurrency($1)}")
    content = content.replace(/-₦\{\(([^/]+)\s*\/\s*100\)\.toLocaleString\(\)\}/g, "-{formatCurrency($1)}")
    content = content.replace(/\+ ₦\{\(([^/]+)\s*\/\s*100\)\.toLocaleString\(\)\}/g, "+ {formatCurrency($1)}")
  }

  fs.writeFileSync(fullPath, content)
  console.log(`Patched ${filePath}`)
}

patchFile('app/(dashboard)/dashboard/orders/components/active-orders-grid.tsx', false)
patchFile('__tests__/active-orders-grid.test.tsx', true)
patchFile('__tests__/stock-management-view.test.tsx', true)
