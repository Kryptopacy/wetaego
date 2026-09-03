import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getMCPManifest } from '@/lib/webmcp/manifest'
import { authenticateApiRequest } from '@/lib/auth/api-key'

import { checkRateLimit } from '@/lib/upstash'

export const dynamic = 'force-dynamic'

/**
 * Staff & Enterprise MCP Server Endpoint (RFC JSON-RPC 2.0 & SSE Transport)
 * Handles tool execution and streaming event transport for external agents (Claude Desktop, Cursor, ChatGPT).
 */
export async function GET(req: NextRequest) {
  const isSSE = req.headers.get('accept')?.includes('text/event-stream') || req.nextUrl.searchParams.get('transport') === 'sse'

  if (isSSE) {
    const encoder = new TextEncoder()
    const manifest = getMCPManifest()
    const customReadable = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`event: endpoint\ndata: ${JSON.stringify({ endpoint: '/api/mcp' })}\n\n`))
        controller.enqueue(encoder.encode(`event: manifest\ndata: ${JSON.stringify(manifest)}\n\n`))
        // Keep-alive heartbeat comment
        const interval = setInterval(() => {
          controller.enqueue(encoder.encode(`: ping\n\n`))
        }, 15000)

        req.signal.addEventListener('abort', () => {
          clearInterval(interval)
          controller.close()
        })
      }
    })

    return new Response(customReadable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }

  return NextResponse.json(getMCPManifest(), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

export async function POST(req: NextRequest) {
  try {
    // Upstash Rate Limiting: 60 requests per minute
    const rateLimit = await checkRateLimit('mcp_api')
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded: Maximum 60 Staff MCP requests per minute.' },
        { status: 429 }
      )
    }

    // Validate the Bearer token against api_keys (SHA-256 hash lookup).
    const auth = await authenticateApiRequest(req)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { adminClient, apiKey } = auth

    const body = await req.json()
    const { name, arguments: args } = body

    // 1. get_daily_sales
    if (name === 'get_daily_sales') {
      const today = args?.date || new Date().toISOString().split('T')[0]
      const { data: orders } = await adminClient
        .from('orders')
        .select('id, total_amount_minor, status, created_at, organization_id')
        .eq('organization_id', apiKey.organization_id)
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
        .eq('organization_id', apiKey.organization_id)
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

      // Ownership check: only allow the update if the item's page belongs to the key's organization.
      const { data: item } = await adminClient
        .from('page_items')
        .select('id, page_id, location_pages!inner(id, location_id, locations!inner(organization_id))')
        .eq('id', itemId)
        .maybeSingle()

      const itemOrgId = (item as unknown as { location_pages?: { locations?: { organization_id?: string } } })?.location_pages?.locations?.organization_id
      if (!item || itemOrgId !== apiKey.organization_id) {
        return NextResponse.json({ error: 'Item not found or not accessible' }, { status: 404 })
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

      const { data: order } = await adminClient
        .from('orders')
        .select('id, organization_id')
        .eq('id', orderId)
        .maybeSingle()

      if (!order || order.organization_id !== apiKey.organization_id) {
        return NextResponse.json({ error: 'Order not found or not accessible' }, { status: 404 })
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
