/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

import { initializeTransaction } from '@/lib/payments/paystack'
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
    request_type: requestType as any,
    custom_request_text: customRequestText,
    urgency_tier: urgencyTier as any,
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
  items: any[], 
  totalAmountMinor: number, 
  tipAmountMinor: number,
  tableIdentifier: string,
  customerNote?: string
) {
  const supabase = await createClient()

  // 1. Fetch Payment Settings
  const { data: paySettings } = await supabase
    .from('organization_payment_settings')
    .select('provider_account_id, is_active')
    .eq('organization_id', orgId)
    .single()

  const subaccountCode = paySettings?.is_active ? paySettings.provider_account_id : null

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
      customer_note: customerNote || null,
    })
    .select('id')
    .single()

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

  // 4. Initialize Paystack Transaction
  const checkoutUrl = await initializeTransaction(
    totalAmountMinor,
    `order_${order.id}@ourmenu.os`, // Dummy email if none provided
    subaccountCode || '',
    order.id // Use order ID as reference
  )

  return { checkoutUrl, orderId: order.id }
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
    request_type: requestType as any,
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
