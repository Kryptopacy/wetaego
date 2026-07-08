import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import * as Sentry from '@sentry/nextjs'
import { formatCurrency } from '@/lib/utils/currency'

const resendClient = new Resend(process.env.RESEND_API_KEY)

export const dynamic = 'force-dynamic' // Ensure this runs dynamically
// Vercel cron configuration: runs every 15 minutes
// vercel.json: { "crons": [{ "path": "/api/cron/abandoned-carts", "schedule": "*/15 * * * *" }] }

export async function GET(req: Request) {
  // Optional: Verify Vercel Cron Secret if deployed
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // We allow local bypass if CRON_SECRET isn't set, but secure it in production
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  const supabase = await createAdminClient()

  try {
    // Find all pending orders older than 15 mins, newer than 24h, with an email
    // We track recovery by checking notes — orders that had recovery sent have 'recovery_email_sent' in their notes
    const { data: abandonedOrders, error } = await supabase
      .from('orders')
      .select('id, customer_email, customer_name, total_amount_minor, created_at, abandoned_recovery_sent, locations(name, slug, currency_code), order_items(item_name, quantity, price_minor)')
      .eq('status', 'pending')
      .not('customer_email', 'is', null)
      .eq('abandoned_recovery_sent', false)
      .lt('created_at', new Date(Date.now() - 15 * 60000).toISOString()) // older than 15 mins
      .gt('created_at', new Date(Date.now() - 24 * 60 * 60000).toISOString()) // but less than 24h old

    if (error) throw error

    if (!abandonedOrders || abandonedOrders.length === 0) {
      return NextResponse.json({ status: 'success', count: 0, message: 'No abandoned carts found' })
    }

    const emailsSent = []

    for (const order of abandonedOrders) {
      const location = order.locations as { name?: string; slug?: string; currency_code?: string }
      const orgName = location?.name || 'OurMenu Partner'
      const currency = location?.currency_code || 'NGN'
      const payLink = `${process.env.NEXT_PUBLIC_SITE_URL}/pay/${order.id}`

      try {
        await resendClient.emails.send({
          from: 'OurMenu Orders <hello@ourmenuos.online>',
          to: order.customer_email!,
          subject: `You left something behind at ${orgName} 🍽️`,
          html: `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
              <h2 style="color: #111;">Hi ${order.customer_name || 'there'},</h2>
              <p style="color: #444; font-size: 16px;">We noticed you started an order at <strong>${orgName}</strong> but didn't finish checking out.</p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #333;">Your Cart:</h3>
                <ul style="padding-left: 20px; color: #555;">
                  ${order.order_items.map((item: Record<string, unknown>) => `<li>${item.quantity}x ${item.item_name}</li>`).join('')}
                </ul>
                <p style="font-weight: bold; margin-bottom: 0;">Total: ${formatCurrency(order.total_amount_minor, currency)}</p>
              </div>

              <p style="color: #444; font-size: 16px;">Your items are waiting for you! Click below to complete your payment and send your order straight to the kitchen.</p>
              
              <a href="${payLink}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
                Complete My Order
              </a>
            </div>
          `
        })

        // Mark as sent
        await supabase
          .from('orders')
          .update({ abandoned_recovery_sent: true })
          .eq('id', order.id)

        emailsSent.push(order.id)
      } catch (err) {
        console.error(`Failed to send recovery email to ${order.customer_email}:`, err)
      }
    }

    return NextResponse.json({ 
      status: 'success', 
      count: emailsSent.length, 
      recovered_orders: emailsSent 
    })

  } catch (error) {
    Sentry.captureException(error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
