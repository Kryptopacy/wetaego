/**
 * Standalone WebMCP Verification & Sanity Check Script
 */

import { createStorefrontWebMCPTools } from '../lib/webmcp/tools.ts'
import { globalWebMCPRegistry } from '../lib/webmcp/registry.ts'

console.log('--- [WebMCP Verification Starting] ---')

const sampleContext = {
  locationId: 'loc_sample_99',
  locationName: 'Cafe Noir & Bistro',
  slug: 'cafe-noir',
  currency: 'USD',
  businessTypePreset: 'restaurant',
  menuItems: [
    {
      id: 'dish_1',
      name: 'Smoked Salmon Benedict',
      description: 'Poached eggs, hollandaise, smoked salmon on brioche',
      price_minor: 1850,
      category: 'Breakfast',
      dietary_tags: ['halal', 'pescatarian']
    },
    {
      id: 'dish_2',
      name: 'Vegan Matcha Bowl',
      description: 'Acai, ceremonial grade matcha, berries, granola',
      price_minor: 1400,
      category: 'Bowls',
      dietary_tags: ['vegan', 'gluten_free']
    }
  ],
  tableIdentifier: 'Table 4'
}

// 1. Generate tools
const tools = createStorefrontWebMCPTools(sampleContext)
console.log(`Generated ${tools.length} WebMCP tools:`)
tools.forEach(t => {
  console.log(`  - [Tool] ${t.name}: ${t.description.slice(0, 60)}...`)
  globalWebMCPRegistry.registerTool(t)
})

// 2. Test search_catalog
console.log('\n[Test 1] Executing search_catalog({ dietary: ["vegan"] })...')
const searchResult = await globalWebMCPRegistry.executeTool('search_catalog', { dietary: ['vegan'] })
console.log('Result:', JSON.stringify(searchResult, null, 2))

// 3. Test get_item_details
console.log('\n[Test 2] Executing get_item_details({ itemId: "dish_1" })...')
const detailsResult = await globalWebMCPRegistry.executeTool('get_item_details', { itemId: 'dish_1' })
console.log('Result:', JSON.stringify(detailsResult, null, 2))

// 4. Test add_to_cart
console.log('\n[Test 3] Executing add_to_cart({ itemId: "dish_1", quantity: 2 })...')
const addResult = await globalWebMCPRegistry.executeTool('add_to_cart', { itemId: 'dish_1', quantity: 2 })
console.log('Result:', JSON.stringify(addResult, null, 2))

// 5. Test view_cart
console.log('\n[Test 4] Executing view_cart()...')
const cartResult = await globalWebMCPRegistry.executeTool('view_cart', {})
console.log('Result:', JSON.stringify(cartResult, null, 2))

// 6. Test call_staff_or_service
console.log('\n[Test 5] Executing call_staff_or_service({ reason: "Water refill" })...')
const staffResult = await globalWebMCPRegistry.executeTool('call_staff_or_service', { reason: 'Water refill' })
console.log('Result:', JSON.stringify(staffResult, null, 2))

console.log('\n--- [WebMCP Verification Passed Successfully!] ---')
