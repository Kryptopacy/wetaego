/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import {
  sendPushToOrg,
  newOrderNotification,
  newBookingNotification,
  paymentConfirmedNotification,
} from '@/lib/notifications/push'

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    // 1. Verify Signature
    const secret = process.env.PAYSTACK_SECRET_KEY || ''
    const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(rawBody)

    if (event.event === 'charge.success') {
      const rawReference = event.data.reference as string
      const amountPaidMinor = event.data.amount as number
      const supabase: any = await createClient()

      // Idempotency check
      const { data: existingEvent } = await supabase
        .from('webhook_events')
        .select('id')
        .eq('provider_reference', event.data.reference)
        .single()

      if (existingEvent) {
        return NextResponse.json({ status: 'already_processed' }, { status: 200 })
      }

      // Record webhook first (prevents duplicate processing even if later steps fail)
      await supabase.from('webhook_events').insert({
        provider_reference: event.data.reference,
        event_type: 'charge.success',
      })

      // ── Determine what was paid: order or booking ────────────────────────────

      // Booking references are prefixed: "book_<bookingId>_<hash>"
      if (rawReference.startsWith('book_')) {
        const bookingId = rawReference.replace('book_', '').split('_')[0]

        const { data: booking } = await supabase
          .from('page_bookings')
          .select('id, page_id, total_amount_minor, customer_name, location_pages(location_id, title, locations(organization_id))')
          .eq('id', bookingId)
          .single()

        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        const paidStatus =
          booking.total_amount_minor && amountPaidMinor >= booking.total_amount_minor
            ? 'fully_paid'
            : 'deposit_paid'

        await supabase
          .from('page_bookings')
          .update({
            payment_status: paidStatus,
            status: 'confirmed',
            amount_paid_minor: amountPaidMinor,
            payment_reference: rawReference,
          })
          .eq('id', bookingId)

        // Push notification to business
        const orgId = booking.location_pages?.locations?.organization_id
        if (orgId) {
          await sendPushToOrg(
            orgId,
            newBookingNotification(
              booking.location_pages?.title || 'Service',
              booking.customer_name
            )
          ).catch(console.error) // non-blocking
        }

        return NextResponse.json({ status: 'booking_confirmed' }, { status: 200 })
      }

      // ── Standard order payment ───────────────────────────────────────────────
      const orderId = rawReference.split('_split_')[0]

      const { data: order } = await supabase
        .from('orders')
        .select('id, status, total_amount_minor, organization_id, table_identifier')
        .eq('id', orderId)
        .single()

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      if (order.status === 'paid' || order.status === 'completed') {
        return NextResponse.json({ status: 'already_processed' }, { status: 200 })
      }

      // Insert into payment ledger — DB trigger handles updating order status
      const { error: paymentError } = await supabase.from('order_payments').insert({
        order_id: orderId,
        amount_minor: amountPaidMinor,
        provider_reference: event.data.reference,
      })

      if (paymentError) {
        console.error('Failed to insert payment:', paymentError)
        return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
      }

      // Push notification to business
      if (order.organization_id) {
        await sendPushToOrg(
          order.organization_id,
          newOrderNotification(order.table_identifier || 'Takeaway', amountPaidMinor)
        ).catch(console.error) // non-blocking
      }

      return NextResponse.json({ status: 'success' }, { status: 200 })
    }

    return NextResponse.json({ status: 'ignored' }, { status: 200 })

  } catch (error: any) {
    console.error('Webhook Error:', error.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
