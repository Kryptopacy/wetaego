import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentProvider } from '@/lib/payments/paystack'
import { isAdminEmail } from '@/lib/utils/admin'

// This will use the generic paymentProvider mapped to paystackProvider behind the scenes.
// Actually, it's safer to directly import paystackProvider so we can ensure useTestKeys is supported.
import { paystackProvider } from '@/lib/payments/paystack'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!isAdminEmail(userData?.user?.email)) {
      return NextResponse.json({ error: 'Unauthorized. Superadmin only.' }, { status: 401 })
    }

    const { type } = await req.json()

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const HOST = origin.endsWith('/') ? origin.slice(0, -1) : origin
    const adminEmail = userData.user?.email || 'kryptopacy@gmail.com'

    let amountMinor = 0
    let metadata = {}
    
    // Create dummy parameters based on type
    if (type === 'subscription') {
      amountMinor = 6900000 // ₦69,000
      metadata = {
        payment_type: 'subscription',
        plan: 'pro',
        organization_id: 'test_org_id_123'
      }
    } else if (type === 'credits') {
      amountMinor = 1500000 // ₦15,000 for bundle
      metadata = {
        payment_type: 'credits',
        credits: 50,
        organization_id: 'test_org_id_123'
      }
    } else if (type === 'order') {
      amountMinor = 1500000 // ₦15,000
      metadata = {
        payment_type: 'order',
        order_id: 'test_order_123',
        business_slug: 'test_business'
      }
    } else if (type === 'split') {
      amountMinor = 500000 // ₦5,000 fractional split
      metadata = {
        payment_type: 'iou',
        iou_id: 'test_iou_123',
        parent_order_id: 'test_order_123'
      }
    } else {
      return NextResponse.json({ error: 'Invalid test type' }, { status: 400 })
    }

    const reference = `test_${type}_${Date.now()}_${Math.random().toString(36).substring(7)}`

    const { authorizationUrl } = await paystackProvider.initiatePayment({
      amountMinor,
      currency: 'NGN',
      customerEmail: adminEmail,
      reference,
      callbackUrl: `${HOST}/dashboard/admin/tester`,
      metadata: {
        ...metadata,
        is_test_mode: true
      },
      useTestKeys: true // Crucial: explicitly flag this as a test
    })

    return NextResponse.json({ url: authorizationUrl })

  } catch (err: any) {
    console.error('Tester API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
