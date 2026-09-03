import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { authenticateApiRequest } from '@/lib/auth/api-key'
import { checkRateLimit } from '@/lib/upstash'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const PosIngestSchema = z.object({
  locationId: z.string().uuid('Invalid location ID'),
  externalOrderId: z.string().min(1, 'External order ID is required'),
  source: z.string().default('legacy_pos'),
  channel: z.enum(['in_store_counter', 'kiosk', 'drive_thru']).default('in_store_counter'),
  terminalId: z.string().optional(),
  cashierName: z.string().optional(),
  currency: z.string().default('USD'),
  totalMinor: z.number().int().positive('Total amount must be positive'),
  taxMinor: z.number().int().default(0),
  paymentMethod: z.string().default('pos_terminal'),
  items: z.array(z.object({
    name: z.string(),
    sku: z.string().optional(),
    quantity: z.number().int().positive(),
    priceMinor: z.number().int().nonnegative(),
    category: z.string().optional()
  })).optional(),
  customer: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    name: z.string().optional()
  }).optional()
})

export async function POST(req: NextRequest) {
  try {
    // Validate the Bearer token against api_keys (SHA-256 hash lookup).
    const auth = await authenticateApiRequest(req)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { adminClient, apiKey } = auth

    const rateLimit = await checkRateLimit('inbound_api', apiKey.id)
    if (rateLimit && !rateLimit.success) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 })
    }

    const body = await req.json()
    const parsed = PosIngestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload structure', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // 1. Verify location exists AND belongs to the API key's organization
    const { data: location, error: locErr } = await adminClient
      .from('locations')
      .select('id, organization_id, name')
      .eq('id', data.locationId)
      .eq('organization_id', apiKey.organization_id)
      .maybeSingle()

    if (locErr || !location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // 2. Insert order with channel attribution metadata
    const { data: order, error: orderErr } = await adminClient
      .from('orders')
      .insert({
        location_id: data.locationId,
        organization_id: location.organization_id,
        payment_reference: `EXT-${data.externalOrderId}`,
        status: 'completed',
        subtotal_minor: Math.max(0, data.totalMinor - data.taxMinor),
        total_amount_minor: data.totalMinor,
        tax_total_minor: data.taxMinor,
        fulfillment_type: 'dine_in',
        customer_name: data.customer?.name || null,
        customer_phone: data.customer?.phone || null,
        customer_email: data.customer?.email || null,
        customer_note: `Ingested via ${data.source} (Terminal: ${data.terminalId || 'Main'}, Cashier: ${data.cashierName || 'Staff'})`,
        metadata: {
          source: data.source,
          channel: data.channel,
          terminalId: data.terminalId,
          cashierName: data.cashierName,
          items: data.items,
          ingested_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (orderErr) {
      throw orderErr
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction ingested and attributed successfully',
      orderId: order.id,
      channel: data.channel,
      source: data.source,
      totalMinor: data.totalMinor
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Telemetry ingestion failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
