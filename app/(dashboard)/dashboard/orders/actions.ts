'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { FeedbackEmail } from '@/emails/feedback-email'
import { waitUntil } from '@vercel/functions'
import { authActionClient } from '@/lib/safe-action'
import { z } from 'zod'
import { paymentProvider } from '@/lib/payments/paystack'
import { getPlatformFees } from '@/lib/utils/settings'
import { PaymentLinkEmail } from '@/emails/payment-link-email'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy')

async function requireOrderAuth(orderId: string, user: any) {
  const supabase = await createClient()

  // Fetch order details
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('organization_id, customer_email, organizations(name, slug)')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) {
    throw new Error('Order not found')
  }

  // Check organization membership
  const { data: member } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', order.organization_id)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    // Check if they are the creator
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', order.organization_id)
      .eq('created_by', user.id)
      .single()
    if (!org) {
      throw new Error('Unauthorized')
    }
  }

  return { supabase, order }
}

export const completeOrderAction = authActionClient
  .schema(z.object({ orderId: z.string() }))
  .action(async ({ parsedInput: { orderId }, ctx: { user } }) => {
    const { supabase, order } = await requireOrderAuth(orderId, user)

    // 2. Update status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderId)

    if (updateError) {
      throw new Error('Failed to update order status')
    }

    // 3. Dispatch Feedback Email asynchronously if customer email exists
    if (order.customer_email) {
      const orgName = (order.organizations as unknown as { name?: string })?.name || 'the restaurant'
      const orgSlug = (order.organizations as unknown as { slug?: string })?.slug || ''
      const feedbackUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || 'ourmenuos.online'}/m/${orgSlug}/feedback/${orderId}`

      waitUntil((async () => {
        try {
          await resend.emails.send({
            from: 'OurMenu Feedback <noreply@ourmenuos.online>',
            to: order.customer_email!,
            subject: `How was your meal at ${orgName}?`,
            react: FeedbackEmail({ orgName, orderId, feedbackUrl })
          })
        } catch (err) {
          console.error('Failed to send feedback email:', err)
        }
      })())
    }

    return { success: true }
  })

export const markOrderPaidOffline = authActionClient
  .schema(z.object({ orderId: z.string() }))
  .action(async ({ parsedInput: { orderId }, ctx: { user } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      return { success: true }
    }

    const { supabase } = await requireOrderAuth(orderId, user)

    // 2. Update status to paid
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderId)

    if (updateError) {
      throw new Error('Failed to update order status')
    }

    // 3. Log the offline payment
    await supabase.from('order_payments').insert({
      order_id: orderId,
      amount_minor: 0, // Recorded as offline, amount is symbolic here as the business verified it
      provider_reference: `offline_${Date.now()}`
    })

    return { success: true }
  })

export const cancelOrderAction = authActionClient
  .schema(z.object({
    orderId: z.string(),
    reason: z.string(),
    restock: z.boolean()
  }))
  .action(async ({ parsedInput: { orderId, reason, restock }, ctx: { user } }) => {
    const { supabase } = await requireOrderAuth(orderId, user)

    // 1. Update status to cancelled and store reason
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'cancelled', cancellation_reason: reason })
      .eq('id', orderId)

    if (updateError) {
      throw new Error('Failed to cancel order')
    }

    // 2. Restock items if requested
    if (restock) {
      const { data: items } = await supabase
        .from('order_items')
        .select('item_id, quantity')
        .eq('order_id', orderId)
        .not('item_id', 'is', null)

      if (items && items.length > 0) {
        await supabase.rpc('increment_stock', {
          p_items: items
        })
      }
    }

    return { success: true }
  })

export const sendPaymentLinkAction = authActionClient
  .schema(z.object({ orderId: z.string() }))
  .action(async ({ parsedInput: { orderId }, ctx: { user } }) => {
    const { supabase, order } = await requireOrderAuth(orderId, user)

    if (!order.customer_email) {
      throw new Error('Customer email is missing on this order. Cannot send payment link.')
    }

    // 1. Fetch full order details
    const { data: fullOrder, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(item_name, quantity, price_minor),
        organizations(name)
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !fullOrder) {
      throw new Error('Failed to fetch complete order details')
    }

    // 2. Fetch Payment Settings
    const { data: paySettings } = await supabase
      .from('organization_payment_settings')
      .select('provider_account_id, is_active')
      .eq('organization_id', fullOrder.organization_id)
      .single()

    const isPaystackLive = paySettings?.is_active && paySettings?.provider_account_id
    if (!isPaystackLive) {
      throw new Error('Your Paystack integration is not active. Cannot generate payment link.')
    }

    const subaccountCode = paySettings.provider_account_id

    // 3. Generate Payment Link
    const platformFeesConfig = await getPlatformFees()
    const businessFeePercent = platformFeesConfig.business_subaccount || 5
    const chargeAmountMinor = fullOrder.total_amount_minor - (fullOrder.amount_paid_minor || 0)
    
    if (chargeAmountMinor <= 0) {
      throw new Error('Order is already fully paid.')
    }

    const transactionChargeMinor = subaccountCode && businessFeePercent > 0
      ? Math.floor(chargeAmountMinor * (businessFeePercent / 100))
      : undefined

    const { authorizationUrl: checkoutUrl } = await paymentProvider.initiatePayment({
      amountMinor: chargeAmountMinor,
      customerEmail: fullOrder.customer_email!,
      reference: `${orderId}-link-${Date.now()}`,
      currency: 'NGN',
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ourmenuos.online'}/api/bookings/callback`,
      subaccountCode: subaccountCode || undefined,
      transactionChargeMinor,
      channels: ['card', 'bank_transfer', 'ussd']
    })

    if (!checkoutUrl) {
      throw new Error('Failed to generate checkout link from Paystack.')
    }

    // 4. Send Email
    const orgName = (fullOrder.organizations as unknown as { name?: string })?.name || 'OurMenu Partner'
    const items = (fullOrder.order_items as { item_name: string; quantity: number; price_minor: number }[]).map(i => ({
      name: i.item_name,
      quantity: i.quantity,
      priceMinor: i.price_minor
    }))

    waitUntil((async () => {
      try {
        await resend.emails.send({
          from: 'OurMenu Payments <noreply@ourmenuos.online>',
          to: fullOrder.customer_email!,
          subject: `Complete your payment for Order #${orderId.substring(0, 8)}`,
          react: PaymentLinkEmail({
            organizationName: orgName,
            orderId,
            totalAmountMinor: chargeAmountMinor,
            paymentUrl: checkoutUrl,
            items
          })
        })
      } catch (err) {
        console.error('Failed to send payment link email:', err)
      }
    })())

    return { success: true, checkoutUrl }
  })
