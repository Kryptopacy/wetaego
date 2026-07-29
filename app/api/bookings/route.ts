import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notifyBusiness } from '@/lib/notifications/dispatcher'
import { checkRateLimit } from '@/lib/upstash'
import { z } from 'zod'

const bookingSchema = z.object({
  page_id: z.string().uuid('Invalid page ID'),
  item_id: z.string().uuid().optional().nullable(),
  item_ids: z.array(z.string().uuid()).optional().nullable(),
  customer_name: z.string().min(1, 'Name is required'),
  customer_email: z.string().email('Invalid email format').optional().nullable().or(z.literal('')),
  customer_phone: z.string().min(1, 'Phone is required'),
  booking_date: z.string().optional().nullable(),
  booking_end_date: z.string().optional().nullable(),
  booking_time: z.string().optional().nullable(),
  booking_end_time: z.string().optional().nullable(),
  number_of_guests: z.number().int().positive().optional().nullable(),
  booking_notes: z.string().optional().nullable(),
})

/**
 * POST /api/bookings
 * Creates a new booking request from a public page.
 * If billing is enabled, initiates a Paystack transaction and returns the payment URL.
 * If billing is disabled or payment mode is 'request_only', saves the booking as pending.
 */
export async function POST(req: Request) {
  try {
    const { success } = await checkRateLimit('api_bookings')
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await req.json()
    const parsed = bookingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }

    const {
      page_id,
      item_id,
      customer_name,
      customer_email,
      customer_phone,
      booking_date,
      booking_end_date,
      booking_time,
      booking_end_time,
      number_of_guests,
      booking_notes,
      item_ids,
    } = parsed.data

    const supabase = await createClient()
    const adminClient = await createAdminClient()

    // Get page + location + org
    const { data: page } = await adminClient
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

    // Handle multiple items
    let basePrice = 0
    let paymentMode = page.payment_mode || 'full'
    let depositPct = page.deposit_percentage || 30
    
    const targetItemIds = item_ids && item_ids.length > 0 ? item_ids : (item_id ? [item_id] : [])
    let firstItem = null

    if (targetItemIds.length > 0) {
      const { data: items } = await adminClient
        .from('page_items')
        .select('id, title, price_minor, payment_mode, deposit_percentage, inventory_count')
        .in('id', targetItemIds)
      
      if (items && items.length > 0) {
        firstItem = items[0]
        basePrice = items.reduce((sum, i) => sum + (i.price_minor || 0), 0)
        
        // Calculate nights/days multiplier for accommodations
        let multiplier = 1
        if (booking_date && booking_end_date && booking_date !== booking_end_date) {
          const start = new Date(booking_date)
          const end = new Date(booking_end_date)
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const diffTime = Math.abs(end.getTime() - start.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            if (diffDays > 0) multiplier = diffDays
          }
        }
        
        basePrice = basePrice * multiplier

        // Use the strictest payment mode from items or page
        if (items.some(i => i.payment_mode === 'full')) paymentMode = 'full'
        else if (items.some(i => i.payment_mode === 'deposit')) paymentMode = 'deposit'
        
        // Use the highest deposit percentage
        const maxDeposit = Math.max(...items.map(i => i.deposit_percentage || 0))
        if (maxDeposit > 0) depositPct = maxDeposit
      }
    }

    const chargeAmount = paymentMode === 'deposit'
      ? Math.round(basePrice * (depositPct / 100))
      : basePrice

    // 1. Create the booking record atomically under FOR UPDATE row locks to prevent race conditions
    const primaryItemId = targetItemIds.length === 1 ? targetItemIds[0] : null
    const { data: bookingData, error: bookingError } = await adminClient.rpc('create_booking_atomic', {
      p_page_id: page_id,
      p_item_id: primaryItemId,
      p_customer_name: customer_name,
      p_customer_email: customer_email || null,
      p_customer_phone: customer_phone,
      p_booking_date: booking_date || null,
      p_booking_end_date: booking_end_date || null,
      p_booking_time: booking_time || null,
      p_booking_end_time: booking_end_time || null,
      p_number_of_guests: number_of_guests || 1,
      p_booking_notes: (targetItemIds.length > 1 ? `Multi-item Booking: ${targetItemIds.length} items.\n\n` : '') + (booking_notes || ''),
      p_total_amount_minor: basePrice,
      p_payment_status: 'unpaid'
    })

    if (bookingError || !bookingData) {
      console.error('Booking insert error:', bookingError)
      if (bookingError?.message?.includes('sold out') || bookingError?.message?.includes('Not enough availability')) {
        return NextResponse.json({ error: bookingError.message }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    const booking = { id: (bookingData as { id: string }).id }

    // Insert child bookings for inventory locking if there are multiple items
    if (targetItemIds.length > 1) {
      const childBookings = targetItemIds.map(id => ({
        page_id,
        item_id: id,
        customer_name,
        customer_email: customer_email || null,
        customer_phone,
        booking_date: booking_date || null,
        booking_end_date: booking_end_date || null,
        booking_time: booking_time || null,
        booking_end_time: booking_end_time || null,
        number_of_guests: number_of_guests || 1,
        booking_notes: `[SYSTEM_CHILD_OF:${booking.id}]`,
        total_amount_minor: 0,
        status: 'pending',
        payment_status: 'unpaid',
      }))
      const { error: childError } = await adminClient.from('page_bookings').insert(childBookings)
      if (childError) {
        console.error('Child bookings insert error:', childError)
      }
    }

    // ── Decrement Inventory FIRST to prevent overselling ──
    if (targetItemIds.length > 0) {
      const guests = number_of_guests || 1
      
      const payload = targetItemIds.map(id => ({
        item_id: id,
        quantity: guests
      }))

      const { error: stockError } = await adminClient.rpc('decrement_stock', {
        p_items: payload
      })

      if (stockError) {
        console.error('Stock decrement error:', stockError)
        return NextResponse.json({ error: 'One or more items are out of stock or have insufficient capacity.' }, { status: 400 })
      }
    }

    // Check if org has active Paystack integration
    const { data: paymentSettings } = await adminClient
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

    // No payment required — send notification directly
    await notifyBusiness(location.id, {
      title: '📅 New Booking',
      body: `${customer_name} booked ${targetItemIds.length > 1 ? `${targetItemIds.length} items` : (firstItem?.title || page.title)}`,
      url: '/dashboard/manage/bookings',
      tag: 'new-booking'
    })

    // Update booking status to confirmed
    await adminClient
      .from('page_bookings')
      .update({ status: 'confirmed' })
      .eq('id', booking.id)

    return NextResponse.json({ booking_id: booking.id, status: 'confirmed' })

  } catch (err) {
    console.error('Booking API error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
