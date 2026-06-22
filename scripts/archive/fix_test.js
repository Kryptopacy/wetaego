const fs = require('fs')
const path = require('path')

const testFile = path.join(__dirname, '__tests__/active-orders-grid.test.tsx')
if (fs.existsSync(testFile)) {
  let content = fs.readFileSync(testFile, 'utf8')
  content = content.replace(/as unknown as FullOrder\[\]/g, 'as unknown as UIOrder[]')
  content = content.replace(/as any as FullOrder\[\]/g, 'as unknown as UIOrder[]')
  content = content.replace(/type FullOrder = Database\['public'\]\['Tables'\]\['orders'\]\['Row'\] & \{ order_items\?: Database\['public'\]\['Tables'\]\['order_items'\]\['Row'\]\[\] \}\n/g, '')
  fs.writeFileSync(testFile, content)
  console.log('Fixed test file')
}
