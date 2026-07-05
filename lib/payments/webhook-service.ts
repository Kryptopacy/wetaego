import { SupabaseClient } from '@supabase/supabase-js'
import { notifyBusiness } from '@/lib/notifications/dispatcher'
import { Resend } from 'resend'
import { ReceiptEmail } from '../../emails/receipt-email'
import { formatCurrency } from '@/lib/utils/currency'

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

        const locationId = (booking.location_pages as { location_id?: string })?.location_id
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
  const locationId = (booking.location_pages as { location_id?: string })?.location_id
  if (locationId) {
    await notifyBusiness(
      locationId,
      {
        title: '📅 New Booking Paid',
        body: `${booking.customer_name} paid for ${(booking.location_pages as { title?: string })?.title || 'a service'}`,
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
        subject: `Booking Confirmed: ${(booking.location_pages as { title?: string })?.title || 'Your Reservation'}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Booking Confirmed</h2>
            <p>Hi ${booking.customer_name},</p>
            <p>Your payment of <strong>${(amountPaidMinor / 100).toLocaleString()}</strong> was successful. Your booking is confirmed.</p>
            <p>Reference: ${rawReference}</p>
          </div>
        `
      })
    } catch (_e) {
      console.error('Failed to send booking receipt', _e)
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
  const updateData: { subscription_status: string; subscription_plan?: string; monthly_free_credits_used?: number } = { 
    subscription_status: 'active',
    monthly_free_credits_used: 0
  }
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

export async function processCreditPackPayment(
  supabase: SupabaseClient,
  orgId: string,
  creditsAdded: number,
  amountPaidMinor: number,
  currency: string,
  reference: string
) {
  // 1. Fetch current credits
  const { data: org } = await supabase
    .from('organizations')
    .select('purchased_credits, name')
    .eq('id', orgId)
    .single()

  if (!org) return

  // 2. Update credits
  await supabase
    .from('organizations')
    .update({ purchased_credits: (org.purchased_credits || 0) + creditsAdded })
    .eq('id', orgId)

  // 3. Record billing payment
  const { data: _paymentRecord } = await supabase
    .from('billing_payments')
    .insert({
      organization_id: orgId,
      amount_minor: amountPaidMinor,
      currency: currency || 'NGN',
      payment_purpose: 'credit_pack',
      provider_reference: reference
    })
    .select('id')
    .single()
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
        body: `${formatCurrency(amountPaidMinor, 'NGN')} received for ${order.table_identifier || 'Takeaway'}`,
        url: '/dashboard',
        tag: 'payment-confirmed'
      }
    ).catch(console.error)
  }

  // Send customer email receipt using React Email template
  if (order.customer_email) {
    try {
      const orgName = (order.locations as { name?: string })?.name || 'OurMenu Partner'
      await resend.emails.send({
        from: 'OurMenu Orders <noreply@ourmenuos.online>',
        to: order.customer_email,
        subject: `Receipt for your order at ${orgName}`,
        react: ReceiptEmail({
          organizationName: orgName,
          orderId: order.id,
          totalAmountMinor: amountPaidMinor,
          items: order.order_items.map((item: { item_name: string; quantity: number; price_minor: number }) => ({
            name: item.item_name,
            quantity: item.quantity,
            priceMinor: item.price_minor
          }))
        }) as React.ReactElement
      })
    } catch (_e) {
      console.error('Failed to send order receipt email:', _e)
    }
  }

  return 'success'
}

export async function processQuoteMilestonePayment(
  supabase: SupabaseClient,
  rawReference: string,
  amountPaidMinor: number
) {
  // Reference format: QUOTE_<quoteId>_<milestoneId>_<timestamp>
  const parts = rawReference.split('_')
  if (parts.length < 3) throw new Error('Invalid quote reference format')
  
  const quoteId = parts[1]
  const milestoneId = parts[2]

  const { data: quote } = await supabase
    .from('page_bookings')
    .select('id, booking_notes, amount_paid_minor, customer_email, customer_name, location_pages(location_id)')
    .eq('id', quoteId)
    .single()

  if (!quote) throw new Error('Quote not found')

  let parsedNotes: { milestones?: { id: string; status: string }[] } = {}
  try {
    if (quote.booking_notes) parsedNotes = JSON.parse(quote.booking_notes)
  } catch (_e) {}

  if (!Array.isArray(parsedNotes.milestones)) {
    // If no milestones are explicitly defined, we assume this is a fallback "Full Payment"
    // Update quote status
    await supabase
      .from('page_bookings')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        amount_paid_minor: (quote.amount_paid_minor || 0) + amountPaidMinor,
        payment_reference: rawReference
      })
      .eq('id', quoteId)
  } else {
    // Update specific milestone status
    const milestoneIndex = parsedNotes.milestones.findIndex((m) => m.id === milestoneId)
    if (milestoneIndex > -1) {
      parsedNotes.milestones[milestoneIndex].status = 'paid'
    }

    // Check if all milestones are paid
    const allPaid = parsedNotes.milestones.every((m) => m.status === 'paid')

    await supabase
      .from('page_bookings')
      .update({
        booking_notes: JSON.stringify(parsedNotes),
        payment_status: allPaid ? 'paid' : 'deposit_paid',
        status: 'confirmed',
        amount_paid_minor: (quote.amount_paid_minor || 0) + amountPaidMinor,
        payment_reference: rawReference
      })
      .eq('id', quoteId)
  }

  // Push notification to business
  const locationId = (quote.location_pages as { location_id?: string })?.location_id
  if (locationId) {
    await notifyBusiness(
      locationId,
      {
        title: '💸 Quote Payment Received',
        body: `${quote.customer_name || 'Customer'} paid a milestone for their quote.`,
        url: `/dashboard/quotes/${quoteId}`,
        tag: 'quote-payment'
      }
    ).catch(console.error)
  }

  // Optional: Send customer receipt
  return 'success'
}
