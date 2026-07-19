import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import * as Sentry from '@sentry/nextjs'

const resendClient = new Resend(process.env.RESEND_API_KEY)

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  const supabase = await createAdminClient()

  try {
    // 1. Identify abandoned bookings that hold inventory
    // We only target bookings related to inventory-holding templates (booking, catalog, rate_card)
    // to avoid wiping out Quotes or Info inquiries.
    const { data: expiredBookings, error: expiredError } = await supabase
      .from('page_bookings')
      .select(`
        id, 
        item_id, 
        number_of_guests, 
        customer_email, 
        customer_name, 
        location_pages!inner(template_type, locations(name, currency_code))
      `)
      .eq('status', 'pending')
      .eq('payment_status', 'unpaid')
      .in('location_pages.template_type', ['booking', 'catalog', 'rate_card'])
      .lt('created_at', new Date(Date.now() - 2 * 60 * 60000).toISOString()) // older than 2 hours
      // ensure we don't pick up impossibly old records if any ghost data exists (e.g., > 24 hours)
      .gt('created_at', new Date(Date.now() - 48 * 60 * 60000).toISOString()) 

    if (expiredError) throw expiredError

    if (!expiredBookings || expiredBookings.length === 0) {
      return NextResponse.json({ status: 'success', count: 0, message: 'No abandoned bookings found' })
    }

    let cancelledCount = 0

    for (const booking of expiredBookings) {
      // Step A: Restore inventory if an item was locked
      if (booking.item_id) {
        const quantity = booking.number_of_guests || 1
        const { error: stockError } = await supabase.rpc('increment_stock', {
          p_items: [{ item_id: booking.item_id, quantity }]
        })

        if (stockError) {
          console.error(`Failed to restock booking ${booking.id}:`, stockError)
          // Skip cancellation if restocking fails to avoid permanent inventory loss without a trace
          continue 
        }
      }

      // Step B: Void the booking
      const { error: cancelError } = await supabase
        .from('page_bookings')
        .update({ 
          status: 'cancelled'
        })
        .eq('id', booking.id)

      if (!cancelError) {
        cancelledCount++
      } else {
        console.error(`Failed to cancel booking ${booking.id}:`, cancelError)
      }
    }

    return NextResponse.json({ 
      status: 'success', 
      expired_count: expiredBookings.length,
      cancelled_count: cancelledCount
    })

  } catch (error) {
    Sentry.captureException(error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
