import { SupabaseClient } from '@supabase/supabase-js'
import { notifyBusiness } from '@/lib/notifications/dispatcher'
import { dispatchLocationWebhook } from '@/lib/webhooks/dispatch'
import { Resend } from 'resend'
import { ReceiptEmail } from '../../emails/receipt-email'
import { formatCurrency } from '@/lib/utils/currency'
import { waitUntil } from '@vercel/functions'
import { sendSubscriptionActivated, sendInvoice } from '../notifications/email'
import { purgeStorefrontCache } from '@/lib/cache-purger'

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

  if (relatedBookings && relatedBookings.length > 0) {
    for (const b of relatedBookings) {
      await supabase.rpc('increment_booking_payment', {
        p_booking_id: b.id,
        p_amount_minor: amountPaidMinor,
        p_payment_reference: rawReference
      })
    }
  }

  // ── Inventory was decremented atomically at booking creation ──
  // Check if any items became sold out so we can notify the business
  if (relatedBookings && relatedBookings.length > 0) {
    for (const b of relatedBookings) {
      if (!b.item_id) continue
      const { data: itemData } = await supabase
        .from('page_items')
        .select('availability_status')
        .eq('id', b.item_id)
        .single()
        
      if (itemData && itemData.availability_status === 'sold_out') {
        const locationId = (booking.location_pages as { location_id?: string })?.location_id
        if (locationId) {
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

  // Fire emails asynchronously
  const { data: orgOwner } = await supabase
    .from('organizations')
    .select('created_by, name')
    .eq('id', orgId)
    .single()

  if (orgOwner) {
    const { data: user } = await supabase.auth.admin.getUserById(orgOwner.created_by)
    if (user?.user?.email) {
      const email = user.user.email
      const formattedAmount = (amountPaidMinor / 100).toLocaleString('en-NG', { style: 'currency', currency: currency || 'NGN' })
      waitUntil(sendSubscriptionActivated(email, planType || 'Pro', user.user.user_metadata?.full_name))
      waitUntil(sendInvoice(email, formattedAmount, reference, planType || 'Pro'))
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
    .select('id, organization_id, status, total_amount_minor, location_id, table_identifier, customer_email, customer_name, locations(organization_id, name), order_items(item_name, quantity, price_minor, page_item_id)')
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

  // --- Loyalty Points Awarding ---
  if (order.organization_id && order.customer_email) {
    try {
      const { data: loyaltySettings } = await supabase
        .from('loyalty_settings')
        .select('is_enabled, points_per_major_unit, advanced_rules')
        .eq('organization_id', order.organization_id)
        .single()

      if (loyaltySettings?.is_enabled) {
        // Find customer profile using email
        const { data: customerProfile } = await supabase
          .from('customer_profiles')
          .select('id')
          .eq('organization_id', order.organization_id)
          .eq('email', order.customer_email)
          .single()

        if (customerProfile) {
          // Calculate major units (amount_minor / 100)
          const majorUnits = Math.floor(amountPaidMinor / 100)
          let multiplier = 1

          // Process advanced rules
          if (loyaltySettings.advanced_rules && Array.isArray(loyaltySettings.advanced_rules)) {
            for (const rule of loyaltySettings.advanced_rules) {
              if (rule.type === 'multiplier' && rule.condition === 'weekend') {
                const day = new Date().getDay()
                if (day === 0 || day === 6) { // Sunday = 0, Saturday = 6
                  multiplier = Math.max(multiplier, rule.value)
                }
              }
              if (rule.type === 'multiplier' && rule.condition === 'high_margin') {
                const pageItemIds = order.order_items.map((i: any) => i.page_item_id).filter(Boolean)
                if (pageItemIds.length > 0) {
                  const { data: upsellItems } = await supabase
                    .from('page_items')
                    .select('id')
                    .in('id', pageItemIds)
                    .eq('is_upsell_eligible', true)
                  
                  if (upsellItems && upsellItems.length > 0) {
                    multiplier = Math.max(multiplier, rule.value)
                  }
                }
              }
            }
          }

          const pointsToAward = Math.floor(majorUnits * (loyaltySettings.points_per_major_unit || 1) * multiplier)

          if (pointsToAward > 0) {
            await supabase.rpc('increment_loyalty_points', {
              profile_id: customerProfile.id,
              points: pointsToAward
            })
          }
        }
      }
    } catch (err) {
      console.error('Failed to award loyalty points:', err)
      // Do not block payment processing if loyalty points fail
    }
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

    // Dispatch outbound webhook to merchant subscribers
    dispatchLocationWebhook(order.location_id, 'order.updated', {
      order_id: orderId,
      status: 'paid',
      amount_paid_minor: amountPaidMinor,
      customer_email: order.customer_email,
      customer_name: order.customer_name,
    }).catch(console.error)
  }

  // Send customer email receipt using React Email template
  if (order.customer_email) {
    try {
      const orgName = (order.locations as { name?: string })?.name || 'OurMenu Partner'
      await resend.emails.send({
        from: 'OurMenu Orders <orders@ourmenuos.online>',
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

  // Purge the storefront cache so that out-of-stock items update immediately
  if (order.organization_id) {
    waitUntil(purgeStorefrontCache(order.organization_id))
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
    await supabase.rpc('increment_booking_payment', {
      p_booking_id: quoteId,
      p_amount_minor: amountPaidMinor,
      p_payment_reference: rawReference
    })
  } else {
    // Update specific milestone status
    const milestoneIndex = parsedNotes.milestones.findIndex((m) => m.id === milestoneId)
    if (milestoneIndex > -1) {
      parsedNotes.milestones[milestoneIndex].status = 'paid'
    }

    // Update the JSON notes
    await supabase
      .from('page_bookings')
      .update({
        booking_notes: JSON.stringify(parsedNotes)
      })
      .eq('id', quoteId)

    // Increment payment atomically
    await supabase.rpc('increment_booking_payment', {
      p_booking_id: quoteId,
      p_amount_minor: amountPaidMinor,
      p_payment_reference: rawReference
    })
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
