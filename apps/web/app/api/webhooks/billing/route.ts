import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { Database } from '@/lib/supabase/types'

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  const signature = req.headers.get('x-paystack-signature')

  const bodyString = await req.text()

  if (!secret) return NextResponse.json({ error: 'Missing Paystack Secret Key' }, { status: 500 })

  // Verify the webhook signature
  const hash = crypto.createHmac('sha512', secret).update(bodyString).digest('hex')
  if (hash !== signature) {
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
    }

    if (event.event === 'subscription.create') {
      console.log('Subscription created:', event.data.subscription_code)
    }

    if (event.event === 'subscription.disable') {
      console.log('Subscription disabled:', event.data.subscription_code)
    }

    if (event.event === 'charge.success') {
      const metadata = event.data.metadata
      if (metadata && metadata.is_subscription && metadata.organization_id) {
        // This is a successful recurring charge!
        await supabase
          .from('organizations')
          .update({ 
            subscription_status: 'active',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // roughly 30 days
          })
          .eq('id', metadata.organization_id)
      } else if (metadata && metadata.is_addon && metadata.addon_type === 'extra_page' && metadata.organization_id) {
        // This is a successful one-off add-on purchase
        const { data: orgRaw } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', metadata.organization_id)
          .single()
        
        const org = orgRaw as { extra_pages_purchased?: number } | null;
          
        if (org) {
          await supabase
            .from('organizations')
            .update({
              extra_pages_purchased: (org.extra_pages_purchased || 0) + 1
            })
            .eq('id', metadata.organization_id)
        }
      }
    }

    if (providerRef) {
      await supabase
        .from('webhook_events')
        .insert({
          provider_reference: providerRef,
          event_type: event.event
        })
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
