import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { Database } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/utils/currency'

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  const signature = req.headers.get('x-paystack-signature')

  const bodyString = await req.text()

  if (!secret) return NextResponse.json({ error: 'Missing Paystack Secret Key' }, { status: 500 })

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const hash = crypto.createHmac('sha512', secret).update(bodyString).digest('hex')
  if (
    hash.length !== signature.length ||
    !crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))
  ) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(bodyString)

  // Only process subscription-related events
  // Paystack fires: subscription.create, subscription.disable, charge.success (for recurring)
  
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Idempotency Check
    const providerRef = event.data?.reference || event.data?.subscription_code || event.event + Date.now().toString()
    if (providerRef) {
      const { data: existingEvent } = await supabase
        .from('webhook_events')
        .select('id')
        .eq('provider_reference', providerRef)
        .single()
        
      if (existingEvent) {
        return NextResponse.json({ status: 'already_processed' })
      }

      // Record webhook FIRST — prevents duplicate processing even if later steps fail
      const { error: insertError } = await supabase
        .from('webhook_events')
        .insert({
          provider_reference: providerRef,
          event_type: event.event
        })
        
      if (insertError) {
        return NextResponse.json({ status: 'already_processed' })
      }
    }

    if (event.event === 'subscription.create') {
      const metadata = event.data?.metadata || event.data?.customer?.metadata
      if (metadata && metadata.organization_id) {
        // Use exact next_payment_date if provided, else fallback to 30 days
        const nextPaymentDate = event.data.next_payment_date 
          ? new Date(event.data.next_payment_date).toISOString() 
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

        await supabase
          .from('organizations')
          .update({
            subscription_status: 'active',
            subscription_plan: event.data.plan?.plan_code || 'pro',
            current_period_end: nextPaymentDate
          })
          .eq('id', metadata.organization_id)
      }
    }

    if (event.event === 'subscription.disable') {
      const metadata = event.data?.metadata || event.data?.customer?.metadata
      if (metadata && metadata.organization_id) {
        await supabase
          .from('organizations')
          .update({
            subscription_status: 'canceled'
          })
          .eq('id', metadata.organization_id)
      }
    }

      if (event.event === 'charge.success') {
      const metadata = event.data.metadata
      const amountStr = formatCurrency(event.data.amount, 'NGN')
      
      if (metadata && metadata.is_subscription && metadata.organization_id) {
        // This is a successful recurring charge!
        const nextPaymentDate = event.data.next_payment_date 
          ? new Date(event.data.next_payment_date).toISOString() 
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          
        await supabase
          .from('organizations')
          .update({ 
            subscription_status: 'active',
            current_period_end: nextPaymentDate
          })
          .eq('id', metadata.organization_id)
          
        if (event.data.customer?.email) {
          const { sendEmailNotification } = await import('@/lib/notifications/email')
          await sendEmailNotification(
            event.data.customer.email, 
            'Your OurMenu OS Subscription Receipt', 
            `Your subscription has been successfully renewed. You were charged ${amountStr}.\n\nThank you for using OurMenu OS!`
          )
        }
      } else if (metadata && metadata.is_addon && metadata.addon_type === 'extra_page' && metadata.organization_id) {
        // This is a successful one-off add-on purchase
        const { data: orgRaw } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', metadata.organization_id)
          .single()
        
        const org = orgRaw as { extra_pages_purchased?: number } | null;
          
        if (org) {
          const updatePayload: { extra_pages_purchased?: number } = {
            extra_pages_purchased: (org.extra_pages_purchased || 0) + 1
          };
          await supabase
            .from('organizations')
            .update(updatePayload)
            .eq('id', metadata.organization_id)
            
          if (event.data.customer?.email) {
            const { sendEmailNotification } = await import('@/lib/notifications/email')
            await sendEmailNotification(
              event.data.customer.email, 
              'Receipt for OurMenu OS Add-on', 
              `Your purchase of 1 Extra Custom Page was successful. You were charged ${amountStr}.\n\nThank you for using OurMenu OS!`
            )
          }
        }
      } else if (metadata && metadata.is_iou_repayment && metadata.organization_id && metadata.customer_id) {
        // This is a successful IOU Repayment
        
        // 1. Record the repayment transaction
        await supabase.from('iou_transactions').insert({
          organization_id: metadata.organization_id,
          customer_id: metadata.customer_id,
          type: 'repayment',
          amount_minor: event.data.amount,
          reference: event.data.reference
        });

        // 2. Decrement the customer's credit_balance_minor
        // We use an RPC call or fetch and update if no RPC exists. We will fetch and update to keep it simple.
        const { data: customer } = await supabase
          .from('customer_profiles')
          .select('credit_balance_minor')
          .eq('id', metadata.customer_id)
          .single()
          
        if (customer) {
          const newBalance = Math.max(0, (customer.credit_balance_minor || 0) - event.data.amount)
          await supabase
            .from('customer_profiles')
            .update({ credit_balance_minor: newBalance })
            .eq('id', metadata.customer_id)
        }

        // 3. Mark any matching pending installments as paid
        await supabase
          .from('iou_installments')
          .update({ status: 'paid' })
          .eq('organization_id', metadata.organization_id)
          .eq('customer_id', metadata.customer_id)
          .eq('status', 'pending')
          // Optionally, we could match by amount or reference if we stored it, but marking all pending as paid or partial is complex. For now, mark all pending as paid if they made a payment (assuming single active link).
      }
    }

    if (event.event === 'invoice.payment_failed') {
      const metadata = event.data?.metadata || event.data?.customer?.metadata || event.data?.subscription?.metadata
      if (metadata && metadata.organization_id) {
        await supabase
          .from('organizations')
          .update({
            subscription_status: 'past_due'
          })
          .eq('id', metadata.organization_id)
          
        if (event.data.customer?.email) {
          const { sendEmailNotification } = await import('@/lib/notifications/email')
          await sendEmailNotification(
            event.data.customer.email, 
            'Action Required: Your OurMenu OS Subscription Renewal Failed', 
            `We attempted to renew your subscription but the charge failed. Please update your payment method to avoid service interruption.\n\nThank you for using OurMenu OS!`
          )
        }
      }
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Webhook processing error:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
