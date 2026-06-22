const fs = require('fs')
const path = require('path')

function walk(dir) {
  let results = []
  const list = fs.readdirSync(dir)
  list.forEach(file => {
    file = path.join(dir, file)
    const stat = fs.statSync(file)
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file))
    } else if (file.endsWith('page.tsx')) {
      results.push(file)
    }
  })
  return results
}

const dir = path.join(__dirname, 'apps', 'web', 'app', '(dashboard)', 'dashboard')
const files = walk(dir)

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8')
  let changed = false
  if (content.includes("import { redirect }\r\nfrom 'next/navigation'")) {
    content = content.replace("import { redirect }\r\nfrom 'next/navigation'", "import { redirect } from 'next/navigation'")
    changed = true
  }
  if (content.includes("import { redirect }\nfrom 'next/navigation'")) {
    content = content.replace("import { redirect }\nfrom 'next/navigation'", "import { redirect } from 'next/navigation'")
    changed = true
  }
  if (content.includes("import { cookies } from 'next/headers'\r\nfrom 'next/navigation'")) {
    content = content.replace("import { cookies } from 'next/headers'\r\nfrom 'next/navigation'", "import { cookies } from 'next/headers'")
    changed = true
  }
  if (content.includes("import { cookies } from 'next/headers'\nfrom 'next/navigation'")) {
    content = content.replace("import { cookies } from 'next/headers'\nfrom 'next/navigation'", "import { cookies } from 'next/headers'")
    changed = true
  }
  
  if (changed) {
    fs.writeFileSync(file, content)
    console.log('Fixed', file)
  }
})
