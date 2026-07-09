'use server'

import { createClient } from '@/lib/supabase/server'

export async function getTrackingDetailsAction(locationId: string, trackingCode: string) {
  const supabase = await createClient()
  
  // Find order by tracking code and location's organization
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id,
      tracking_code,
      status,
      total_amount_minor,
      amount_paid_minor,
      created_at,
      customer_name,
      order_milestones (
        id,
        title,
        description,
        is_completed,
        created_at,
        completed_at
      ),
      order_items (
        item_name,
        quantity
      )
    `)
    .eq('tracking_code', trackingCode)
    .single()

  if (error || !order) {
    return { success: false, error: 'Order not found or invalid tracking code.' }
  }

  // Double check the location matches the org
  // In a real app we'd query the org_id directly in the first query, 
  // but since we only have locationId on the storefront side:
  const { data: location } = await supabase
    .from('locations')
    .select('organization_id')
    .eq('id', locationId)
    .single()

  // For security, if this order belongs to a different org, pretend it doesn't exist
  // We'd normally check if order.organization_id === location.organization_id
  // but we didn't select organization_id on the order above.
  
  const { data: orderOrgCheck } = await supabase
    .from('orders')
    .select('organization_id')
    .eq('id', order.id)
    .single()
    
  if (orderOrgCheck?.organization_id !== location?.organization_id) {
    return { success: false, error: 'Order not found.' }
  }

  return {
    success: true,
    data: {
      id: order.id,
      tracking_code: order.tracking_code,
      status: order.status,
      total_amount_minor: order.total_amount_minor,
      amount_paid_minor: order.amount_paid_minor,
      created_at: order.created_at,
      customer_name: order.customer_name,
      milestones: order.order_milestones.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      items: order.order_items
    }
  }
}

export async function sendMessageAction(locationId: string, trackingCode: string, message: string) {
  const supabase = await createClient()

  // Verify order exists and get org ID
  const { data: order, error } = await supabase
    .from('orders')
    .select('organization_id')
    .eq('tracking_code', trackingCode)
    .single()

  if (error || !order) {
    return { success: false, error: 'Order not found.' }
  }

  // Create service request
  const { error: insertError } = await supabase
    .from('service_requests')
    .insert({
      organization_id: order.organization_id,
      location_id: locationId,
      table_identifier: trackingCode, // Using tracking code as identifier
      request_type: 'custom' as never,
      custom_request_text: message,
      urgency_tier: 'standard',
      status: 'pending'
    })

  if (insertError) {
    return { success: false, error: 'Failed to send message.' }
  }

  return { success: true }
}

export async function generateBalancePaymentLinkAction(locationId: string, trackingCode: string) {
  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, organization_id, total_amount_minor, amount_paid_minor, customer_email')
    .eq('tracking_code', trackingCode)
    .single()

  if (error || !order) return { success: false, error: 'Order not found' }

  const balanceMinor = order.total_amount_minor - (order.amount_paid_minor || 0)
  if (balanceMinor <= 0) return { success: false, error: 'Order is already fully paid' }

  const { data: loc } = await supabase
    .from('locations')
    .select('manual_payment_enabled, manual_payment_bank_name, manual_payment_account_name, manual_payment_account_number, manual_payment_instructions')
    .eq('id', locationId)
    .single()

  const { data: paySettings } = await supabase
    .from('organization_payment_settings')
    .select('provider_account_id, is_active')
    .eq('organization_id', order.organization_id)
    .single()

  const isPaystackLive = paySettings?.is_active && paySettings?.provider_account_id

  if (isPaystackLive) {
    try {
      const { paymentProvider } = await import('@/lib/payments/paystack')
      const { getPlatformFees } = await import('@/lib/utils/settings')
      
      const email = order.customer_email || `order_${order.id}@ourmenuos.online`
      const reference = `${order.id}_balance_${crypto.randomUUID().slice(0, 8)}`

      const platformFeesConfig = await getPlatformFees()
      const businessFeePercent = platformFeesConfig.business_subaccount || 5
      const transactionChargeMinor = businessFeePercent > 0
        ? Math.floor(balanceMinor * (businessFeePercent / 100))
        : undefined

      const { data: pageData } = await supabase.from('location_pages').select('slug').eq('location_id', locationId).limit(1).single()
      const slug = pageData?.slug || 'default'

      const { authorizationUrl: checkoutUrl } = await paymentProvider.initiatePayment({
        amountMinor: balanceMinor,
        customerEmail: email,
        reference: reference,
        currency: 'NGN',
        callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/m/${slug}/track?qr_id=${trackingCode}`,
        subaccountCode: paySettings.provider_account_id || undefined,
        transactionChargeMinor
      })

      if (checkoutUrl) {
        return { success: true, data: { checkoutUrl } }
      }
    } catch (err) {
      console.error('Paystack initialization failed, falling back to manual', err)
      // Fallback to manual if Paystack fails
    }
  }

  // Fallback to Manual Payment if Paystack is inactive, failed, or if manual is explicitly configured and Paystack isn't available
  if (loc?.manual_payment_enabled && loc.manual_payment_account_number) {
    return {
      success: true,
      data: {
        manualDetails: {
          bankName: loc.manual_payment_bank_name,
          accountName: loc.manual_payment_account_name,
          accountNumber: loc.manual_payment_account_number,
          instructions: loc.manual_payment_instructions
        }
      }
    }
  }

  return { success: false, error: 'No online or manual payment methods are currently available for this business.' }
}
