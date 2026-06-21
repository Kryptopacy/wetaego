'use server'



import { createClient } from '@/lib/supabase/server'
import { processCheckout } from '../../actions'

export async function submitFeedbackAndTip(
  orgSlug: string,
  orderId: string | null, // null if general feedback
  locationIdOverride: string | null,
  staffRating: number,
  staffFeedback: string,
  businessRating: number,
  businessFeedback: string,
  tipSelection: string,
  customTip: string
) {
  const supabase = await createClient()

  let organizationId = ''
  let locationId = locationIdOverride || ''
  let assignedStaffId = null
  let orderTotalMinor = 0
  let tableIdentifier = ''

  if (orderId) {
    // 1. Fetch Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, organizations(id, slug)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return { error: 'Order not found.' }
    }

    organizationId = order.organization_id
    locationId = order.location_id
    assignedStaffId = order.assigned_staff_id
    orderTotalMinor = order.total_amount_minor
    tableIdentifier = order.table_identifier || ''
  } else {
    // General feedback lookup
    if (!locationId) return { error: 'Missing location ID for general feedback.' }
    const { data: loc } = await supabase
      .from('locations')
      .select('organization_id')
      .eq('id', locationId)
      .single()
    if (!loc) return { error: 'Location not found.' }
    organizationId = loc.organization_id
  }

  // 2. Insert Review (only if there are ratings)
  if (staffRating > 0 || businessRating > 0) {
    const { error: reviewError } = await supabase.from('order_reviews').insert({
      organization_id: organizationId,
      location_id: locationId,
      order_id: orderId, // could be null
      staff_id: assignedStaffId, // could be null
      staff_rating: staffRating || null,
      staff_feedback: staffFeedback || null,
      business_rating: businessRating || null,
      business_feedback: businessFeedback || null,
    } as any)

    if (reviewError) {
      console.error('Failed to submit review:', reviewError)
      return { error: 'Failed to submit review.' }
    }
  }

  // 3. Handle Tip (only possible if tied to an order)
  if (orderId && tipSelection !== '0') {
    const tipAmountMinor = tipSelection === 'custom'
      ? Math.round(parseFloat(customTip || '0') * 100)
      : Math.round(orderTotalMinor * (parseInt(tipSelection) / 100))

    if (tipAmountMinor > 0) {
      // If there's a tip, we need to process a new payment intent
      try {
        const { checkoutUrl } = await processCheckout(
          organizationId, 
          locationId, 
          [{ id: 'tip', name: 'Service Tip', quantity: 1, price_minor: tipAmountMinor }], 
          tipAmountMinor, 
          tipAmountMinor, 
          tableIdentifier, 
          'Tip Only',
          undefined // customer email
        )
        
        return { checkoutUrl }
      } catch (err: any) {
        console.error('Failed to initialize tip payment:', err)
        return { error: 'Failed to initialize tip checkout.' }
      }
    }
  }

  return { success: true }
}
