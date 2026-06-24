import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/upstash'
import { paystackProvider } from '@/lib/payments/paystack'
import {
  processBookingPayment,
  processSubscriptionPayment,
  processOrderPayment
} from '@/lib/payments/webhook-service'

export async function POST(req: Request) {
  try {
    const { success } = await checkRateLimit('paystack_webhook')
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    
    const rawBody = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    // 1. Verify Signature using Provider
    if (!signature || !paystackProvider.validateWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(rawBody)

    if (event.event === 'charge.success') {
      const rawReference = event.data.reference as string
      const amountPaidMinor = event.data.amount as number
      const supabase = await createClient()

      // Idempotency check
      const { data: existingEvent } = await supabase
        .from('webhook_events')
        .select('id')
        .eq('provider_reference', event.data.reference)
        .single()

      if (existingEvent) {
        return NextResponse.json({ status: 'already_processed' }, { status: 200 })
      }

      // ── Determine what was paid: order or booking ────────────────────────────

      // Booking references are prefixed: "book_<bookingId>_<hash>"
      if (rawReference.startsWith('book_')) {
        const bookingId = rawReference.replace('book_', '').split('_')[0]
        
        try {
          await processBookingPayment(supabase, bookingId, amountPaidMinor, rawReference)
        } catch (e: any) {
          if (e.message === 'Booking not found') {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
          }
          throw e
        }

        await supabase.from('webhook_events').insert({ provider_reference: event.data.reference, event_type: 'charge.success' })
        return NextResponse.json({ status: 'booking_confirmed' }, { status: 200 })
      }

      // ── Subscription payment ───────────────────────────────────────────────
      if (event.data.metadata?.is_subscription) {
        const orgId = event.data.metadata.organization_id
        const planType = event.data.metadata.plan_type
        const currency = event.data.currency || 'NGN'
        
        if (orgId) {
          await processSubscriptionPayment(supabase, orgId, planType, amountPaidMinor, currency, event.data.reference)
        }
        await supabase.from('webhook_events').insert({ provider_reference: event.data.reference, event_type: 'charge.success' })
        return NextResponse.json({ status: 'subscription_confirmed' }, { status: 200 })
      }

      // ── Standard order payment ───────────────────────────────────────────────
      const orderId = rawReference.split('_split_')[0]

      try {
        const result = await processOrderPayment(supabase, orderId, amountPaidMinor, event.data.reference)
        if (result === 'already_processed') {
          return NextResponse.json({ status: 'already_processed' }, { status: 200 })
        }
      } catch (e: any) {
        if (e.message === 'Order not found') {
          return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
      }

      await supabase.from('webhook_events').insert({ provider_reference: event.data.reference, event_type: 'charge.success' })
      return NextResponse.json({ status: 'success' }, { status: 200 })
    }

    return NextResponse.json({ status: 'ignored' }, { status: 200 })

  } catch (error: unknown) {
    console.error('Webhook Error:', (error as Error).message)
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
