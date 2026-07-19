import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export const maxDuration = 60 // 60 seconds max duration for cron
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Validate CRON secret or Vercel cron header
  const authHeader = request.headers.get('authorization')
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  if (process.env.CRON_SECRET) {
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !isVercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else if (!isVercelCron && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized - CRON_SECRET not configured' }, { status: 401 })
  }

  const supabase = await createAdminClient()
  const nowIso = new Date().toISOString()

  // 1. Fetch pending and due retrying deliveries
  // Limit to 50 per run to avoid timeouts
  const { data: deliveries, error: fetchError } = await supabase
    .from('outbound_webhook_deliveries')
    .select(`
      *,
      location_webhooks (*)
    `)
    .in('status', ['pending', 'retrying'])
    .or(`next_retry_at.is.null,next_retry_at.lte.${nowIso}`)
    .order('created_at', { ascending: true })
    .limit(50)

  if (fetchError || !deliveries) {
    return NextResponse.json({ error: fetchError?.message || 'Failed to fetch deliveries' }, { status: 500 })
  }

  if (deliveries.length === 0) {
    return NextResponse.json({ success: true, processed: 0 })
  }

  const results = []
  const MAX_ATTEMPTS = 5

  // 2. Process each delivery
  for (const delivery of deliveries) {
    const endpoint = delivery.location_webhooks
    const nextAttemptCount = (delivery.attempt_count || 0) + 1
    
    // Skip if endpoint is inactive or missing
    if (!endpoint || Array.isArray(endpoint) || !endpoint.is_active) {
      await supabase
        .from('outbound_webhook_deliveries')
        .update({ 
          status: 'failed', 
          response_status: 0, 
          attempt_count: nextAttemptCount,
          error_message: 'Endpoint inactive or deleted' 
        })
        .eq('id', delivery.id)
      
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

      if (isSuccess) {
        await supabase
          .from('outbound_webhook_deliveries')
          .update({
            status: 'delivered',
            response_status: response.status,
            attempt_count: nextAttemptCount,
            error_message: null
          })
          .eq('id', delivery.id)

        results.push({ id: delivery.id, status: 'delivered', statusCode: response.status })
      } else {
        const willRetry = nextAttemptCount < MAX_ATTEMPTS
        const nextRetryAt = willRetry
          ? new Date(Date.now() + Math.pow(2, nextAttemptCount) * 60 * 1000).toISOString()
          : null

        await supabase
          .from('outbound_webhook_deliveries')
          .update({
            status: willRetry ? 'retrying' : 'failed',
            response_status: response.status,
            attempt_count: nextAttemptCount,
            next_retry_at: nextRetryAt,
            error_message: responseText ? responseText.substring(0, 1000) : `HTTP ${response.status}`
          })
          .eq('id', delivery.id)

        results.push({ id: delivery.id, status: willRetry ? 'retrying' : 'failed', statusCode: response.status })
      }

    } catch (err: unknown) {
      // Handle network errors / timeouts with exponential backoff
      const willRetry = nextAttemptCount < MAX_ATTEMPTS
      const nextRetryAt = willRetry
        ? new Date(Date.now() + Math.pow(2, nextAttemptCount) * 60 * 1000).toISOString()
        : null

      await supabase
        .from('outbound_webhook_deliveries')
        .update({
          status: willRetry ? 'retrying' : 'failed',
          response_status: 0,
          attempt_count: nextAttemptCount,
          next_retry_at: nextRetryAt,
          error_message: err instanceof Error ? err.message.substring(0, 1000) : 'Unknown Network Error'
        })
        .eq('id', delivery.id)

      results.push({ id: delivery.id, status: willRetry ? 'retrying' : 'failed', reason: err instanceof Error ? err.message : String(err) })
    }
  }

  return NextResponse.json({ success: true, processed: deliveries.length, results })
}
