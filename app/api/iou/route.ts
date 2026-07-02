import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paystackProvider } from '@/lib/payments/paystack'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { organizationId, customerId, amountDueMinor, action } = body

    if (!organizationId || !customerId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify staff has access to this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (action === 'generate_payment_link') {
      if (!amountDueMinor || amountDueMinor <= 0) {
        return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
      }

      // 1. Get customer details
      const { data: customer } = await supabase
        .from('customer_profiles')
        .select('email')
        .eq('id', customerId)
        .single()

      if (!customer?.email) {
        return NextResponse.json({ error: 'Customer email not found' }, { status: 400 })
      }

      // 2. Generate unique reference
      const reference = `iou_${organizationId.substring(0,8)}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`

      // 3. Initiate payment via Paystack
      const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/iou/callback` // Or some generic success page
      
      const { authorizationUrl } = await paystackProvider.initiatePayment({
        amountMinor: amountDueMinor,
        currency: 'NGN', // Assuming NGN for now, ideally fetched from locations
        customerEmail: customer.email,
        reference,
        callbackUrl,
        metadata: {
          is_iou_repayment: true,
          organization_id: organizationId,
          customer_id: customerId,
        }
      })

      // 4. Create an installment record linked to this payment link
      const { data: installment, error: insertError } = await supabase
        .from('iou_installments')
        .insert({
          organization_id: organizationId,
          customer_id: customerId,
          amount_due_minor: amountDueMinor,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          payment_link: authorizationUrl,
          status: 'pending'
        })
        .select()
        .single()

      if (insertError) throw insertError

      return NextResponse.json({ success: true, authorizationUrl, installment })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('IOU API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
