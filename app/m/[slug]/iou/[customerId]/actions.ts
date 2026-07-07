'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { paystackProvider } from '@/lib/payments/paystack'
import crypto from 'crypto'

export async function initiateIouPayment(
  organizationId: string,
  customerId: string,
  amountDueMinor: number,
  currency: string
) {
  if (!amountDueMinor || amountDueMinor <= 0) {
    return { error: 'Invalid amount' }
  }

  const supabase = await createAdminClient()

  // 1. Get customer details
  const { data: customer } = await supabase
    .from('customer_profiles')
    .select('email')
    .eq('id', customerId)
    .single()

  if (!customer?.email) {
    return { error: 'Customer email not found' }
  }

  // 2. Generate unique reference
  const reference = `iou_${organizationId.substring(0,8)}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`

  // 3. Create an installment record
  const { data: installment, error: insertError } = await supabase
    .from('iou_installments')
    .insert({
      organization_id: organizationId,
      customer_id: customerId,
      amount_due_minor: amountDueMinor,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending'
    })
    .select()
    .single()

  if (insertError) {
    console.error('Insert Error:', insertError)
    return { error: 'Failed to create payment record' }
  }

  // 4. Initiate payment via Paystack
  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/m` // Could be improved

  try {
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

    // 5. Update the installment record
    await supabase
      .from('iou_installments')
      .update({ payment_link: authorizationUrl })
      .eq('id', installment.id)

    return { authorizationUrl }
  } catch (error) {
    console.error('Paystack Error:', error)
    return { error: 'Failed to initialize payment gateway' }
  }
}
