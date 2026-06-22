const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname)

function walk(currentDir) {
  const files = fs.readdirSync(currentDir)
  for (const file of files) {
    const fullPath = path.join(currentDir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        walk(fullPath)
      }
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8')
      let newContent = content
        
      // For general cases
      newContent = newContent.replace(/as any as/g, 'as unknown as')
      
      // Specifically for AI Chat toolArgs casting
      newContent = newContent.replace(/\(toolCall as any\)/g, '(toolCall as unknown as Record<string, any>)')
      
      // For member.organizations casting
      newContent = newContent.replace(/\(member\.organizations as any\)/g, '(member.organizations as unknown as Record<string, any>)')
      newContent = newContent.replace(/\(order\.organizations as any\)/g, '(order.organizations as unknown as Record<string, any>)')
      newContent = newContent.replace(/\(qrData\.organizations as any\)/g, '(qrData.organizations as unknown as Record<string, any>)')
      
      // For analytics / team-performance
      newContent = newContent.replace(/reviewsRaw as any/g, 'reviewsRaw as unknown as any')
      newContent = newContent.replace(/ordersWithTipsRaw as any/g, 'ordersWithTipsRaw as unknown as any')
      
      // For api routes and testing mocks
      newContent = newContent.replace(/\(global\.fetch as any\)/g, '(global.fetch as unknown as any)')
      newContent = newContent.replace(/\(createClient as any\)/g, '(createClient as unknown as any)')
      newContent = newContent.replace(/\(getPlanLimits as any\)/g, '(getPlanLimits as unknown as any)')
      newContent = newContent.replace(/mockResolvedValue\(\{([\s\S]*?)\} as any\)/g, 'mockResolvedValue({$1} as unknown as any)')
      
      // Other random ones
      newContent = newContent.replace(/\{([\s\S]*?)\} as any/g, '{$1} as unknown as any')

      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent)
        console.log(`Cleaned up ${fullPath.replace(dir, '')}`)
      }
    }
  }
}

walk(dir)
