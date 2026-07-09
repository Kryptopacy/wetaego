import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/upstash'
import { paystackProvider } from '@/lib/payments/paystack'
import {
  processBookingPayment,
  processSubscriptionPayment,
  processCreditPackPayment,
  processOrderPayment,
  processQuoteMilestonePayment
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

      // Bulletproof Idempotency check: Insert first, if it fails with unique constraint, it's a duplicate
      const { error: insertError } = await supabase
        .from('webhook_events')
        .insert({ provider_reference: event.data.reference, event_type: 'charge.success' })

      if (insertError) {
        if (insertError.code === '23505') { // Postgres unique constraint violation
          return NextResponse.json({ status: 'already_processed' }, { status: 200 })
        }
        // Strict Idempotency: Throw if we cannot acquire the lock to prevent double-processing on retries
        console.error('Webhook Idempotency Insert Error:', insertError)
        // If we cannot acquire the lock, we must return 500 to let Paystack retry later (it might be a transient DB error)
        return NextResponse.json({ error: 'Failed to acquire idempotency lock' }, { status: 500 })
      }

      // ── Determine what was paid: order or booking ────────────────────────────

      // ── Admin Tester Mode ───────────────────────────────────────────────────
      if (event.data.metadata?.is_test_mode === true) {
        // eslint-disable-next-line no-console
        console.log('✅ Admin test payment processed successfully:', rawReference)
        return NextResponse.json({ status: 'test_mode_success' }, { status: 200 })
      }

      // Booking references are prefixed: "book_<bookingId>_<hash>"
      if (rawReference.startsWith('book_')) {
        const bookingId = rawReference.replace('book_', '').split('_')[0]
        
        try {
          await processBookingPayment(supabase, bookingId, amountPaidMinor, rawReference)
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : String(e)
          await supabase
            .from('webhook_events')
            .update({ status: 'failed', error_message: errorMessage })
            .eq('provider_reference', event.data.reference)
            
          if (e instanceof Error && e.message === 'Booking not found') {
            return NextResponse.json({ error: 'Booking not found, logged to DLQ' }, { status: 200 })
          }
          // Return 200 so Paystack doesn't retry an unrecoverable logic error
          return NextResponse.json({ error: 'Booking processing failed, logged to DLQ' }, { status: 200 })
        }
      } else if (rawReference.startsWith('QUOTE_')) {
        // Quote Milestone References: QUOTE_<quoteId>_<milestoneId>_<hash>
        try {
          await processQuoteMilestonePayment(supabase, rawReference, amountPaidMinor)
        } catch (e: unknown) {
          console.error('Failed to process quote payment', e)
          const errorMessage = e instanceof Error ? e.message : String(e)
          await supabase
            .from('webhook_events')
            .update({ status: 'failed', error_message: errorMessage })
            .eq('provider_reference', event.data.reference)
          
          return NextResponse.json({ error: 'Quote processing failed, logged to DLQ' }, { status: 200 })
        }

        return NextResponse.json({ status: 'quote_milestone_confirmed' }, { status: 200 })
      }

      // ── Subscription payment ───────────────────────────────────────────────
      if (event.data.metadata?.is_subscription) {
        const orgId = event.data.metadata.organization_id
        const planType = event.data.metadata.plan_type
        const currency = event.data.currency || 'NGN'
        
        if (orgId) {
          try {
            await processSubscriptionPayment(supabase, orgId, planType, amountPaidMinor, currency, event.data.reference)
          } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : String(e)
            await supabase
              .from('webhook_events')
              .update({ status: 'failed', error_message: errorMessage })
              .eq('provider_reference', event.data.reference)
            return NextResponse.json({ error: 'Subscription processing failed, logged to DLQ' }, { status: 200 })
          }
        }
        return NextResponse.json({ status: 'subscription_confirmed' }, { status: 200 })
      }

      // ── Credit Pack payment ───────────────────────────────────────────────
      if (event.data.metadata?.is_credit_pack) {
        const orgId = event.data.metadata.organization_id
        const credits = event.data.metadata.credits || 0
        const currency = event.data.currency || 'NGN'
        
        if (orgId && credits > 0) {
          try {
            await processCreditPackPayment(supabase, orgId, credits, amountPaidMinor, currency, event.data.reference)
          } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : String(e)
            await supabase
              .from('webhook_events')
              .update({ status: 'failed', error_message: errorMessage })
              .eq('provider_reference', event.data.reference)
            return NextResponse.json({ error: 'Credit pack processing failed, logged to DLQ' }, { status: 200 })
          }
        }
        return NextResponse.json({ status: 'credit_pack_confirmed' }, { status: 200 })
      }

      // ── IOU Installment Repayment ──────────────────────────────────────────
      if (event.data.metadata?.is_iou_repayment) {
        const installmentId = event.data.metadata.installment_id
        const orgId = event.data.metadata.organization_id
        const customerId = event.data.metadata.customer_id
        
        if (installmentId && orgId && customerId) {
          const { error: rpcError } = await supabase.rpc('process_iou_repayment', {
            p_installment_id: installmentId,
            p_organization_id: orgId,
            p_customer_id: customerId,
            p_amount_minor: amountPaidMinor,
            p_reference: rawReference
          })
          
          if (rpcError) {
            console.error('IOU Repayment RPC Error:', rpcError)
            await supabase
              .from('webhook_events')
              .update({ status: 'failed', error_message: rpcError.message })
              .eq('provider_reference', event.data.reference)
            return NextResponse.json({ error: 'Failed to process IOU repayment, logged to DLQ' }, { status: 200 })
          }
        }
        return NextResponse.json({ status: 'iou_installment_paid' }, { status: 200 })
      }

      // ── Standard order payment ───────────────────────────────────────────────
      const orderId = rawReference.split('_split_')[0]

      try {
        const result = await processOrderPayment(supabase, orderId, amountPaidMinor, event.data.reference)
        if (result === 'already_processed') {
          return NextResponse.json({ status: 'already_processed' }, { status: 200 })
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e)
        await supabase
          .from('webhook_events')
          .update({ status: 'failed', error_message: errorMessage })
          .eq('provider_reference', event.data.reference)
          
        if (e instanceof Error && e.message === 'Order not found') {
          return NextResponse.json({ error: 'Order not found, logged to DLQ' }, { status: 200 })
        }
        
        // Return 200 OK after logging to DLQ to prevent Paystack from retrying permanently broken edge-cases
        return NextResponse.json({ error: 'Failed to record payment, logged to DLQ' }, { status: 200 })
      }

      return NextResponse.json({ status: 'success' }, { status: 200 })
    }

    return NextResponse.json({ status: 'ignored' }, { status: 200 })

  } catch (error: unknown) {
     
    console.error('Webhook Error:', (error as Error).message)
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
