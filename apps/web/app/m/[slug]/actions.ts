'use server'
import { Database } from '@/lib/supabase/types'
type RequestType = NonNullable<Database['public']['Tables']['service_requests']['Row']['request_type']> | 'waiter' | 'bill' | 'cleanup'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
import { revalidatePath } from 'next/cache'

import { paymentProvider } from '@/lib/payments/paystack'
import { sendWhatsAppMessage } from '@/lib/notifications/termii'
import { getPlatformFees } from '@/lib/utils/settings'
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
  customerName?: string,
  customerPhone?: string,
  fulfillmentType?: 'table' | 'pickup' | 'delivery' | string,
  deliveryInstructions?: string,
  idempotencyKey?: string,
  staffSubaccountOverride?: string
) {
  const supabase = await createClient()

  // --- Rate Limiting & Idempotency ---
  const { checkRateLimit, withIdempotency } = await import('@/lib/upstash');
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value || 'anonymous';
  const { success } = await checkRateLimit(`checkout:${sessionId}`);
  if (!success) {
    throw new Error('Too many requests. Please wait a minute before placing another order.');
  }

  const checkoutLogic = async () => {
    // 1. Server-side price verification — never trust client-supplied totals
    const itemIds = items.map(i => i.id).filter(Boolean)
    const { data: dbItems, error: dbItemsError } = await supabase
      .from('menu_items')
      .select('id, price_minor')
      .in('id', itemIds)
    
    if (dbItemsError || !dbItems) {
      throw new Error('Could not verify item prices. Please refresh and try again.')
    }

    const priceMap = new Map(dbItems.map(i => [i.id, i.price_minor]))

    // Recalculate authoritative subtotal from DB prices
    const serverSubtotalMinor = items.reduce((sum, item) => {
      return sum + ((priceMap.get(item.id) || 0) * item.quantity)
    }, 0)

    // Apply discount server-side, capped at subtotal to prevent negative totals
    const clampedDiscountMinor = Math.min(discountAmountMinor || 0, serverSubtotalMinor)
    const verifiedTotalMinor = Math.max(0, serverSubtotalMinor - clampedDiscountMinor)

    // Guard: reject if client total deviates >5% from server-computed total (fraud detection)
    const deviation = Math.abs(verifiedTotalMinor - totalAmountMinor) / Math.max(verifiedTotalMinor, 1)
    if (deviation > 0.05 && verifiedTotalMinor > 0) {
      throw new Error('Order total mismatch. Please refresh and try again.')
    }

  // ----------------------------------------

  // 2. Fetch Payment Settings
  const { data: paySettings } = await supabase
    .from('organization_payment_settings')
    .select('provider_account_id, is_active')
    .eq('organization_id', orgId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const subaccountCode = staffSubaccountOverride || (paySettings?.is_active ? paySettings.provider_account_id : null)

  // 3. Create Order using server-verified total
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      organization_id: orgId,
      location_id: locationId,
      customer_name: customerName || 'Guest',
      customer_phone: customerPhone || null,
      table_identifier: tableIdentifier || null,
      fulfillment_type: fulfillmentType || 'table',
      delivery_instructions: deliveryInstructions || null,
      status: 'pending',
      total_amount_minor: verifiedTotalMinor,
      tip_amount_minor: tipAmountMinor || 0,
      discount_amount_minor: clampedDiscountMinor,
      customer_note: customerNote ? customerNote.slice(0, 500) : null,
      customer_email: customerEmail || null,
    } as never).select('id').single()

  if (orderError || !order) throw new Error('Failed to create order')

  // 4. Create Order Items using server-verified prices
  const orderItemsData = items.map(item => ({
    order_id: order.id,
    item_id: item.id,
    item_name: item.name,
    quantity: item.quantity,
    price_minor: priceMap.get(item.id) ?? item.price_minor
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData)
  if (itemsError) {
    // Roll back the order to prevent a paid order with no items
    await supabase.from('orders').delete().eq('id', order.id)
    throw new Error('Failed to save order items. Please try again.')
  }

  // 5. Initialize Paystack Transaction if Active and method is card
  const isPaystackLive = paySettings?.is_active && paySettings?.provider_account_id
  
  if (isPaystackLive && paymentMethod !== 'transfer') {
    // Use verified server total for Paystack — split payment uses fractional amount
    const chargeAmountMinor = paymentFractionMinor ?? verifiedTotalMinor
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
  waitUntil(sendPushToOrg(orgId, newOrderNotification(tableIdentifier || 'Takeaway', verifiedTotalMinor)))

  // Record platform fee for manual offline payment
  if (verifiedTotalMinor > 0) {
    try {
      const platformFeesConfig = await getPlatformFees()
      const businessFeePercent = platformFeesConfig.business_subaccount || 5
      const feeAmountMinor = Math.floor(verifiedTotalMinor * (businessFeePercent / 100))
      
      if (feeAmountMinor > 0) {
        await (supabase as any).from('platform_fee_ledger').insert({
          organization_id: orgId,
          location_id: locationId,
          order_id: order.id,
          fee_amount_minor: feeAmountMinor,
          status: 'unpaid'
        })
      }
    } catch (e) {
      console.error('Failed to log platform fee to ledger:', e)
    }
  }

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
