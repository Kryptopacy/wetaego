/**
 * Pending Payment Reconciliation — Supabase Edge Function
 *
 * Runs every 30 minutes via pg_cron (or Supabase scheduled functions).
 * For every order / booking that has a payment_reference but is still
 * unpaid and is older than 15 minutes, it calls Paystack's verify API
 * to check the real status and updates the DB accordingly.
 *
 * This is the safety net when:
 *  - Paystack was down when the webhook should have fired
 *  - Our server was down when the webhook arrived
 *  - The customer completed payment but our callback redirect failed
 *
 * Deploy: supabase functions deploy reconcile-payments
 * Schedule: add to supabase/migrations as a pg_cron job (see bottom of file)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY')!
const RECONCILE_AFTER_MINUTES = 15
const ABANDON_AFTER_HOURS = 24

Deno.serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const cutoff = new Date(Date.now() - RECONCILE_AFTER_MINUTES * 60 * 1000).toISOString()
  const abandonCutoff = new Date(Date.now() - ABANDON_AFTER_HOURS * 60 * 60 * 1000).toISOString()

  // 1. Gather all pending orders with references
  const { data: pendingOrders } = await supabase
    .from('orders')
    .select('id, payment_reference, total_amount_minor')
    .eq('status', 'pending')
    .not('payment_reference', 'is', null)
    .lt('created_at', cutoff)

  // 2. Gather all pending bookings with references
  const { data: pendingBookings } = await supabase
    .from('page_bookings')
    .select('id, payment_reference, total_amount_minor')
    .eq('payment_status', 'unpaid')
    .not('payment_reference', 'is', null)
    .lt('created_at', cutoff)

  const results = { orders: { reconciled: 0, abandoned: 0 }, bookings: { reconciled: 0, abandoned: 0 } }

  // ── Reconcile orders ──────────────────────────────────────────────────────────
  for (const order of pendingOrders ?? []) {
    if (!order.payment_reference) continue

    try {
      const verification = await verifyWithPaystack(order.payment_reference)

      if (verification.status === 'success') {
        await supabase
          .from('orders')
          .update({ status: 'paid', amount_paid_minor: verification.amount_paid })
          .eq('id', order.id)
        results.orders.reconciled++
      } else if (verification.status === 'failed' || verification.status === 'abandoned') {
        await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', order.id)
        results.orders.abandoned++
      }
      // 'pending' — Paystack hasn't processed it yet, check again next run
    } catch (err) {
      console.error(`Order ${order.id} reconcile error:`, err)
    }
  }

  // ── Reconcile bookings ────────────────────────────────────────────────────────
  for (const booking of pendingBookings ?? []) {
    if (!booking.payment_reference) continue

    try {
      const verification = await verifyWithPaystack(booking.payment_reference)

      if (verification.status === 'success') {
        const paidStatus = booking.total_amount_minor && verification.amount_paid >= booking.total_amount_minor
          ? 'fully_paid'
          : 'deposit_paid'

        await supabase
          .from('page_bookings')
          .update({
            payment_status: paidStatus,
            status: 'confirmed',
            amount_paid_minor: verification.amount_paid,
          })
          .eq('id', booking.id)
        results.bookings.reconciled++
      } else if (verification.status === 'failed' || verification.status === 'abandoned') {
        // Only auto-cancel if it's very old — otherwise leave as pending_payment
        if (booking.id && new Date(cutoff) < new Date(abandonCutoff)) {
          await supabase
            .from('page_bookings')
            .update({ status: 'cancelled' })
            .eq('id', booking.id)
          results.bookings.abandoned++
        }
      }
    } catch (err) {
      console.error(`Booking ${booking.id} reconcile error:`, err)
    }
  }

  console.log('Reconciliation complete:', results)
  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

// ─── Paystack verify helper (direct fetch — no shared lib in Edge Functions) ───

async function verifyWithPaystack(reference: string) {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    signal: AbortSignal.timeout(8_000),
  })

  if (!res.ok) {
    if (res.status === 404) return { status: 'pending' as const, amount_paid: 0 }
    throw new Error(`Paystack verify HTTP ${res.status}`)
  }

  const data = await res.json()
  const tx = data.data
  const statusMap: Record<string, 'success' | 'failed' | 'abandoned' | 'pending'> = {
    success: 'success',
    failed: 'failed',
    abandoned: 'abandoned',
  }

  return {
    status: statusMap[tx.status] ?? ('pending' as const),
    amount_paid: tx.amount as number,
  }
}

// ─── Schedule this function via pg_cron ────────────────────────────────────────
// Add to a migration file:
// 
// SELECT cron.schedule(
//   'reconcile-pending-payments',
//   '*/30 * * * *',  -- every 30 minutes
//   $$
//   SELECT net.http_post(
//     url := current_setting('app.supabase_url') || '/functions/v1/reconcile-payments',
//     headers := jsonb_build_object(
//       'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
//       'Content-Type', 'application/json'
//     ),
//     body := '{}'::jsonb
//   )
//   $$
// );
// ─────────────────────────────────────────────────────────────────────────────── 
