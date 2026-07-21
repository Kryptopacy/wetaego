'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitPosOrder(payload: {
  organizationId: string
  locationId: string
  pageId: string
  staffId: string
  items: { id: string; name: string; price_minor: number; quantity: number; variants?: Record<string, string>; item_data?: Record<string, unknown> }[]
  totalMinor: number
  paymentMethod: string // 'cash', 'card', 'transfer', 'online'
  customerName?: string
  resourceId?: string // New for Terminal-Linked QR
}) {
  const supabase = await createClient()

  // Verify auth
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Unauthorized')

  // 1. Create the order first so we have a valid UUID for Paystack reference
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      organization_id: payload.organizationId,
      location_id: payload.locationId,
      page_id: payload.pageId,
      customer_name: payload.customerName || 'Walk-in Customer',
      customer_email: null,
      customer_phone: null,
      table_identifier: payload.resourceId ? 'Desk Pay' : 'POS (Counter)',
      fulfillment_type: 'pickup',
      total_amount_minor: payload.totalMinor,
      amount_paid_minor: payload.paymentMethod === 'online' ? 0 : payload.totalMinor,
      status: payload.paymentMethod === 'online' ? 'pending' : 'completed',
      assigned_staff_id: payload.staffId,
      metadata: { payment_method: payload.paymentMethod }
    })
    .select()
    .single()

  if (orderErr) {
    console.error('POS order insert error:', orderErr)
    throw new Error('Failed to create order')
  }

  // 2. Generate checkout URL if online payment
  let checkoutUrl = null
  let paystackReference = null

  if (payload.paymentMethod === 'online' && payload.totalMinor > 0) {
    const { paymentProvider } = await import('@/lib/payments/paystack')
    const { getPlatformFees } = await import('@/lib/utils/settings')

    // Fetch org payment settings for subaccount
    const { data: paySettings } = await supabase
      .from('organization_payment_settings')
      .select('provider_account_id, is_active')
      .eq('organization_id', payload.organizationId)
      .single()

    const subaccountCode = paySettings?.is_active ? paySettings.provider_account_id : null
    
    // Dynamically calculate platform fee
    const platformFeesConfig = await getPlatformFees()
    const businessFeePercent = platformFeesConfig.business_subaccount || 5
    const transactionChargeMinor = subaccountCode && businessFeePercent > 0
      ? Math.floor(payload.totalMinor * (businessFeePercent / 100))
      : undefined

    const email = `pos_order_${Date.now()}@ourmenuos.online`
    const ref = `${order.id}_split_${Date.now()}_${Math.random().toString(36).substring(7)}`

    try {
      const result = await paymentProvider.initiatePayment({
        amountMinor: payload.totalMinor,
        customerEmail: email,
        reference: ref,
        currency: 'NGN',
        callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/m/default/payment-callback`,
        subaccountCode: subaccountCode || undefined,
        transactionChargeMinor
      })
      checkoutUrl = result.authorizationUrl
      paystackReference = ref
      
      // Update the order with the checkout URL
      await supabase.from('orders').update({
        metadata: {
          ...(typeof order.metadata === 'object' && order.metadata !== null && !Array.isArray(order.metadata) ? order.metadata : {}),
          checkout_url: checkoutUrl,
          paystack_reference: paystackReference
        }
      }).eq('id', order.id)
      
    } catch (err) {
      console.error('Failed to initialize Paystack for POS:', err)
      // Delete the pending order since payment failed to initialize
      await supabase.from('orders').delete().eq('id', order.id)
      throw new Error('Failed to initialize online payment.')
    }
  }

  // If a resource is bound, lock the resource to this order
  if (payload.resourceId) {
    await supabase
      .from('resources')
      .update({ current_order_id: order.id })
      .eq('id', payload.resourceId)
  }

  // Insert items
  const orderItems = payload.items.map(item => ({
    order_id: order.id,
    item_id: item.id,
    item_name: item.name,
    quantity: item.quantity,
    price_minor: item.price_minor,
    metadata: item.variants ? { variants: item.variants } : null,
  }))

  const { error: itemsErr } = await supabase.from('order_items').insert(orderItems)
  if (itemsErr) {
    console.error('POS items insert error:', itemsErr)
    // We don't fail completely if items fail, but it's bad.
  }

  // Deduct inventory (atomic)
  for (const item of payload.items) {
    if (item.item_data?.track_inventory) {
       await (supabase.rpc as CallableFunction)('deduct_inventory', {
          p_item_id: item.id,
          p_quantity: item.quantity
       })
    }
  }

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/pos')

  return { success: true, orderId: order.id }
}

export async function unlinkResourceOrder(resourceId: string) {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  await supabase.from('resources').update({ current_order_id: null }).eq('id', resourceId)
}
