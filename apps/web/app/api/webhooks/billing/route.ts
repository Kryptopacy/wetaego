import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

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
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    if (event.event === 'subscription.create') {
      // Find org by checking metadata of the transaction that started this sub?
      // Actually, Paystack subscription objects might not always have the metadata.
      // But we passed metadata when initializing the transaction.
      // For safety, we rely on the `verify` route for instant UI update, but we log the webhook here.
      console.log('Subscription created:', event.data.subscription_code)
    }

    if (event.event === 'subscription.disable') {
      // We need to map subscription_code back to an org.
      // If we saved subscription_code in organizations, we could disable it here.
      // For MVP, we can assume the charge failure will just fail the verification.
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
        const { data: org } = await supabase
          .from('organizations')
          .select('extra_pages_purchased')
          .eq('id', metadata.organization_id)
          .single()
          
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

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
