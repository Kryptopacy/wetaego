'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { FeedbackEmail } from '@/emails/feedback-email'
import { waitUntil } from '@vercel/functions'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy')

export async function completeOrderAction(orderId: string) {
  const supabase = await createClient()

  // 1. Fetch order details
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*, organizations(name, slug)')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) {
    return { error: 'Order not found' }
  }

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
    const orgName = (order.organizations as any)?.name || 'the restaurant'
    const orgSlug = (order.organizations as any)?.slug || ''
    const feedbackUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || 'localhost:3000'}/m/${orgSlug}/feedback/${order.id}`

    waitUntil((async () => {
      try {
        await resend.emails.send({
          from: 'OurMenu <onboarding@resend.dev>', // Should use verified domain in prod
          to: order.customer_email!,
          subject: `How was your meal at ${orgName}?`,
          react: FeedbackEmail({ orgName, orderId: order.id, feedbackUrl })
        })
      } catch (err) {
        console.error('Failed to send feedback email:', err)
      }
    })())
  }

  return { success: true }
}


