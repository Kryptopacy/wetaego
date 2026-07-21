import { createAdminClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function dispatchLocationWebhook(
  locationId: string,
  eventType: string,
  payload: Record<string, unknown>
) {
  try {
    const supabase = await createAdminClient()
    
    // Fetch active webhooks for this location
    const { data: webhooks, error } = await supabase
      .from('location_webhooks')
      .select('id, url, secret, events_subscribed')
      .eq('location_id', locationId)
      .eq('is_active', true)

    if (error || !webhooks || webhooks.length === 0) {
      return
    }

    const eventPayload = {
      id: `evt_${crypto.randomBytes(12).toString('hex')}`,
      event: eventType,
      created_at: new Date().toISOString(),
      data: payload,
    }

    const body = JSON.stringify(eventPayload)

    // Dispatch to all matching webhook subscriptions concurrently
    await Promise.allSettled(
      webhooks.map(async (webhook) => {
        // Check if subscribed to event (or wildcard empty/all)
        const isSubscribed =
          !webhook.events_subscribed ||
          webhook.events_subscribed.length === 0 ||
          webhook.events_subscribed.includes(eventType) ||
          webhook.events_subscribed.includes('*')

        if (!isSubscribed) return

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': 'OurMenu-OS-Webhook/1.0',
        }

        if (webhook.secret) {
          const signature = crypto
            .createHmac('sha256', webhook.secret)
            .update(body)
            .digest('hex')
          headers['X-OurMenu-Signature'] = `t=${Date.now()},v1=${signature}`
        }

        try {
          await fetch(webhook.url, {
            method: 'POST',
            headers,
            body,
            signal: AbortSignal.timeout(5000), // 5s timeout
          })
        } catch (err) {
          console.error(`[Webhook Dispatch Error] Failed sending to ${webhook.url}:`, err)
        }
      })
    )
  } catch (err) {
    console.error('[Webhook Dispatcher Fatal Error]:', err)
  }
}
