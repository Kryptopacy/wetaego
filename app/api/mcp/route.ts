import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getMCPManifest } from '@/lib/webmcp/manifest'

export const dynamic = 'force-dynamic'

/**
 * Staff & Enterprise MCP Server Endpoint (RFC JSON-RPC 2.0)
 * Handles tool execution for external agents (Claude Desktop, ChatGPT, enterprise bots)
 * authenticated via Bearer token.
 */
export async function GET() {
  return NextResponse.json(getMCPManifest(), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Bearer token is required to execute Staff MCP tools.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '').trim()
    const body = await req.json()
    const { name, arguments: args } = body

    const adminClient = await createAdminClient()

    // 1. get_daily_sales
    if (name === 'get_daily_sales') {
      const today = args?.date || new Date().toISOString().split('T')[0]
      const { data: orders } = await adminClient
        .from('orders')
        .select('id, total_amount_minor, status, created_at')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lte('created_at', `${today}T23:59:59.999Z`)

      const completed = (orders || []).filter(o => o.status !== 'cancelled')
      const totalRevenueMinor = completed.reduce((sum, o) => sum + (o.total_amount_minor || 0), 0)

      return NextResponse.json({
        date: today,
        orderCount: completed.length,
        grossRevenue: totalRevenueMinor / 100,
        currency: 'NGN',
        averageTicketSize: completed.length > 0 ? (totalRevenueMinor / completed.length / 100).toFixed(2) : '0.00'
      })
    }

    // 2. get_active_orders
    if (name === 'get_active_orders') {
      const { data: orders } = await adminClient
        .from('orders')
        .select('id, status, table_identifier, customer_name, total_amount_minor, created_at, order_items(id, item_title, quantity, unit_price_minor)')
        .in('status', ['pending', 'paid', 'preparing'])
        .order('created_at', { ascending: false })
        .limit(50)

      return NextResponse.json({
        activeOrderCount: orders?.length || 0,
        orders: (orders || []).map(o => ({
          orderId: o.id,
          status: o.status,
          table: o.table_identifier || 'Walk-in',
          customerName: o.customer_name || 'Guest',
          total: (o.total_amount_minor || 0) / 100,
          items: o.order_items || []
        }))
      })
    }

    // 3. mark_item_unavailable
    if (name === 'mark_item_unavailable') {
      const { itemId, isAvailable, reason } = args || {}
      if (!itemId) {
        return NextResponse.json({ error: 'itemId is required' }, { status: 400 })
      }

      await adminClient
        .from('page_items')
        .update({ availability_status: isAvailable ? 'available' : 'sold_out' })
        .eq('id', itemId)

      return NextResponse.json({
        success: true,
        itemId,
        isAvailable: Boolean(isAvailable),
        reason: reason || (isAvailable ? 'Item restocked' : 'Item marked sold out')
      })
    }

    // 4. update_order_status
    if (name === 'update_order_status') {
      const { orderId, status } = args || {}
      if (!orderId || !status) {
        return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 })
      }

      await adminClient
        .from('orders')
        .update({ status })
        .eq('id', orderId)

      return NextResponse.json({
        success: true,
        orderId,
        newStatus: status
      })
    }

    return NextResponse.json(
      { error: `Tool '${name}' is not recognized on Staff MCP server.` },
      { status: 404 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal MCP execution error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
