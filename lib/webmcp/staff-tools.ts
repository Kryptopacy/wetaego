/**
 * WETAEGO Staff & Operations WebMCP Tool Suite
 * 
 * Provides authorized operational tools for merchant floor staff, kitchen display systems (KDS),
 * inventory managers, and franchise administrators.
 */

import { WebMCPTool } from './types'

export interface StaffOperationsContext {
  locationId?: string
  locationName?: string
  currency?: string
}

export const DEMO_STAFF_ORDERS = [
  {
    orderId: 'ord_live_101',
    status: 'preparing',
    fulfillment: 'dine_in',
    tableIdentifier: 'Table 4',
    customer: { name: 'Alex Rivera', phone: '+12025550144' },
    totalMinor: 4800,
    currency: 'USD',
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    items: [
      { itemId: 'item_vegan_avocado', name: 'Avocado Tartine & Microgreens', quantity: 2, priceMinor: 2200 },
      { itemId: 'item_spa_swedish', name: '60-Min Swedish Massage', quantity: 1, priceMinor: 6500 },
    ],
  },
  {
    orderId: 'ord_live_102',
    status: 'pending',
    fulfillment: 'pickup',
    tableIdentifier: 'Counter',
    customer: { name: 'Maya Chen', phone: '+12025550188' },
    totalMinor: 8500,
    currency: 'USD',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    items: [
      { itemId: 'item_fashion_blazer', name: 'Structured Linen Minimalist Blazer', quantity: 1, priceMinor: 8500 },
    ],
  },
]

export const DEMO_STAFF_TABLES = [
  { tableIdentifier: 'Table 1', status: 'vacant', activeTabTotalMinor: 0 },
  { tableIdentifier: 'Table 2', status: 'occupied', activeTabTotalMinor: 3500 },
  { tableIdentifier: 'Table 3', status: 'reserved', activeTabTotalMinor: 0 },
  { tableIdentifier: 'Table 4', status: 'occupied', activeTabTotalMinor: 4800 },
  { tableIdentifier: 'Table 5', status: 'service_requested', activeTabTotalMinor: 1200 },
]

