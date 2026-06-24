'use server'
import { Database } from '@/lib/supabase/types'
type RequestType = NonNullable<Database['public']['Tables']['service_requests']['Row']['request_type']> | 'waiter' | 'bill' | 'cleanup'

import { createClient } from '@/lib/supabase/server'
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
import { revalidatePath } from 'next/cache'

import { paymentProvider } from '@/lib/payments/paystack'
import { sendWhatsAppMessage } from '@/lib/notifications/termii'
import { waitUntil } from '@vercel/functions'

export async function submitServiceRequest(formData: FormData) {
  const supabase = await createClient()

  const orgId = formData.get('organization_id') as string
  const locId = formData.get('location_id') as string
  const tableId = formData.get('table_identifier') as string
  const requestType = formData.get('request_type') as string
  const customRequestText = formData.get('custom_request_text') as string | null
  const urgencyTier = formData.get('urgency_tier') as string || 'standard'

  if (!orgId || !locId || !tableId || !requestType) return

  await supabase.from('service_requests').insert({
    organization_id: orgId,
    location_id: locId,
    table_identifier: tableId,
    request_type: requestType as RequestType,
    custom_request_text: customRequestText,
    urgency_tier: urgencyTier as 'standard' | 'critical',
  })

  // Fetch the location's configured WhatsApp number
  const { data: location } = await supabase
    .from('locations')
    .select('whatsapp_number')
    .eq('id', locId)
    .single()

  const whatsappNumber = location?.whatsapp_number || '08000000000'

  // Fire WhatsApp Notification in the background without blocking the UI
  waitUntil(sendWhatsAppMessage(whatsappNumber, `[${urgencyTier.toUpperCase()}] Table ${tableId} needs a ${requestType}! ${customRequestText || ''}`))
}

