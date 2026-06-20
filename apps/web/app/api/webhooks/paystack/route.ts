
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { notifyBusiness } from '@/lib/notifications/dispatcher'
import {
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
          .select('id, page_id, item_id, number_of_guests, total_amount_minor, customer_name, location_pages(location_id, title, locations(organization_id))')
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

        // If the booking is tied to an item, decrement inventory
        if (booking.item_id) {
          const guests = booking.number_of_guests || 1
          const { data: itemData } = await supabase
            .from('page_items')
            .select('inventory_count')
            .eq('id', booking.item_id)
            .single()
            
          if (itemData && itemData.inventory_count !== null) {
            const newCount = itemData.inventory_count - guests
            const isSoldOut = newCount <= 0;
            await supabase
              .from('page_items')
              .update({
                inventory_count: newCount < 0 ? 0 : newCount,
                availability_status: isSoldOut ? 'sold_out' : 'available'
              })
              .eq('id', booking.item_id)

            if (isSoldOut && booking.location_pages?.location_id) {
              await notifyBusiness(
                booking.location_pages.location_id,
                {
                  title: '🚨 Item Sold Out',
                  body: `An item has reached 0 inventory and is now marked as sold out.`,
                  url: '/dashboard/pages',
                  tag: 'inventory-alert'
                }
              ).catch(console.error)
            }
          }
        }

        // Push notification to business
        const locationId = booking.location_pages?.location_id
        if (locationId) {
          await notifyBusiness(
            locationId,
            {
              title: '📅 New Booking Paid',
              body: `${booking.customer_name} paid for ${booking.location_pages?.title || 'a service'}`,
              url: '/dashboard/manage/bookings',
              tag: 'new-booking'
            }
          ).catch(console.error) // non-blocking
        }

        return NextResponse.json({ status: 'booking_confirmed' }, { status: 200 })
      }

      // ── Subscription payment ───────────────────────────────────────────────
      if (event.data.metadata?.is_subscription) {
        const orgId = event.data.metadata.organization_id
        const planType = event.data.metadata.plan_type
        
        if (orgId) {
          const updateData: Record<string, string> = { subscription_status: 'active' }
          if (planType) {
            updateData.subscription_plan = planType
          }
          await supabase
            .from('organizations')
            .update(updateData)
            .eq('id', orgId)
        }
        return NextResponse.json({ status: 'subscription_confirmed' }, { status: 200 })
      }

      // ── Standard order payment ───────────────────────────────────────────────
      const orderId = rawReference.split('_split_')[0]

      const { data: order } = await supabase
        .from('orders')
        .select('id, status, total_amount_minor, location_id, table_identifier')
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
      if (order.location_id) {
        await notifyBusiness(
          order.location_id,
          {
            title: '✅ New Order Paid',
            body: `₦${(amountPaidMinor / 100).toLocaleString()} received for ${order.table_identifier || 'Takeaway'}`,
            url: '/dashboard',
            tag: 'payment-confirmed'
          }
        ).catch(console.error) // non-blocking
      }

      return NextResponse.json({ status: 'success' }, { status: 200 })
    }

    return NextResponse.json({ status: 'ignored' }, { status: 200 })

  } catch (error: unknown) {
    console.error('Webhook Error:', (error as Error).message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
