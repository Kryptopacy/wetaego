const fs = require('fs')

const path = 'app/(dashboard)/dashboard/page.tsx'
let content = fs.readFileSync(path, 'utf8')

const target = `<p className="text-zinc-500 text-sm mb-1">Good morning, {orgName} 👋</p>`
const replacement = `
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* === WELCOME HEADER === */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-zinc-500 text-sm mb-1">{greeting}, {orgName} 👋</p>`

content = content.replace(/return \([\s\S]+?<p className="text-zinc-500 text-sm mb-1">Good morning, \{orgName\} 👋<\/p>/m, replacement.trim())

fs.writeFileSync(path, content)
console.log('Fixed greeting')
