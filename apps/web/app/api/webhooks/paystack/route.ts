/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    // 1. Verify Signature
    const secret = process.env.PAYSTACK_SECRET_KEY || ''
    const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(rawBody)

    // 2. Process Charge Success
    if (event.event === 'charge.success') {
      // The reference comes back as orderId_split_randomHash. We strip it back to orderId.
      const rawReference = event.data.reference
      const reference = rawReference.split('_split_')[0] 
      const amountPaidMinor = event.data.amount

      const supabase: any = await createClient()

      // Idempotency Check: Don't process if already in webhook_events
      const { data: existingEvent } = await supabase
        .from('webhook_events')
        .select('id')
        .eq('provider_reference', event.data.reference)
        .single()
        
      if (existingEvent) {
        return NextResponse.json({ status: 'already_processed' }, { status: 200 })
      }

      // Fetch the order
      const { data: order } = await supabase
        .from('orders')
        .select('id, status, total_amount_minor, organization_id')
        .eq('id', reference)
        .single()

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      if (order.status === 'paid' || order.status === 'completed') {
        // Fallback catch if it was paid but somehow not in webhook_events
        return NextResponse.json({ status: 'already_processed' }, { status: 200 })
      }

      // Insert payment into order_payments ledger. The DB trigger handles updating the order status.
      const { error: paymentError } = await supabase
        .from('order_payments')
        .insert({
          order_id: reference,
          amount_minor: event.data.amount,
          provider_reference: event.data.reference
        })

      if (paymentError) {
        console.error('Failed to insert payment:', paymentError)
        return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
      }

      // Record the webhook as processed to prevent duplicates
      await supabase
        .from('webhook_events')
        .insert({
          provider_reference: event.data.reference,
          event_type: 'charge.success'
        })

      return NextResponse.json({ status: 'success' }, { status: 200 })
    }

    return NextResponse.json({ status: 'ignored' }, { status: 200 })

  } catch (error: any) {
    console.error('Webhook Error:', error.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
