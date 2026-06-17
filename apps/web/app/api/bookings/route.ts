import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushToOrg, newBookingNotification } from '@/lib/notifications/push'

/**
 * POST /api/bookings
 * Creates a new booking request from a public page.
 * If billing is enabled, initiates a Paystack transaction and returns the payment URL.
 * If billing is disabled or payment mode is 'request_only', saves the booking as pending.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      page_id,
      item_id,
      customer_name,
      customer_email,
      customer_phone,
      booking_date,
      booking_time,
      number_of_guests,
      booking_notes,
    } = body

    if (!page_id || !customer_name || !customer_phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get page + location + org
    const { data: page } = await supabase
      .from('location_pages')
      .select('id, title, billing_enabled, billing_mode, payment_mode, deposit_percentage, locations(id, organization_id, name)')
      .eq('id', page_id)
      .eq('is_published', true)
      .single()

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const location = page.locations as { id: string; organization_id: string; name: string } | null
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Get the selected item (if any) for pricing
    let item: { id: string; title: string; price_minor: number; payment_mode: string; deposit_percentage: number } | null = null
    if (item_id) {
      const { data } = await supabase
        .from('page_items')
        .select('id, title, price_minor, payment_mode, deposit_percentage')
        .eq('id', item_id)
        .single()
      item = data
    }

    // Calculate the amount to charge
    const basePrice = item?.price_minor || 0
    const paymentMode = item?.payment_mode || page.payment_mode || 'full'
    const depositPct = item?.deposit_percentage || page.deposit_percentage || 30
    const chargeAmount = paymentMode === 'deposit'
      ? Math.round(basePrice * (depositPct / 100))
      : basePrice

    // Create the booking record (initially pending)
    const { data: booking, error: bookingError } = await supabase
      .from('page_bookings')
      .insert({
        page_id,
        item_id: item_id || null,
        organization_id: location.organization_id,
        customer_name,
        customer_email: customer_email || null,
        customer_phone,
        booking_date: booking_date || null,
        booking_time: booking_time || null,
        number_of_guests: number_of_guests || 1,
        notes: booking_notes || null,
        total_amount_minor: basePrice,
        status: 'pending',
        payment_status: chargeAmount > 0 && page.billing_enabled ? 'awaiting_payment' : 'not_required',
      })
      .select('id')
      .single()

    if (bookingError || !booking) {
      console.error('Booking insert error:', bookingError)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    // Check if org has active Paystack integration
    const { data: paymentSettings } = await supabase
      .from('organization_payment_settings')
      .select('is_active, provider_account_id')
      .eq('organization_id', location.organization_id)
      .single()

    const isPaystackLive = paymentSettings?.is_active && paymentSettings?.provider_account_id

    // If billing enabled, there's a charge, and Paystack is live
    if (page.billing_enabled && chargeAmount > 0 && customer_email && isPaystackLive) {
      const paystackKey = process.env.PAYSTACK_SECRET_KEY
      if (paystackKey) {
        const reference = `book_${booking.id}_${Date.now()}`
        const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${paystackKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: customer_email,
            amount: chargeAmount,
            reference,
            subaccount: paymentSettings.provider_account_id,
            metadata: {
              booking_id: booking.id,
              page_id,
              customer_name,
            },
            callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/bookings/callback`,
          }),
        })

        if (paystackRes.ok) {
          const paystackData = await paystackRes.json()
          if (paystackData.data?.authorization_url) {
            return NextResponse.json({
              booking_id: booking.id,
              payment_url: paystackData.data.authorization_url,
            })
          }
        }
      }
    }

    // No payment required — send push notification directly
    await sendPushToOrg(
      location.organization_id,
      newBookingNotification(item?.title || page.title, customer_name)
    ).catch(console.error)

    return NextResponse.json({ booking_id: booking.id, status: 'confirmed' })

  } catch (err) {
    console.error('Booking API error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
