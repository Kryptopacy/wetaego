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
import { OrderCancellationEmail } from '@/emails/order-cancellation-email'
import { OrderRefundEmail } from '@/emails/order-refund-email'
import { notifyCustomer } from '@/lib/notifications/dispatcher'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy')

async function requireOrderAuth(orderId: string, user: { id: string }) {
  const supabase = await createClient()

  // Fetch order details
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('organization_id, customer_email, page_id, organizations(name, slug)')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) {
    throw new Error('Order not found')
  }

  // Check organization membership
  const { data: member } = await supabase
    .from('organization_members')
    .select('page_id')
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
  } else {
    // Enforce page-level RBAC if the member is restricted to a specific page
    if (member.page_id && member.page_id !== order.page_id) {
      throw new Error('Unauthorized: You do not have access to this page\'s orders.')
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
    const { supabase, order } = await requireOrderAuth(orderId, user)

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

    if (order.customer_email) {
      const orgName = (order.organizations as unknown as { name?: string })?.name || 'OurMenu Partner'
      waitUntil((async () => {
        try {
          await resend.emails.send({
            from: 'OurMenu Orders <orders@ourmenuos.online>',
            to: order.customer_email!,
            subject: `Update on Order #${orderId.substring(0, 8)} - Cancelled`,
            react: OrderCancellationEmail({
              organizationName: orgName,
              orderId,
              reason
            })
          })
        } catch (err) {
          console.error('Failed to send cancellation email:', err)
        }
      })())
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
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ourmenuos.online'}/dashboard/orders`,
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
async function verifyManagerPin(organizationId: string, locationId: string, pin: string) {
  const supabase = await createClient()
  // 1. Check location PIN
  const { data: loc } = await supabase
    .from('locations')
    .select('manager_pin')
    .eq('id', locationId)
    .single()
    
  if (loc && loc.manager_pin === pin) return true
  
  // 2. Check org member PINs
  const { data: members } = await supabase
    .from('organization_members')
    .select('manager_pin')
    .eq('organization_id', organizationId)
    .in('role', ['owner', 'manager'])
    .not('manager_pin', 'is', null)
    
  if (members && members.some((m: { manager_pin: string | null }) => m.manager_pin === pin)) {
    return true
  }
  
  return false
}

export const voidOrderAction = authActionClient
  .schema(z.object({
    orderId: z.string(),
    pin: z.string(),
    restock: z.boolean().default(true)
  }))
  .action(async ({ parsedInput: { orderId, pin, restock }, ctx: { user } }) => {
    const { supabase, order } = await requireOrderAuth(orderId, user)
    
    const { data: fullOrder } = await supabase.from('orders').select('location_id, status').eq('id', orderId).single()
    if (!fullOrder) throw new Error('Order not found')
    
    const isValid = await verifyManagerPin(order.organization_id, fullOrder.location_id, pin)
    if (!isValid) throw new Error('Invalid Manager PIN')
    
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'voided' })
      .eq('id', orderId)
      
    if (updateError) throw new Error('Failed to void order')
    
    if (restock) {
      const { data: items } = await supabase
        .from('order_items')
        .select('item_id, quantity')
        .eq('order_id', orderId)
        .not('item_id', 'is', null)

      if (items && items.length > 0) {
        await supabase.rpc('increment_stock', { p_items: items })
      }
    }
    
    if (order.customer_email) {
      const orgName = (order.organizations as unknown as { name?: string })?.name || 'OurMenu Partner'
      waitUntil((async () => {
        try {
          await resend.emails.send({
            from: 'OurMenu Orders <orders@ourmenuos.online>',
            to: order.customer_email!,
            subject: `Update on Order #${orderId.substring(0, 8)} - Voided`,
            react: OrderCancellationEmail({
              organizationName: orgName,
              orderId,
              reason: 'Order was voided by management.'
            })
          })
        } catch (err) {
          console.error('Failed to send void email:', err)
        }
      })())
    }

    return { success: true }
  })
  
export const refundOrderAction = authActionClient
  .schema(z.object({
    orderId: z.string(),
    pin: z.string()
  }))
  .action(async ({ parsedInput: { orderId, pin }, ctx: { user } }) => {
    const { supabase, order } = await requireOrderAuth(orderId, user)
    
    const { data: fullOrder } = await supabase.from('orders').select('location_id, status').eq('id', orderId).single()
    if (!fullOrder) throw new Error('Order not found')
    
    const isValid = await verifyManagerPin(order.organization_id, fullOrder.location_id, pin)
    if (!isValid) throw new Error('Invalid Manager PIN')
    
    const { data: payments } = await supabase
      .from('order_payments')
      .select('provider_reference, amount_minor')
      .eq('order_id', orderId)
      .gt('amount_minor', 0)
      
    const realPayment = payments?.find(p => p.provider_reference && !p.provider_reference.startsWith('offline'))
    
    if (realPayment && paymentProvider.refundPayment) {
      const refundResult = await paymentProvider.refundPayment(realPayment.provider_reference, realPayment.amount_minor)
      if (!refundResult.success) {
        throw new Error(refundResult.message || 'Refund failed at payment gateway')
      }
    }
    
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'refunded' })
      .eq('id', orderId)
      
    if (updateError) throw new Error('Failed to update order status')
    
    if (order.customer_email) {
      const orgName = (order.organizations as unknown as { name?: string })?.name || 'OurMenu Partner'
      waitUntil((async () => {
        try {
          await resend.emails.send({
            from: 'OurMenu Orders <orders@ourmenuos.online>',
            to: order.customer_email!,
            subject: `Refund Processed for Order #${orderId.substring(0, 8)}`,
            react: OrderRefundEmail({
              organizationName: orgName,
              orderId,
              refundAmountMinor: realPayment?.amount_minor
            })
          })
        } catch (err) {
          console.error('Failed to send refund email:', err)
        }
      })())
    }

    return { success: true }
  })