export function createStaffWebMCPTools(ctx: StaffOperationsContext = {}): WebMCPTool[] {
  const locationName = ctx.locationName || 'Pacy Multi-Concept Flagship'
  const currency = ctx.currency || 'USD'

  return [
    // 1. get_active_orders
    {
      name: 'get_active_orders',
      scope: 'staff',
      permission: 'staff/orders-read',
      description: 'Retrieve all live, active customer orders across a venue or franchise branch with real-time status and item line items.',
      inputSchema: {
        type: 'object',
        properties: {
          locationId: { type: 'string', description: 'Target location UUID.' },
          status: {
            type: 'string',
            enum: ['pending', 'paid', 'preparing', 'out_for_delivery', 'completed'],
            description: 'Filter orders by fulfillment status.',
          },
        },
        additionalProperties: false,
      },
      outputSchema: {
        type: 'object',
        required: ['orders', 'totalActive', 'venue'],
        properties: {
          venue: { type: 'string' },
          totalActive: { type: 'integer' },
          orders: {
            type: 'array',
            items: {
              type: 'object',
              required: ['orderId', 'status', 'totalMinor', 'currency'],
              properties: {
                orderId: { type: 'string' },
                status: { type: 'string' },
                fulfillment: { type: 'string' },
                tableIdentifier: { type: 'string' },
                totalMinor: { type: 'integer' },
                currency: { type: 'string' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
      execute: async (input?: { status?: string }) => {
        let list = [...DEMO_STAFF_ORDERS]
        if (input?.status) {
          list = list.filter(o => o.status === input.status)
        }
        return {
          venue: locationName,
          totalActive: list.length,
          orders: list,
          _hint: 'Use update_order_status to transition order states.',
        }
      },
    },

    // 2. get_order
    {
      name: 'get_order',
      scope: 'staff',
      permission: 'staff/orders-read',
      description: 'Retrieve authoritative details for a specific customer order including line items, special instructions, and customer contacts.',
      inputSchema: {
        type: 'object',
        required: ['orderId'],
        properties: {
          orderId: { type: 'string', minLength: 1, description: 'The unique order ID to inspect.' },
        },
        additionalProperties: false,
      },
      outputSchema: {
        type: 'object',
        required: ['orderId', 'status', 'totalMinor', 'currency'],
        properties: {
          orderId: { type: 'string' },
          status: { type: 'string' },
          fulfillment: { type: 'string' },
          items: { type: 'array' },
          totalMinor: { type: 'integer' },
          currency: { type: 'string' },
          customer: { type: 'object' },
        },
      },
      execute: async (input: { orderId: string }) => {
        const order = DEMO_STAFF_ORDERS.find(o => o.orderId === input.orderId) || DEMO_STAFF_ORDERS[0]
        return {
          ...order,
          orderId: input.orderId || order.orderId,
        }
      },
    },

    // 3. update_order_status
    {
      name: 'update_order_status',
      scope: 'staff',
      permission: 'staff/orders-write',
      confirmation: 'required_for_cancellation',
      description: 'Change the operational or kitchen status of an active order (e.g. advance from preparing to completed, or cancel).',
      inputSchema: {
        type: 'object',
        required: ['orderId', 'status'],
        properties: {
          orderId: { type: 'string', minLength: 1, description: 'Target order ID.' },
          status: {
            type: 'string',
            enum: ['pending', 'paid', 'preparing', 'completed', 'cancelled', 'out_for_delivery', 'refunded', 'voided'],
            description: 'New operational status.',
          },
          reason: { type: 'string', maxLength: 300, description: 'Required reason if status is cancelled or refunded.' },
        },
        additionalProperties: false,
      },
      outputSchema: {
        type: 'object',
        required: ['success', 'orderId', 'status'],
        properties: {
          success: { type: 'boolean' },
          orderId: { type: 'string' },
          status: { type: 'string' },
          message: { type: 'string' },
        },
      },
      execute: async (input: { orderId: string; status: string; reason?: string }) => {
        const order = DEMO_STAFF_ORDERS.find(o => o.orderId === input.orderId)
        if (order) {
          order.status = input.status
        }
        return {
          success: true,
          orderId: input.orderId,
          status: input.status,
          message: `Order ${input.orderId} status updated to "${input.status}". Staff and customer notified.`,
        }
      },
    },

    // 4. mark_item_unavailable (The 86 tool)
    {
      name: 'mark_item_unavailable',
      scope: 'staff',
      permission: 'staff/catalog-write',
      description: 'Instantly toggle a menu dish, retail SKU, or appointment slot to 86 / unavailable across all digital storefronts and KDS screens.',
      inputSchema: {
        type: 'object',
        required: ['itemId', 'isAvailable'],
        properties: {
          itemId: { type: 'string', minLength: 1, description: 'Target catalog item ID or SKU.' },
          isAvailable: { type: 'boolean', description: 'False = 86ed / sold out; True = back in stock.' },
          reason: { type: 'string', maxLength: 300, description: 'Operational reason for toggling stock status.' },
        },
        additionalProperties: false,
      },
      outputSchema: {
        type: 'object',
        required: ['success', 'itemId', 'isAvailable'],
        properties: {
          success: { type: 'boolean' },
          itemId: { type: 'string' },
          isAvailable: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
      execute: async (input: { itemId: string; isAvailable: boolean; reason?: string }) => {
        return {
          success: true,
          itemId: input.itemId,
          isAvailable: input.isAvailable,
          message: input.isAvailable
            ? `Item ${input.itemId} is now restored to active stock across all storefronts.`
            : `Item ${input.itemId} has been 86ed (marked sold out) across all storefronts.${input.reason ? ` Reason: ${input.reason}` : ''}`,
        }
      },
    },

    // 5. get_table_status
    {
      name: 'get_table_status',
      scope: 'staff',
      permission: 'staff/floor-read',
      description: 'Inspect live floor occupancy, active table tabs, and unfulfilled service call requests across venue seating zones.',
      inputSchema: {
        type: 'object',
        properties: {
          locationId: { type: 'string', description: 'Target location UUID.' },
        },
        additionalProperties: false,
      },
      outputSchema: {
        type: 'object',
        required: ['tables', 'totalOccupied', 'totalVacant'],
        properties: {
          totalOccupied: { type: 'integer' },
          totalVacant: { type: 'integer' },
          tables: {
            type: 'array',
            items: {
              type: 'object',
              required: ['tableIdentifier', 'status'],
              properties: {
                tableIdentifier: { type: 'string' },
                status: { type: 'string', enum: ['vacant', 'occupied', 'reserved', 'service_requested'] },
                activeTabTotalMinor: { type: 'integer' },
              },
            },
          },
        },
      },
      execute: async () => {
        const occupied = DEMO_STAFF_TABLES.filter(t => t.status === 'occupied' || t.status === 'service_requested').length
        const vacant = DEMO_STAFF_TABLES.filter(t => t.status === 'vacant').length
        return {
          totalOccupied: occupied,
          totalVacant: vacant,
          tables: DEMO_STAFF_TABLES,
        }
      },
    },

    // 6. get_daily_sales
    {
      name: 'get_daily_sales',
      scope: 'staff',
      permission: 'staff/analytics-read',
      description: 'Retrieve aggregated gross sales revenue, order volume, average ticket size, and top-selling concepts for the active business day.',
      inputSchema: {
        type: 'object',
        properties: {
          locationId: { type: 'string', description: 'Target location UUID.' },
          date: { type: 'string', description: 'ISO date string (YYYY-MM-DD), defaults to today.' },
        },
        additionalProperties: false,
      },
      outputSchema: {
        type: 'object',
        required: ['date', 'grossRevenueMinor', 'orderCount', 'averageTicketMinor', 'currency'],
        properties: {
          date: { type: 'string' },
          grossRevenueMinor: { type: 'integer' },
          orderCount: { type: 'integer' },
          averageTicketMinor: { type: 'integer' },
          currency: { type: 'string' },
          topConcept: { type: 'string' },
        },
      },
      execute: async (input?: { date?: string }) => {
        return {
          date: input?.date || new Date().toISOString().split('T')[0],
          grossRevenueMinor: 384500,
          orderCount: 42,
          averageTicketMinor: 9154,
          currency,
          topConcept: 'Pacy Grills & Lounge',
        }
      },
    },
  ]
}
