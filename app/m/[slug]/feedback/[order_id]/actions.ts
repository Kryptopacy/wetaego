'use server'



import { createClient } from '@/lib/supabase/server'
import { processCheckout } from '../../actions'
import { z } from 'zod'
import { cookies } from 'next/headers'
import * as Sentry from '@sentry/nextjs'

const feedbackSchema = z.object({
  orgSlug: z.string().min(1),
  orderId: z.string().nullable(),
  locationIdOverride: z.string().nullable(),
  staffRating: z.number().min(0).max(5),
  staffFeedback: z.string().max(500),
  businessRating: z.number().min(0).max(5),
  businessFeedback: z.string().max(500),
  tipSelection: z.string().max(50),
  customTip: z.string().max(50)
})

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
  try {
    const { checkRateLimit } = await import('@/lib/upstash');
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value || 'anonymous';
    const { success } = await checkRateLimit('feedback_submit', sessionId);
    
    if (!success) {
      return { error: 'Too many requests. Please wait before submitting again.' }
    }

    const parsed = feedbackSchema.safeParse({
      orgSlug, orderId, locationIdOverride, staffRating, staffFeedback, businessRating, businessFeedback, tipSelection, customTip
    })

    if (!parsed.success) {
      return { error: 'Invalid feedback payload' }
    }

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
      order_id: orderId as string,
      staff_id: assignedStaffId || undefined,
      staff_rating: staffRating || 0,
      staff_feedback: staffFeedback || null,
      business_rating: businessRating || null,
      business_feedback: businessFeedback || null,
    })

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
        let staffSubaccount: string | undefined = undefined

        if (assignedStaffId) {
          
          const { data: staffProfile } = await (supabase as any)
            .from('user_profiles')
            .select('paystack_subaccount_code')
            .eq('id', assignedStaffId)
            .single()
            
          if (staffProfile?.paystack_subaccount_code) {
            staffSubaccount = staffProfile.paystack_subaccount_code
          }
        }

        const result = await processCheckout({
          organizationId, 
          locationId, 
          items: [{ id: 'tip', name: 'Service Tip', quantity: 1, price_minor: tipAmountMinor }], 
          totalAmountMinor: tipAmountMinor, 
          tipAmountMinor, 
          tableIdentifier, 
          customerNote: 'Tip Only',
          staffSubaccountOverride: staffSubaccount // Pass the staff's subaccount!
        })
        
        if (result?.serverError || result?.validationErrors) {
          throw new Error(result?.serverError || 'Failed to initialize tip checkout.')
        }

        const checkoutUrl = result.data?.checkoutUrl
        return { checkoutUrl }
      } catch (err: unknown) {
        console.error('Failed to initialize tip payment:', err)
        return { error: 'Failed to initialize tip checkout.' }
      }
    }
  }

  return { success: true }
  } catch (e: unknown) {
    Sentry.captureException(e)
    return { error: 'An unexpected error occurred while submitting feedback.' }
  }
}
