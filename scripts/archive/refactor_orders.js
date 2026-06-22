const fs = require('fs')
const path = require('path')

// 1. Refactor dashboard orders page.tsx
const pageFile = path.join(__dirname, 'app/(dashboard)/dashboard/orders/page.tsx')
if (fs.existsSync(pageFile)) {
  let content = fs.readFileSync(pageFile, 'utf8')
  if (!content.includes('mapSupabaseOrderToUI')) {
    content = content.replace(
      `import { OrdersClient } from './orders-client'`,
      `import { OrdersClient } from './orders-client'\nimport { mapSupabaseOrderToUI } from '@/lib/utils/transformers'\nimport { UIOrder } from '@/lib/types/frontend'`
    )
    content = content.replace(
      /let orders: \(Database\['public'\]\['Tables'\]\['orders'\]\['Row'\] & \{ order_items\?: Database\['public'\]\['Tables'\]\['order_items'\]\['Row'\]\[\] \}\)\[\] = \[\]/,
      `let orders: UIOrder[] = []`
    )
    content = content.replace(
      /orders = ordersData \|\| \[\]/,
      `orders = (ordersData || []).map(mapSupabaseOrderToUI)`
    )
    fs.writeFileSync(pageFile, content)
    console.log('Refactored orders page.tsx')
  }
}

// 2. Refactor orders-client.tsx
const clientFile = path.join(__dirname, 'app/(dashboard)/dashboard/orders/orders-client.tsx')
if (fs.existsSync(clientFile)) {
  let content = fs.readFileSync(clientFile, 'utf8')
  if (!content.includes('mapSupabaseOrderToUI')) {
    content = content.replace(
      `import { StockManagementView } from './components/stock-management-view'`,
      `import { StockManagementView } from './components/stock-management-view'\nimport { mapSupabaseOrderToUI } from '@/lib/utils/transformers'\nimport { UIOrder } from '@/lib/types/frontend'`
    )
    content = content.replace(
      /type FullOrder = Database\['public'\]\['Tables'\]\['orders'\]\['Row'\] & \{ order_items\?: Database\['public'\]\['Tables'\]\['order_items'\]\['Row'\]\[\] \}\n/,
      ''
    )
    content = content.replace(/initialOrders: FullOrder\[\]/g, 'initialOrders: UIOrder[]')
    content = content.replace(/const fullData = data as FullOrder \| null/g, 'const fullData = data ? mapSupabaseOrderToUI(data) : null')
    content = content.replace(/type OrderPayload = \{ eventType: string, new: Database\['public'\]\['Tables'\]\['orders'\]\['Row'\] \}/g, 'type OrderPayload = { eventType: string, new: any }')
    fs.writeFileSync(clientFile, content)
    console.log('Refactored orders-client.tsx')
  }
}

// 3. Refactor active-orders-grid.tsx
const gridFile = path.join(__dirname, 'app/(dashboard)/dashboard/orders/components/active-orders-grid.tsx')
if (fs.existsSync(gridFile)) {
  let content = fs.readFileSync(gridFile, 'utf8')
  if (!content.includes('UIOrder')) {
    content = content.replace(
      `import { formatCurrency } from '@/lib/utils/currency'`,
      `import { formatCurrency } from '@/lib/utils/currency'\nimport { UIOrder } from '@/lib/types/frontend'`
    )
    content = content.replace(
      /type FullOrder = Database\['public'\]\['Tables'\]\['orders'\]\['Row'\] & \{ order_items\?: Database\['public'\]\['Tables'\]\['order_items'\]\['Row'\]\[\] \}\n/,
      ''
    )
    content = content.replace(/activeOrders: FullOrder\[\]/g, 'activeOrders: UIOrder[]')
    fs.writeFileSync(gridFile, content)
    console.log('Refactored active-orders-grid.tsx')
  }
}

// 4. Update the test active-orders-grid.test.tsx to use UIOrder
const testFile = path.join(__dirname, '__tests__/active-orders-grid.test.tsx')
if (fs.existsSync(testFile)) {
  let content = fs.readFileSync(testFile, 'utf8')
  if (!content.includes('UIOrder')) {
    content = content.replace(
      `import { formatCurrency } from '@/lib/utils/currency'`,
      `import { formatCurrency } from '@/lib/utils/currency'\nimport { UIOrder } from '@/lib/types/frontend'`
    )
    content = content.replace(
      /type FullOrder = Database\['public'\]\['Tables'\]\['orders'\]\['Row'\] & \{ order_items\?: Database\['public'\]\['Tables'\]\['order_items'\]\['Row'\]\[\] \}\n/,
      ''
    )
    content = content.replace(/as any as FullOrder\[\]/g, 'as unknown as UIOrder[]')
    fs.writeFileSync(testFile, content)
    console.log('Refactored active-orders-grid.test.tsx')
  }
}
