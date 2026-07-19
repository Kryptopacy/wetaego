import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
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

    let isAuthorized = !!membership
    if (!membership) {
      // Fallback: Check if they are the creator of the organization
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', organizationId)
        .eq('created_by', user.id)
        .single()
      
      if (org) isAuthorized = true
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = await createAdminClient()

    if (action === 'generate_payment_link') {
      if (!amountDueMinor || amountDueMinor <= 0) {
        return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
      }

      // 1. Get customer details
      const { data: customer } = await adminClient
        .from('customer_profiles')
        .select('email')
        .eq('id', customerId)
        .single()

      if (!customer?.email) {
        return NextResponse.json({ error: 'Customer email not found' }, { status: 400 })
      }

      // 3. Generate unique reference
      const reference = `iou_${organizationId.substring(0,8)}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`

      // 4. Create an installment record BEFORE initiating payment so we have its ID
      const { data: installment, error: insertError } = await adminClient
        .from('iou_installments')
        .insert({
          organization_id: organizationId,
          customer_id: customerId,
          amount_due_minor: amountDueMinor,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          status: 'pending'
        })
        .select()
        .single()

      if (insertError) throw insertError

      // 5. Initiate payment via Paystack, passing the installment ID in metadata
      const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/iou/callback` // Or some generic success page
      
      const { data: locationData } = await supabase
        .from('locations')
        .select('currency_code')
        .eq('organization_id', organizationId)
        .limit(1)
        .single()
        
      const currency = locationData?.currency_code || 'NGN'
      
      const { authorizationUrl } = await paystackProvider.initiatePayment({
        amountMinor: amountDueMinor,
        currency: currency,
        customerEmail: customer.email,
        reference,
        callbackUrl,
        metadata: {
          is_iou_repayment: true,
          organization_id: organizationId,
          customer_id: customerId,
          installment_id: installment.id
        }
      })

      // 6. Update the installment record with the generated payment link
      await adminClient
        .from('iou_installments')
        .update({ payment_link: authorizationUrl })
        .eq('id', installment.id)

      return NextResponse.json({ success: true, authorizationUrl, installment })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('IOU API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
