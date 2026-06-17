/**
 * Notification Sender Utility
 *
 * Sends OS-level Web Push notifications to all registered devices for an org.
 * Uses the web-push library (VAPID). Call this from:
 *   - Paystack webhook (new order paid)
 *   - New booking created
 *   - New inquiry submitted
 *   - Manual triggers
 *
 * Install: pnpm add web-push
 * VAPID keys: run `npx web-push generate-vapid-keys` and add to .env.local
 */

import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

// Configure VAPID once on module load
const vapidConfigured =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY &&
  process.env.VAPID_EMAIL

if (vapidConfigured) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
}

export interface PushPayload {
  title: string
  body: string
  /** Deep-link URL to open on notification click */
  url?: string
  /** Notification tag — groups notifications of same type (prevents stacking) */
  tag?: string
  /** Show actions on the notification (requires requireInteraction) */
  actions?: Array<{ action: string; title: string }>
  requireInteraction?: boolean
}

export interface SendResult {
  sent: number
  failed: number
  staleCleaned: number
}

/**
 * Send a push notification to all devices registered for an organization.
 * Automatically removes stale/expired subscriptions.
 */
export async function sendPushToOrg(
  organizationId: string,
  payload: PushPayload
): Promise<SendResult> {
  if (!vapidConfigured) {
    console.warn('[Push] VAPID keys not configured — push notifications disabled')
    return { sent: 0, failed: 0, staleCleaned: 0 }
  }

  const supabase = await createClient()

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('organization_id', organizationId)

  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0, staleCleaned: 0 }
  }

  const result: SendResult = { sent: 0, failed: 0, staleCleaned: 0 }
  const staleIds: string[] = []

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24 } // 24h TTL — retry if device offline
        )
        result.sent++
      } catch (err: unknown) {
        const httpError = err as { statusCode?: number }
        // 410 Gone = subscription expired/unsubscribed — clean it up
        if (httpError?.statusCode === 410 || httpError?.statusCode === 404) {
          staleIds.push(sub.id)
          result.staleCleaned++
        } else {
          console.warn(`[Push] Failed to send to ${sub.endpoint}:`, err)
          result.failed++
        }
      }
    })
  )

  // Clean up expired subscriptions
  if (staleIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', staleIds)
  }

  return result
}

// ── Pre-built notification templates ─────────────────────────────────────────

export function newOrderNotification(tableIdentifier: string, amountMinor: number): PushPayload {
  return {
    title: '🛎️ New Order Received',
    body: `Table ${tableIdentifier} — ₦${(amountMinor / 100).toLocaleString()}`,
    url: '/dashboard/orders',
    tag: 'new-order',
    requireInteraction: true,
    actions: [{ action: 'view', title: 'Open KDS' }],
  }
}

export function newBookingNotification(serviceName: string, customerName: string): PushPayload {
  return {
    title: '📅 New Booking',
    body: `${customerName} booked ${serviceName}`,
    url: '/dashboard/manage/bookings',
    tag: 'new-booking',
    requireInteraction: true,
    actions: [{ action: 'view', title: 'View Booking' }],
  }
}

export function newInquiryNotification(propertyTitle: string, customerName: string): PushPayload {
  return {
    title: '💬 New Enquiry',
    body: `${customerName} enquired about "${propertyTitle}"`,
    url: '/dashboard/manage/properties',
    tag: 'new-inquiry',
    actions: [{ action: 'view', title: 'View Enquiry' }],
  }
}

export function newQuoteRequestNotification(serviceName: string, customerName: string): PushPayload {
  return {
    title: '📩 New Quote Request',
    body: `${customerName} wants a quote for ${serviceName}`,
    url: '/dashboard/manage/quotes',
    tag: 'new-quote',
    actions: [{ action: 'view', title: 'View Request' }],
  }
}

export function paymentConfirmedNotification(reference: string, amountMinor: number): PushPayload {
  return {
    title: '✅ Payment Confirmed',
    body: `₦${(amountMinor / 100).toLocaleString()} received · Ref: ${reference.slice(-6)}`,
    url: '/dashboard',
    tag: 'payment-confirmed',
  }
}
