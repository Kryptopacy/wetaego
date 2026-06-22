const fs = require('fs')
const path = require('path')

const files = [
  'dashboard/menu/page.tsx',
  'dashboard/page.tsx',
  'dashboard/pages/[pageId]/edit/page.tsx',
  'dashboard/pages/build/[businessType]/page.tsx',
  'dashboard/team-performance/page.tsx'
]

files.forEach(f => {
  const p = path.join(__dirname, 'app', '(dashboard)', f)
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8')
    content = content.replace(/user\.id/g, 'user!.id')
    content = content.replace(/userData\.user\.id/g, 'userData.user!.id')
    fs.writeFileSync(p, content)
  }
})
console.log('Fixed user nullability')