export async function processCheckout(
  orgId: string, 
  locationId: string, 
  items: { id: string, name: string, quantity: number, price_minor: number }[], 
  totalAmountMinor: number, 
  tipAmountMinor: number,
  tableIdentifier: string,
  customerNote?: string,
  customerEmail?: string,
  paymentFractionMinor?: number,
  paymentMethod?: 'card' | 'transfer',
  discountAmountMinor?: number,
  idempotencyKey?: string,
  staffSubaccountOverride?: string
) {
  const supabase = await createClient()

  // --- Rate Limiting & Idempotency ---
  const { checkRateLimit, withIdempotency } = await import('@/lib/upstash');
  const { success } = await checkRateLimit('checkout');
  if (!success) {
    throw new Error('Too many requests. Please wait a minute before placing another order.');
  }

  const checkoutLogic = async () => {

  // ----------------------------------------

  // 1. Fetch Payment Settings
  const { data: paySettings } = await supabase
    .from('organization_payment_settings')
    .select('provider_account_id, is_active')
    .eq('organization_id', orgId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const subaccountCode = staffSubaccountOverride || (paySettings?.is_active ? paySettings.provider_account_id : null)

  // 2. Create Order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      organization_id: orgId,
      location_id: locationId,
      customer_name: 'Guest',
      table_identifier: tableIdentifier || 'Takeaway',
      status: 'pending',
      total_amount_minor: totalAmountMinor,
      tip_amount_minor: tipAmountMinor || 0,
      discount_amount_minor: discountAmountMinor || 0,
      customer_note: customerNote || null,
      customer_email: customerEmail || null,
    } as never).select('id').single()

  if (orderError || !order) throw new Error('Failed to create order')

  // 3. Create Order Items
  const orderItemsData = items.map(item => ({
    order_id: order.id,
    item_id: item.id,
    item_name: item.name,
    quantity: item.quantity,
    price_minor: item.price_minor
  }))

  await supabase.from('order_items').insert(orderItemsData)

  // 4. Initialize Paystack Transaction if Active and method is card
  const isPaystackLive = paySettings?.is_active && paySettings?.provider_account_id
  
  if (isPaystackLive && paymentMethod !== 'transfer') {
    const chargeAmountMinor = paymentFractionMinor ?? totalAmountMinor
    const email = customerEmail || `order_${order.id}@ourmenuos.online`
    const { authorizationUrl: checkoutUrl } = await paymentProvider.initiatePayment({
      amountMinor: chargeAmountMinor,
      customerEmail: email,
      reference: order.id,
      currency: 'NGN',
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/bookings/callback`,
      subaccountCode: subaccountCode || undefined,
    })

    return { checkoutUrl, orderId: order.id }
  }

  // Fallback to manual payment: trigger push notification immediately
  const { sendPushToOrg, newOrderNotification } = await import('@/lib/notifications/push')
  waitUntil(sendPushToOrg(orgId, newOrderNotification(tableIdentifier || 'Takeaway', totalAmountMinor)))

    return { orderId: order.id };
  };

  if (idempotencyKey) {
    return await withIdempotency(idempotencyKey, checkoutLogic);
  } else {
    return await checkoutLogic();
  }
}

export async function callStaffFromAi(
  orgId: string,
  locationId: string,
  tableIdentifier: string,
  requestType: 'waiter' | 'bill' | 'cleanup'
) {
  const supabase = await createClient()

  if (!orgId || !locationId || !tableIdentifier || !requestType) {
    return { error: 'Missing required parameters' }
  }

  const { error } = await supabase.from('service_requests').insert({
    organization_id: orgId,
    location_id: locationId,
    table_identifier: tableIdentifier,
    request_type: requestType as RequestType,
  })

  if (error) return { error: error.message }

  // Fetch the location's configured WhatsApp number
  const { data: location } = await supabase
    .from('locations')
    .select('whatsapp_number')
    .eq('id', locationId)
    .single()

  const whatsappNumber = location?.whatsapp_number || '08000000000'

  // Fire WhatsApp Notification in the background without blocking the UI
  waitUntil(sendWhatsAppMessage(whatsappNumber, `Table ${tableIdentifier} needs a ${requestType}!`))

  return { success: true }
}

export async function processExistingOrderPayment(
  orderId: string,
  amountMinor: number
): Promise<{ checkoutUrl?: string; error?: string }> {
  try {
    const supabase = await createClient()

    // Fetch the order to get org info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, organization_id, total_amount_minor, customer_email')
      .eq('id', orderId)
      .single()

    if (orderError || !order) return { error: 'Order not found' }

    // Fetch payment settings for split
    const { data: paySettings } = await supabase
      .from('organization_payment_settings')
      .select('provider_account_id, is_active')
      .eq('organization_id', order.organization_id)
      .single()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const subaccountCode = paySettings?.is_active ? paySettings.provider_account_id : null

    // Initialize Paystack transaction for partial/split payment
    const email = order.customer_email || `order_${orderId}@ourmenuos.online`
    const reference = `${orderId}_split_${crypto.randomUUID().slice(0, 8)}`

    const { authorizationUrl: checkoutUrl } = await paymentProvider.initiatePayment({
      amountMinor: amountMinor,
      customerEmail: email,
      reference: reference,
      currency: 'NGN',
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/bookings/callback`
    })

    return { checkoutUrl }
  } catch (err: unknown) {
    return { error: (err as Error).message || 'Failed to initialize payment' }
  }
}


export async function optInMarketing(orderId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: order } = await supabase
      .from('orders')
      .select('organization_id, customer_email')
      .eq('id', orderId)
      .single()

    if (!order || !order.customer_email) {
      return { error: 'Order or customer email not found' }
    }

    // Upsert into customer_profiles to enable marketing
    const { error } = await supabase
      .from('customer_profiles')
      .upsert({
        organization_id: order.organization_id,
        email: order.customer_email,
        marketing_opt_in: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'organization_id,email' })

    if (error) throw error

    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to opt in' }
  }
}
