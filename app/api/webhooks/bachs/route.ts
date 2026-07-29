import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/upstash'
import { bachsProvider } from '@/lib/payments/bachs'
import {
  processBookingPayment,
  processSubscriptionPayment,
  processCreditPackPayment,
  processOrderPayment,
  processQuoteMilestonePayment
} from '@/lib/payments/webhook-service'

export async function POST(req: Request) {
  try {
    const { success } = await checkRateLimit('bachs_webhook')
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const rawBody = await req.text()
    const signature = req.headers.get('x-bachs-signature') || req.headers.get('x-signature') || req.headers.get('authorization')

    // Validate signature (bypasses in local test mode if configured)
    if (signature && !bachsProvider.validateWebhookSignature(rawBody, signature)) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    const event = JSON.parse(rawBody)
    const eventType = event.event || event.type || 'payment.completed'

    if (['payment.completed', 'charge.success', 'checkout.session.completed', 'payment_intent.succeeded'].includes(eventType)) {
      const data = event.data || event
      const rawReference = (data.reference || data.id || data.checkout_session_id) as string
      const amountPaidMinor = (data.amount || data.amount_paid || 0) as number
      const supabase = await createAdminClient()

      // Bulletproof Idempotency check
      const { error: insertError } = await supabase
        .from('webhook_events')
        .insert({ provider_reference: rawReference, event_type: eventType })

      if (insertError) {
        if (insertError.code === '23505') {
          return NextResponse.json({ status: 'already_processed' }, { status: 200 })
        }
        console.error('Bachs Webhook Idempotency Error:', insertError)
        return NextResponse.json({ error: 'Failed to acquire idempotency lock' }, { status: 500 })
      }

      // Admin Tester Mode
      if (data.metadata?.is_test_mode === true) {

        return NextResponse.json({ status: 'test_mode_success' }, { status: 200 })
      }

      try {
        if (rawReference.startsWith('book_')) {
          const bookingId = rawReference.replace('book_', '').split('_')[0]
          await processBookingPayment(supabase, bookingId, amountPaidMinor, rawReference)
        } else if (rawReference.startsWith('QUOTE_')) {
          await processQuoteMilestonePayment(supabase, rawReference, amountPaidMinor)
        } else if (data.metadata?.is_subscription) {
          const orgId = data.metadata.organization_id
          const planType = data.metadata.plan_type
          const currency = data.currency || 'NGN'
          if (orgId) {
            await processSubscriptionPayment(supabase, orgId, planType, amountPaidMinor, currency, rawReference)
          }
        } else if (data.metadata?.is_credit_pack) {
          const orgId = data.metadata.organization_id
          const credits = Number(data.metadata.credits) || 0
          const currency = data.currency || 'NGN'
          if (orgId && credits > 0) {
            await processCreditPackPayment(supabase, orgId, credits, amountPaidMinor, currency, rawReference)
          }
        } else {
          await processOrderPayment(supabase, rawReference, amountPaidMinor, rawReference)
        }
      } catch (procErr) {
        console.error(`Bachs webhook logic processing failed for ${rawReference}:`, procErr)
        Sentry.captureException(procErr, { extra: { reference: rawReference, data } })
        return NextResponse.json({ status: 'processing_error_logged', error: String(procErr) }, { status: 200 })
      }

      return NextResponse.json({ status: 'success' }, { status: 200 })
    }

    return NextResponse.json({ status: 'ignored_event' }, { status: 200 })
  } catch (err) {
    console.error('Unhandled exception in Bachs Webhook:', err)
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
