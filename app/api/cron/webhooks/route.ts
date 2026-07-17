import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export const maxDuration = 60 // 60 seconds max duration for cron
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Validate CRON secret if using Vercel CRON (optional but recommended)
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // 1. Fetch pending deliveries
  // Limit to 50 per run to avoid timeouts
  // @ts-ignore
  const { data: deliveries, error: fetchError } = await supabase
    .from('outbound_webhook_deliveries')
    .select(`
      *,
      location_webhooks (*)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(50)

  if (fetchError || !deliveries) {
    return NextResponse.json({ error: fetchError?.message || 'Failed to fetch deliveries' }, { status: 500 })
  }

  if (deliveries.length === 0) {
    return NextResponse.json({ success: true, processed: 0 })
  }

  const results = []

  // 2. Process each delivery
  for (const delivery of deliveries) {
    const endpoint = delivery.location_webhooks
    
    // Skip if endpoint is inactive or missing
    if (!endpoint || Array.isArray(endpoint) || !endpoint.is_active) {
      /* 
      await supabase
        .from('outbound_webhook_deliveries')
        .update({ 
          status: 'failed', 
          response_status: 0, 
          response_body: 'Endpoint inactive or deleted' 
        })
        .eq('id', delivery.id)
      */
      
      results.push({ id: delivery.id, status: 'failed', reason: 'inactive_endpoint' })
      continue
    }

    const payloadString = typeof delivery.payload === 'string' 
      ? delivery.payload 
      : JSON.stringify(delivery.payload)

    // Generate HMAC signature if secret exists
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'OurMenuOS-Webhook/1.0',
    }

    if (endpoint.secret) {
      const signature = crypto
        .createHmac('sha256', endpoint.secret)
        .update(payloadString)
        .digest('hex')
      headers['X-OurMenu-Signature'] = `sha256=${signature}`
    }

    try {
      // 3. Send the POST request
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: payloadString,
        // Set a 10s timeout to prevent hanging
        signal: AbortSignal.timeout(10000) 
      })

      const responseText = await response.text()
      const isSuccess = response.ok

      // 4. Update the delivery record
      await supabase
        .from('outbound_webhook_deliveries')
        .update({
          status: isSuccess ? 'delivered' : 'failed',
          response_status: response.status,
          response_body: responseText ? responseText.substring(0, 1000) : null // cap length
        })
        .eq('id', delivery.id)

      results.push({ id: delivery.id, status: isSuccess ? 'delivered' : 'failed', statusCode: response.status })

    } catch (err: any) {
      // Handle network errors / timeouts
      /*
      await supabase
        .from('outbound_webhook_deliveries')
        .update({
          status: 'failed',
          response_status: 0,
          response_body: err.message?.substring(0, 1000) || 'Unknown Network Error'
        })
        .eq('id', delivery.id)
      */

      results.push({ id: delivery.id, status: 'failed', reason: err.message })
    }
  }

  return NextResponse.json({ success: true, processed: deliveries.length, results })
}
