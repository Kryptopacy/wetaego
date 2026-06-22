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
  
  if (content.includes("redirect('/login')") && !content.includes("isDemo")) {
    // Add import { cookies } from 'next/headers' if it's missing
    if (!content.includes("from 'next/headers'")) {
      content = content.replace("import { redirect }", "import { redirect }\nimport { cookies } from 'next/headers'")
      if (!content.includes("import { cookies }")) {
        content = "import { cookies } from 'next/headers'\n" + content
      }
    }

    // Replace the specific user check patterns
    content = content.replace(/if \(!userData\?\.user\) redirect\('\/login'\)/g, `const isDemo = !userData?.user && (await cookies()).get('demo_mode')?.value === '1'\n  if (!userData?.user && !isDemo) redirect('/login')\n  const user = userData?.user`)
    content = content.replace(/if \(!user\) redirect\('\/login'\)/g, `const isDemo = !user && (await cookies()).get('demo_mode')?.value === '1'\n  if (!user && !isDemo) redirect('/login')`)
    
    // Also block multi-line
    const blockRegex = /if \(!user\) {\s+redirect\('\/login'\)\s+}/g
    content = content.replace(blockRegex, `const isDemo = !user && (await cookies()).get('demo_mode')?.value === '1'\n  if (!user && !isDemo) {\n    redirect('/login')\n  }`)
    
    fs.writeFileSync(file, content)
    console.log('Patched', file)
  }
})
