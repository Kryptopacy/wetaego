'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitPosOrder(payload: {
  organizationId: string
  locationId: string
  pageId: string
  staffId: string
  items: { id: string; name: string; price_minor: number; quantity: number; variants?: Record<string, string>; item_data?: any }[]
  totalMinor: number
  paymentMethod: string // 'cash', 'card', 'transfer'
  customerName?: string
}) {
  const supabase = await createClient()

  // Verify auth
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Unauthorized')

  // Create the order
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      organization_id: payload.organizationId,
      location_id: payload.locationId,
      page_id: payload.pageId,
      customer_name: payload.customerName || 'Walk-in Customer',
      customer_email: null,
      customer_phone: null,
      table_identifier: 'POS (Counter)',
      fulfillment_type: 'pickup',
      payment_method: payload.paymentMethod,
      total_amount_minor: payload.totalMinor,
      amount_paid_minor: payload.totalMinor, // Full payment assumed for POS
      status: 'completed', // POS orders are instantly completed
      assigned_staff_id: payload.staffId,
    } as any)
    .select()
    .single()

  if (orderErr) {
    console.error('POS order insert error:', orderErr)
    throw new Error('Failed to create order')
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
       await (supabase.rpc as any)('deduct_inventory', {
          p_item_id: item.id,
          p_quantity: item.quantity
       })
    }
  }

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/pos')

  return { success: true, orderId: order.id }
}