export const addMilestoneAction = authActionClient
  .schema(z.object({
    orderId: z.string(),
    title: z.string(),
    description: z.string().optional()
  }))
  .action(async ({ parsedInput: { orderId, title, description }, ctx: { user } }) => {
    const { supabase } = await requireOrderAuth(orderId, user)

    const { data: orderDetails } = await supabase.from('orders').select('tracking_code').eq('id', orderId).single()
    let trackingCode = orderDetails?.tracking_code
    
    if (!trackingCode) {
      trackingCode = `REP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
      await supabase.from('orders').update({ tracking_code: trackingCode }).eq('id', orderId)
    }

    const { error } = await supabase.from('order_milestones').insert({
      order_id: orderId,
      title,
      description: description || null,
      is_completed: false
    })

    if (error) throw new Error('Failed to add milestone')
    return { success: true, trackingCode }
  })

export const completeMilestoneAction = authActionClient
  .schema(z.object({
    orderId: z.string(),
    milestoneId: z.string()
  }))
  .action(async ({ parsedInput: { orderId, milestoneId }, ctx: { user } }) => {
    const { supabase } = await requireOrderAuth(orderId, user)

    const { data: milestone, error } = await supabase.from('order_milestones').update({
      is_completed: true,
      completed_at: new Date().toISOString()
    }).eq('id', milestoneId).eq('order_id', orderId).select('title, description').single()

    if (error) throw new Error('Failed to complete milestone')

    // Notify customer in the background
    if (milestone) {
      notifyCustomer(orderId, {
        title: `Update: ${milestone.title}`,
        body: milestone.description || `Your order milestone "${milestone.title}" has been completed.`
      })
    }

    return { success: true }
  })

export const addAdHocItemAction = authActionClient
  .schema(z.object({
    orderId: z.string(),
    itemName: z.string(),
    priceMinor: z.number(),
    quantity: z.number().default(1)
  }))
  .action(async ({ parsedInput: { orderId, itemName, priceMinor, quantity }, ctx: { user } }) => {
    const { supabase } = await requireOrderAuth(orderId, user)

    const { error: rpcError } = await supabase.rpc('add_ad_hoc_item_rpc', {
      p_order_id: orderId,
      p_item_name: itemName,
      p_price_minor: priceMinor,
      p_quantity: quantity
    })

    if (rpcError) {
      console.error('RPC Error:', rpcError)
      throw new Error('Failed to add part/cost atomically')
    }

    return { success: true }
  })

export const deleteAdHocItemAction = authActionClient
  .schema(z.object({
    orderId: z.string(),
    orderItemId: z.string()
  }))
  .action(async ({ parsedInput: { orderId, orderItemId }, ctx: { user } }) => {
    const { supabase } = await requireOrderAuth(orderId, user)

    const { error: rpcError } = await supabase.rpc('delete_ad_hoc_item_rpc', {
      p_order_item_id: orderItemId
    })

    if (rpcError) {
      console.error('RPC Error:', rpcError)
      throw new Error('Failed to delete part/cost atomically')
    }

    return { success: true }
  })

export const logManualPaymentAction = authActionClient
  .schema(z.object({
    orderId: z.string(),
    amountMinor: z.number(),
    paymentMethod: z.enum(['cash', 'pos_terminal', 'bank_transfer', 'deposit']).default('cash')
  }))
  .action(async ({ parsedInput: { orderId, amountMinor, paymentMethod }, ctx: { user } }) => {
    const { supabase } = await requireOrderAuth(orderId, user)

    const { error: rpcError } = await supabase.rpc('log_manual_payment_rpc', {
      p_order_id: orderId,
      p_amount_minor: amountMinor,
      p_reference: `manual_${paymentMethod}_${Date.now()}`
    })

    if (rpcError) {
      console.error('RPC Error:', rpcError)
      throw new Error('Failed to log payment atomically')
    }

    return { success: true }
  })

export const deleteManualPaymentAction = authActionClient
  .schema(z.object({
    orderId: z.string(),
    paymentId: z.string()
  }))
  .action(async ({ parsedInput: { orderId, paymentId }, ctx: { user } }) => {
    const { supabase } = await requireOrderAuth(orderId, user)

    const { error: rpcError } = await supabase.rpc('delete_manual_payment_rpc', {
      p_payment_id: paymentId
    })

    if (rpcError) {
      console.error('RPC Error:', rpcError)
      throw new Error('Failed to delete payment atomically')
    }

    return { success: true }
  })
