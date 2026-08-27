import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase/server'
import { paystackProvider } from '@/lib/payments/paystack'
import { formatCurrency } from '@/lib/utils/currency'

export async function POST(req: Request) {
  const signature = req.headers.get('x-paystack-signature')

  const bodyString = await req.text()

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  if (!paystackProvider.validateWebhookSignature(bodyString, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(bodyString)

  // Only process subscription-related events
  // Paystack fires: subscription.create, subscription.disable, charge.success (for recurring)
  
  const supabase = await createAdminClient()

  try {
    // Idempotency Check using the exact cryptographic signature for bulletproof retries
    const providerRef = event.data?.reference || event.data?.subscription_code || signature
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
            current_period_end: nextPaymentDate,
            monthly_free_credits_used: 0
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
            current_period_end: nextPaymentDate,
            monthly_free_credits_used: 0
          })
          .eq('id', metadata.organization_id)
          
        if (event.data.customer?.email) {
          const { sendEmailNotification } = await import('@/lib/notifications/email')
          await sendEmailNotification(
            event.data.customer.email, 
            'Your WETAEGO Subscription Receipt', 
            `Your subscription has been successfully renewed. You were charged ${amountStr}.\n\nThank you for using WETAEGO!`
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
              'Receipt for WETAEGO Add-on', 
              `Your purchase of 1 Extra Custom Page was successful. You were charged ${amountStr}.\n\nThank you for using WETAEGO!`
            )
          }
        }
      } else if (metadata && metadata.is_iou_repayment && metadata.organization_id && metadata.customer_id && metadata.installment_id) {
        // This is a successful IOU Repayment
        
        const { error: rpcError } = await supabase.rpc('process_iou_repayment', {
          p_installment_id: metadata.installment_id,
          p_organization_id: metadata.organization_id,
          p_customer_id: metadata.customer_id,
          p_amount_minor: event.data.amount,
          p_reference: event.data.reference
        })

        if (rpcError) {
          console.error('IOU Repayment RPC Error in Billing:', rpcError)
          return NextResponse.json({ error: 'Failed to process IOU repayment' }, { status: 500 })
        }
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
            'Action Required: Your WETAEGO Subscription Renewal Failed', 
            `We attempted to renew your subscription but the charge failed. Please update your payment method to avoid service interruption.\n\nThank you for using WETAEGO!`
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
