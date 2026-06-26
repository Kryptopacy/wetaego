'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { FeedbackEmail } from '@/emails/feedback-email'
import { waitUntil } from '@vercel/functions'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy')

async function requireOrderAuth(orderId: string) {
  const supabase = await createClient()
  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData?.user) {
    throw new Error('Not authenticated')
  }

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
    .eq('user_id', userData.user.id)
    .single()

  if (!member) {
    // Check if they are the creator
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', order.organization_id)
      .eq('created_by', userData.user.id)
      .single()
    if (!org) {
      throw new Error('Unauthorized')
    }
  }

  return { supabase, user: userData.user, order }
}

export async function completeOrderAction(orderId: string) {
  try {
    const { supabase, order } = await requireOrderAuth(orderId)

    // 2. Update status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderId)

    if (updateError) {
      return { error: 'Failed to update order status' }
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
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function markOrderPaidOffline(orderId: string) {
  try {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      return { success: true }
    }

    const { supabase } = await requireOrderAuth(orderId)

    // 2. Update status to paid
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderId)

    if (updateError) {
      return { error: 'Failed to update order status' }
    }

    // 3. Log the offline payment
    await supabase.from('order_payments').insert({
      order_id: orderId,
      amount_minor: 0, // Recorded as offline, amount is symbolic here as the business verified it
      provider_reference: `offline_${Date.now()}`
    })

    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

