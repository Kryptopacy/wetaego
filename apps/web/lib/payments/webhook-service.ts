import { SupabaseClient } from '@supabase/supabase-js'
import { notifyBusiness } from '@/lib/notifications/dispatcher'
import { Resend } from 'resend'
import { ReceiptEmail } from '../../emails/receipt-email'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy')

export async function processBookingPayment(
  supabase: SupabaseClient,
  bookingId: string,
  amountPaidMinor: number,
  rawReference: string
) {
  const { data: booking } = await supabase
    .from('page_bookings')
    .select('id, page_id, item_id, number_of_guests, total_amount_minor, customer_name, customer_email, location_pages(location_id, title, locations(organization_id))')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    throw new Error('Booking not found')
  }

  const paidStatus =
    booking.total_amount_minor && amountPaidMinor >= booking.total_amount_minor
      ? 'fully_paid'
      : 'deposit_paid'

  // Fetch all related bookings (parent + children)
  const { data: relatedBookings } = await supabase
    .from('page_bookings')
    .select('id, item_id, number_of_guests')
    .or(`id.eq.${bookingId},booking_notes.like.%[SYSTEM_CHILD_OF:${bookingId}]%`)

  await supabase
    .from('page_bookings')
    .update({
      payment_status: paidStatus,
      status: 'confirmed',
      amount_paid_minor: amountPaidMinor,
      payment_reference: rawReference,
    })
    .or(`id.eq.${bookingId},booking_notes.like.%[SYSTEM_CHILD_OF:${bookingId}]%`)

  // If the booking(s) are tied to an item, decrement inventory
  if (relatedBookings && relatedBookings.length > 0) {
    for (const b of relatedBookings) {
      if (!b.item_id) continue
      const guests = b.number_of_guests || 1
      const { data: itemData } = await supabase
        .from('page_items')
        .select('inventory_count')
        .eq('id', b.item_id)
        .single()
        
      if (itemData && itemData.inventory_count !== null) {
        const newCount = itemData.inventory_count - guests
        const isSoldOut = newCount <= 0
        await supabase
          .from('page_items')
          .update({
            inventory_count: newCount < 0 ? 0 : newCount,
            availability_status: isSoldOut ? 'sold_out' : 'available'
          })
          .eq('id', b.item_id)

        const locationId = (booking.location_pages as any)?.location_id
        if (isSoldOut && locationId) {
          await notifyBusiness(
            locationId,
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
  }

  // Push notification to business
  const locationId = (booking.location_pages as any)?.location_id
  if (locationId) {
    await notifyBusiness(
      locationId,
      {
        title: '📅 New Booking Paid',
        body: `${booking.customer_name} paid for ${(booking.location_pages as any)?.title || 'a service'}`,
        url: '/dashboard/manage/bookings',
        tag: 'new-booking'
      }
    ).catch(console.error)
  }

  // Send customer email receipt
  if (booking.customer_email) {
    try {
      await resend.emails.send({
        from: 'OurMenu Bookings <noreply@ourmenuos.online>',
        to: booking.customer_email,
        subject: `Booking Confirmed: ${(booking.location_pages as any)?.title || 'Your Reservation'}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Booking Confirmed</h2>
            <p>Hi ${booking.customer_name},</p>
            <p>Your payment of <strong>${(amountPaidMinor / 100).toLocaleString()}</strong> was successful. Your booking is confirmed.</p>
            <p>Reference: ${rawReference}</p>
          </div>
        `
      })
    } catch (e) {
      console.error('Failed to send booking receipt', e)
    }
  }
}

export async function processSubscriptionPayment(
  supabase: SupabaseClient,
  orgId: string,
  planType: string,
  amountPaidMinor: number,
  currency: string,
  reference: string
) {
  const updateData: { subscription_status: string; subscription_plan?: string } = { subscription_status: 'active' }
  if (planType) {
    updateData.subscription_plan = planType
  }
  await supabase
    .from('organizations')
    .update(updateData)
    .eq('id', orgId)

  // 1. Record billing payment
  const { data: paymentRecord } = await supabase
    .from('billing_payments')
    .insert({
      organization_id: orgId,
      amount_minor: amountPaidMinor,
      currency: currency || 'NGN',
      payment_purpose: `subscription_${planType || 'pro'}`,
      provider_reference: reference
    })
    .select('id')
    .single()

  if (paymentRecord) {
    // 2. Affiliate Logic: Check if it's the >= 2nd payment and if there's an affiliate
    const { count } = await supabase
      .from('billing_payments')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .like('payment_purpose', 'subscription_%')

    const { data: orgData } = await supabase
      .from('organizations')
      .select('referred_by_affiliate_id')
      .eq('id', orgId)
      .single()

    if (orgData?.referred_by_affiliate_id && count && count >= 2) {
      // Get affiliate percentage
      const { data: affiliateSettings } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'affiliate')
        .single()
      
      const percentage = (affiliateSettings?.value as { default_percentage?: number })?.default_percentage || 10
      const earningsMinor = Math.floor((amountPaidMinor * percentage) / 100)

      await supabase
        .from('affiliate_earnings')
        .insert({
          affiliate_id: orgData.referred_by_affiliate_id,
          organization_id: orgId,
          billing_payment_id: paymentRecord.id,
          amount_minor: earningsMinor,
          status: 'pending'
        })
    }
  }
}

export async function processOrderPayment(
  supabase: SupabaseClient,
  orderId: string,
  amountPaidMinor: number,
  reference: string
) {
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, total_amount_minor, location_id, table_identifier, customer_email, customer_name, locations(organization_id, name), order_items(item_name, quantity, price_minor)')
    .eq('id', orderId)
    .single()

  if (!order) {
    throw new Error('Order not found')
  }

  if (order.status === 'paid' || order.status === 'completed') {
    return 'already_processed'
  }

  // Insert into payment ledger — DB trigger handles updating order status
  const { error: paymentError } = await supabase.from('order_payments').insert({
    order_id: orderId,
    amount_minor: amountPaidMinor,
    provider_reference: reference,
  })

  if (paymentError) {
    throw new Error('Failed to record payment')
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
    ).catch(console.error)
  }

  // Send customer email receipt using React Email template
  if (order.customer_email) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orgName = (order.locations as any)?.name || 'OurMenu Partner'
      await resend.emails.send({
        from: 'OurMenu Orders <noreply@ourmenuos.online>',
        to: order.customer_email,
        subject: `Receipt for your order at ${orgName}`,
        react: ReceiptEmail({
          organizationName: orgName,
          orderId: order.id,
          totalAmountMinor: amountPaidMinor,
          items: order.order_items.map((item: any) => ({
            name: item.item_name,
            quantity: item.quantity,
            priceMinor: item.price_minor
          }))
        }) as React.ReactElement
      })
    } catch (e) {
      console.error('Failed to send order receipt', e)
    }
  }

  return 'success'
}
