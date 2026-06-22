const fs = require('fs')
const path = require('path')

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false

  if (content.includes('as undefined')) {
    content = content.replace(/as undefined/g, 'as never')
    modified = true
  }

  if (content.includes('as unknown')) {
    content = content.replace(/as unknown\[\]/g, 'as any[]')
    content = content.replace(/as unknown\)/g, 'as any)')
    content = content.replace(/as unknown}/g, 'as any}')
    content = content.replace(/as unknown,/g, 'as any,')
    content = content.replace(/as unknown\n/g, 'as any\n')
    // Generic as unknown back to as any
    // Except where it might be legitimate as unknown? Our menu didn't seem to have legitimate `as unknown` except maybe one or two. I'll just replace 'as unknown' with 'as any'.
    content = content.replace(/as unknown/g, 'as any')
    modified = true
  }

  if (modified) {
    fs.writeFileSync(filePath, content)
    console.log('Reverted', filePath)
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    if (file === 'node_modules' || file === '.next' || file === 'dist') continue
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      walk(fullPath)
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      processFile(fullPath)
    }
  }
}

walk('./app')
walk('./lib')
walk('./__tests__')
