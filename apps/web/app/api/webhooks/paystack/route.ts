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
      const reference = event.data.reference // this is our order.id
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

      // 1. Verify Amount
      // Paystack amount is in kobo/minor units. Compare exactly.
      if (event.data.amount < order.total_amount_minor) {
        // Underpayment fraud detected!
        await supabase
          .from('orders')
          .update({ status: 'failed' })
          .eq('id', reference)
          
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
      }

      // 2. Fetch Organization Settings to get phone number (for WhatsApp)
      // Note: We bypass strict RLS here since it's a server action, or use service_role if needed.
      const { data: org } = await supabase
        .from('organizations')
        .select('phone, name')
        .eq('id', order.organization_id)
        .single()

      // 3. Mark as Paid (This triggers the Supabase Realtime channel on the Dashboard)
      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', reference)

      // 4. Record the webhook as processed to prevent duplicates
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
