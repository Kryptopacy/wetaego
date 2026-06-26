import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/upstash'
import { paystackProvider } from '@/lib/payments/paystack'
import {
  processBookingPayment,
  processSubscriptionPayment,
  processCreditPackPayment,
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
      const supabase = await createAdminClient()

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
        } catch (e: unknown) {
          if (e instanceof Error && e.message === 'Booking not found') {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
          }
          throw e
        }
      } else if (rawReference.startsWith('QUOTE_')) {
        // Quote Milestone References: QUOTE_<quoteId>_<milestoneId>_<hash>
        try {
          // Note: we dynamically import the function here or add it to the webhook-service exports
          const { processQuoteMilestonePayment } = await import('@/lib/payments/webhook-service')
          await processQuoteMilestonePayment(supabase, rawReference, amountPaidMinor)
        } catch (e: unknown) {
          console.error('Failed to process quote payment', e)
          // We still return 200 so Paystack stops retrying if it's a structural error, 
          // or we can let it throw. For now, we'll just throw so it's logged.
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

      // ── Credit Pack payment ───────────────────────────────────────────────
      if (event.data.metadata?.is_credit_pack) {
        const orgId = event.data.metadata.organization_id
        const credits = event.data.metadata.credits || 0
        const currency = event.data.currency || 'NGN'
        
        if (orgId && credits > 0) {
          await processCreditPackPayment(supabase, orgId, credits, amountPaidMinor, currency, event.data.reference)
        }
        await supabase.from('webhook_events').insert({ provider_reference: event.data.reference, event_type: 'charge.success' })
        return NextResponse.json({ status: 'credit_pack_confirmed' }, { status: 200 })
      }

      // ── Standard order payment ───────────────────────────────────────────────
      const orderId = rawReference.split('_split_')[0]

      try {
        const result = await processOrderPayment(supabase, orderId, amountPaidMinor, event.data.reference)
        if (result === 'already_processed') {
          return NextResponse.json({ status: 'already_processed' }, { status: 200 })
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.message === 'Order not found') {
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
