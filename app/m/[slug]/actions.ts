'use server'
import { Database } from '@/lib/supabase/types'
type RequestType = NonNullable<Database['public']['Tables']['service_requests']['Row']['request_type']> | 'waiter' | 'bill' | 'cleanup'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
  
// import { revalidatePath } from 'next/cache'

import { paymentProvider } from '@/lib/payments/paystack'
import { sendWhatsAppMessage } from '@/lib/notifications/termii'
import { getPlatformFees } from '@/lib/utils/settings'
import { waitUntil } from '@vercel/functions'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { Resend } from 'resend'
import { ReceiptEmail } from '@/emails/receipt-email'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy')

export type SafeResult<T> = 
  | { data: T; serverError?: undefined; validationErrors?: undefined }
  | { serverError: string; data?: undefined; validationErrors?: undefined }
  | { validationErrors: Record<string, string[]>; data?: undefined; serverError?: undefined };

const serviceRequestSchema = z.object({
  organization_id: z.string().min(1),
  location_id: z.string().min(1),
  table_identifier: z.string().min(1).max(50),
  request_type: z.string().min(1).max(50),
  custom_request_text: z.string().max(200).nullable().optional(),
  urgency_tier: z.enum(['standard', 'critical', 'low']).default('standard')
})

import { notifyBusiness } from '@/lib/notifications/dispatcher'

export async function submitServiceRequest(formData: FormData): Promise<SafeResult<{ success: boolean }>> {
  try {
    const { checkRateLimit } = await import('@/lib/upstash');
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value || 'anonymous';
    const { success } = await checkRateLimit('service_request', sessionId);
    
    if (!success) {
      throw new Error('Too many requests. Please wait before calling staff again.');
    }

    const supabase = await createClient()

    const parsed = serviceRequestSchema.safeParse({
      organization_id: formData.get('organization_id'),
      location_id: formData.get('location_id'),
      table_identifier: formData.get('table_identifier'),
      request_type: formData.get('request_type'),
      custom_request_text: formData.get('custom_request_text') || null,
      urgency_tier: formData.get('urgency_tier') || 'standard',
    })

    if (!parsed.success) {
      throw new Error('Invalid request payload')
    }

    const {
      organization_id: orgId,
      location_id: locId,
      table_identifier: tableId,
      request_type: requestType,
      custom_request_text: customRequestText,
      urgency_tier: urgencyTier
    } = parsed.data

    await supabase.from('service_requests').insert({
      organization_id: orgId,
      location_id: locId,
      table_identifier: tableId,
      request_type: requestType as RequestType,
      custom_request_text: customRequestText,
      urgency_tier: urgencyTier as 'standard' | 'critical',
    })

    // Fire all notification channels (push, email, WhatsApp) via dispatcher
    waitUntil(notifyBusiness(locId, {
      title: `[${urgencyTier.toUpperCase()}] Staff Request — ${tableId}`,
      body: customRequestText ? `"${customRequestText}" — ${requestType}` : requestType,
      url: '/dashboard/orders',
      tag: `service_request_${locId}`,
    }))
    
    return { data: { success: true } };
  } catch (e: unknown) {
    Sentry.captureException(e)
    return { serverError: (e as Error).message || 'Failed to submit service request' };
  }
}

export async function processCheckout(params: {
  organizationId: string,
  locationId: string,
  items: { id: string, name: string, quantity: number, price_minor: number, dealItemId?: string }[],
  totalAmountMinor: number,
  tipAmountMinor?: number,
  tableIdentifier?: string,
  customerNote?: string,
  customerEmail?: string,
  paymentFractionMinor?: number,
  paymentMethod?: 'card' | 'transfer' | 'iou' | 'pay_on_delivery_cash' | 'pay_on_delivery_link' | 'pay_after_service',
  discountAmountMinor?: number,
  customerName?: string,
  customerPhone?: string,
  fulfillmentType?: 'table' | 'pickup' | 'delivery',
  deliveryInstructions?: string,
  staffId?: string,
  staffSubaccountOverride?: string | null,
  pageId?: string,
  idempotencyKey?: string,
  subtotalMinor?: number,
  taxTotalMinor?: number,
  taxBreakdown?: unknown[],
  isUnevenSplit?: boolean,
  resourceId?: string
}): Promise<SafeResult<{ checkoutUrl?: string, orderId: string, paymentMethod: string }>> {
  const {
    organizationId, locationId, items, totalAmountMinor, tipAmountMinor = 0,
    tableIdentifier, customerNote, customerEmail, paymentFractionMinor,
    paymentMethod = 'card', discountAmountMinor = 0, customerName, customerPhone,
    fulfillmentType, deliveryInstructions, staffId: _staffId, staffSubaccountOverride,
    pageId, idempotencyKey, subtotalMinor, taxTotalMinor, taxBreakdown, isUnevenSplit,
    resourceId
  } = params;
  const supabase = await createClient()

  // --- Rate Limiting & Idempotency ---
  const { checkRateLimit, withIdempotency } = await import('@/lib/upstash');
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value || 'anonymous';
  const { success } = await checkRateLimit('checkout', sessionId);
  if (!success) {
    throw new Error('Too many requests. Please wait a minute before placing another order.');
  }

  const checkoutLogic = async () => {
    if (!items || items.length === 0) {
      throw new Error('Your cart is empty. Please add items before checking out.')
    }

    // 1. Server-side price verification — never trust client-supplied totals
    const itemIds = items.map(i => i.id as string).filter(Boolean)
    
    // If pageId is provided, items are from page_items, otherwise menu_items
    const tableToQuery = pageId ? 'page_items' : 'menu_items'
    
    const { data: dbItems, error: dbItemsError } = await supabase
      .from(tableToQuery)
      .select('id, price_minor, department')
      .in('id', itemIds)
    
    if (dbItemsError || !dbItems) {
      throw new Error('Could not verify item prices. Please refresh and try again.')
    }

    const priceMap = new Map(dbItems.map(i => [i.id, i.price_minor]))

    // Deal price verification: if any item has a dealItemId, fetch the authoritative deal price
    const dealItemIds = items.filter(i => i.dealItemId).map(i => i.dealItemId as string)
    const dealPriceMap = new Map<string, number>()
    if (dealItemIds.length > 0) {
      const { data: dealItemsDb } = await (supabase as ReturnType<typeof supabase.from> extends never ? never : typeof supabase)
        // @ts-expect-error deals table types may lag behind generation
        .from('deal_items')
        .select('id, deal_price_minor, quantity_limit, quantity_sold, deals(is_active)')
        .in('id', dealItemIds)
      
      if (dealItemsDb) {
        for (const di of dealItemsDb as { id: string; deal_price_minor: number; quantity_limit: number | null; quantity_sold: number; deals: { is_active: boolean } | null }[]) {
          // Validate the deal is still active and not sold out
          if (!di.deals?.is_active) continue
          if (di.quantity_limit !== null && di.quantity_sold >= di.quantity_limit) continue
          dealPriceMap.set(di.id, di.deal_price_minor)
        }
      }
    }

    // Build effective price map (deal price overrides regular price when valid)
    const effectivePriceFor = (item: { id: string; dealItemId?: string }) => {
      if (item.dealItemId && dealPriceMap.has(item.dealItemId)) {
        return dealPriceMap.get(item.dealItemId)!
      }
      return priceMap.get(item.id) || 0
    }
    const serverSubtotalMinor = items.reduce((sum, item) => {
      return sum + (effectivePriceFor(item) * item.quantity)
    }, 0)

    // Apply discount server-side, capped at subtotal to prevent negative totals
    const clampedDiscountMinor = Math.min(discountAmountMinor || 0, serverSubtotalMinor)
    
    // Calculate final total (Taxes are included upfront, but Tips are handled post-service)
    const verifiedTotalMinor = Math.max(0, serverSubtotalMinor - clampedDiscountMinor) + (taxTotalMinor || 0)

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
    .eq('organization_id', organizationId)
    .single()


  const subaccountCode = staffSubaccountOverride || (paySettings?.is_active ? paySettings.provider_account_id : null)

  // 3. Create Order using server-verified total
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      organization_id: organizationId,
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
      subtotal_minor: subtotalMinor || 0,
      tax_total_minor: taxTotalMinor || 0,
      tax_breakdown: taxBreakdown || [],
      resource_id: resourceId || null,
      idempotency_key: idempotencyKey || null,
    } as never).select('id').single()

  if (orderError || !order) throw new Error('Failed to create order')

  // 4. Create Order Items using server-verified prices and metadata
  // 4. Create Order Items using server-verified prices and metadata
  const dbItemMap = new Map(dbItems?.map(i => [i.id, i]) || [])
  
  // Calculate COGS from BOM
  const cogsMap = new Map<string, number>()
  if (itemIds.length > 0) {
    const formattedIds = itemIds.map(id => `"${id}"`).join(',')
    const { data: bomData } = await supabase
      .from('item_ingredients')
      .select('menu_item_id, page_item_id, quantity_required, inventory_items(cost_price_minor)')
      .or(`menu_item_id.in.(${formattedIds}),page_item_id.in.(${formattedIds})`)
      
    if (bomData) {
      for (const bom of bomData) {
        const targetId = bom.menu_item_id || bom.page_item_id
        if (targetId) {
          const itemCost = (bom.inventory_items as Record<string, unknown>)?.cost_price_minor as number || 0
          const currentCost = cogsMap.get(targetId) || 0
          // Math.round in case quantity_required is fractional
          cogsMap.set(targetId, currentCost + Math.round(itemCost * Number(bom.quantity_required)))
        }
      }
    }
  }
  
  const orderItemsData = items.map(item => {
    const dbItem = dbItemMap.get(item.id)
    return {
      order_id: order.id,
      item_id: item.id,
      item_name: item.name,
      quantity: item.quantity,
      price_minor: dbItem?.price_minor ?? item.price_minor,
      cogs_minor: cogsMap.get(item.id) ?? null,
      metadata: dbItem?.department ? { department: dbItem.department } : null
    }
  })

  const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData)
  if (itemsError) {
    // Roll back the order to prevent a paid order with no items
    await supabase.from('orders').delete().eq('id', order.id)
    throw new Error('Failed to save order items. Please try again.')
  }

  // 4b. Decrement Inventory Stock (Atomically)
  const { error: stockError } = await supabase.rpc('decrement_stock', {
    p_items: orderItemsData.map(item => ({ item_id: item.item_id, quantity: item.quantity }))
  })
  
  if (stockError) {
    // If stock decrement fails (e.g. someone bought the last item 1ms ago), rollback order!
    await supabase.from('orders').delete().eq('id', order.id)
    throw new Error(stockError.message || 'One or more items in your cart just sold out. Please review your cart.')
  }

  const chargeAmountMinor = paymentFractionMinor ?? verifiedTotalMinor

  // 4c. IOU Payment Verification & Balance Update
  if (paymentMethod === 'iou') {
    if (!customerEmail) {
      await supabase.from('orders').delete().eq('id', order.id)
      throw new Error('Email is required to use Pay Later (IOU).')
    }

    // Verify IOU status and limits
    const { data: customer } = await supabase
      .from('customer_profiles')
      .select('id, is_iou_approved, credit_limit_minor, credit_balance_minor')
      .eq('organization_id', organizationId)
      .eq('email', customerEmail)
      .single()

    if (!customer || !customer.is_iou_approved) {
      await supabase.from('orders').delete().eq('id', order.id)
      throw new Error('You are not approved for Pay Later purchases.')
    }

    const currentBalance = customer.credit_balance_minor || 0
    const limit = customer.credit_limit_minor || 0
    
    if (currentBalance + chargeAmountMinor > limit) {
      await supabase.from('orders').delete().eq('id', order.id)
      throw new Error(`Insufficient IOU credit. Available: ${((limit - currentBalance)/100).toFixed(2)}`)
    }

    // Process checkout atomically
    const { error: rpcError } = await supabase.rpc('process_iou_checkout', {
      p_order_id: order.id,
      p_organization_id: organizationId,
      p_customer_id: customer.id,
      p_amount_minor: chargeAmountMinor
    })

    if (rpcError) {
      await supabase.from('orders').delete().eq('id', order.id)
      throw new Error(rpcError.message || 'Failed to process IOU payment')
    }

    return { data: { orderId: order.id, paymentMethod: 'iou' } }
  }

  // 5. Initialize Paystack Transaction if Active and method is card
  const isPaystackLive = paySettings?.is_active && paySettings?.provider_account_id
  
  if (isPaystackLive && paymentMethod === 'card' && !isUnevenSplit) {
    // Use verified server total for Paystack — split payment uses fractional amount
    const email = customerEmail || `order_${order.id}@ourmenuos.online`

    // Dynamically calculate platform fee to enforce OurMenuOS percentages
    const platformFeesConfig = await getPlatformFees()
    const businessFeePercent = platformFeesConfig.business_subaccount || 5
    const transactionChargeMinor = subaccountCode && businessFeePercent > 0
      ? Math.floor(chargeAmountMinor * (businessFeePercent / 100))
      : undefined

    // Fetch page-specific payment channels restriction
    let channels: string[] | undefined = undefined
    if (pageId) {
      const { data: pageData } = await supabase.from('location_pages').select('template_data').eq('id', pageId).single()
      if (pageData?.template_data && typeof pageData.template_data === 'object' && 'payment_channels' in pageData.template_data) {
        channels = pageData.template_data.payment_channels as string[]
      }
    }

    // Lookup the slug from the pageId or locationId for the callback URL
    let slug = 'default'
    if (pageId) {
      const { data: pageData } = await supabase.from('location_pages').select('slug').eq('id', pageId).single()
      if (pageData?.slug) slug = pageData.slug
    } else if (locationId) {
      const { data: pageData } = await supabase.from('location_pages').select('slug').eq('location_id', locationId).limit(1).single()
      if (pageData?.slug) slug = pageData.slug
    }

    const { authorizationUrl: checkoutUrl } = await paymentProvider.initiatePayment({
      amountMinor: chargeAmountMinor,
      customerEmail: email,
      reference: order.id,
      currency: 'NGN',
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/m/${slug}/payment-callback`,
      subaccountCode: subaccountCode || undefined,
      transactionChargeMinor,
      channels
    })

    return { data: { checkoutUrl, orderId: order.id, paymentMethod: 'card' } }
  }

  // Fallback to manual/offline payment: trigger push notification immediately
  // For offline payments (cash, transfer, pay after service), the order is confirmed instantly.
  const isOfflinePayment = ['transfer', 'pay_on_delivery_cash', 'pay_on_delivery_link', 'pay_after_service'].includes(paymentMethod)
  
  if (isOfflinePayment) {
    const { sendPushToOrg, newOrderNotification } = await import('@/lib/notifications/push')
    waitUntil(sendPushToOrg(organizationId, newOrderNotification(tableIdentifier || 'Takeaway', verifiedTotalMinor)))
    
    // Record platform fee for offline payments that aren't uneven split shares
    if (verifiedTotalMinor > 0 && !isUnevenSplit) {
      try {
        const platformFeesConfig = await getPlatformFees()
        const businessFeePercent = platformFeesConfig.business_subaccount || 5
        const feeAmountMinor = Math.floor(verifiedTotalMinor * (businessFeePercent / 100))
        
        if (feeAmountMinor > 0) {
          await supabase.from('platform_fee_ledger').insert({
            organization_id: organizationId,
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
    
    // Dispatch Receipt Email if customer email exists
    if (customerEmail) {
      waitUntil((async () => {
        try {
          // Fetch org name for the email
          const { data: org } = await supabase.from('organizations').select('name').eq('id', organizationId).single()
          const orgName = org?.name || 'OurMenu Partner'

          await resend.emails.send({
            from: 'OurMenu Orders <orders@ourmenuos.online>',
            to: customerEmail,
            subject: `Order Confirmation #${order.id.substring(0, 8)}`,
            react: ReceiptEmail({
              organizationName: orgName,
              orderId: order.id,
              totalAmountMinor: verifiedTotalMinor,
              items: items.map(i => ({
                name: i.name,
                quantity: i.quantity,
                priceMinor: i.price_minor
              }))
            })
          })
        } catch (err) {
          console.error('Failed to send receipt email:', err)
        }
      })())
    }
    
    return { data: { orderId: order.id, paymentMethod } }
  }

  // Catch-all fallback
  return { data: { orderId: order.id, paymentMethod } };
};

  if (idempotencyKey) {
    return await withIdempotency(idempotencyKey, checkoutLogic);
  } else {
    return await checkoutLogic();
  }
}

export async function callStaffFromAi(params: {
  orgId: string,
  locationId: string,
  tableIdentifier: string,
  requestType: 'waiter' | 'bill' | 'cleanup'
}): Promise<SafeResult<{ success: boolean }>> {
  const { orgId, locationId, tableIdentifier, requestType } = params;
  const supabase = await createClient()

  if (!orgId || !locationId || !tableIdentifier || !requestType) {
    return { serverError: 'Missing required parameters' }
  }

  const { error } = await supabase.from('service_requests').insert({
    organization_id: orgId,
    location_id: locationId,
    table_identifier: tableIdentifier,
    request_type: requestType as RequestType,
  })

  if (error) return { serverError: error.message }

  // Fetch the location's configured WhatsApp number
  const { data: location } = await supabase
    .from('locations')
    .select('whatsapp_number')
    .eq('id', locationId)
    .single()

  const whatsappNumber = location?.whatsapp_number || '08000000000'

  // Fire WhatsApp Notification in the background without blocking the UI
  waitUntil(sendWhatsAppMessage(whatsappNumber, `Table ${tableIdentifier} needs a ${requestType}!`))

  return { data: { success: true } }
}

export async function processExistingOrderPayment(params: {
  orderId: string,
  amountMinor: number
}): Promise<SafeResult<{ checkoutUrl?: string }>> {
  const { orderId, amountMinor } = params;
  try {
    const supabase = await createClient()

    // Fetch the order to get org info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, organization_id, total_amount_minor, customer_email, location_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) return { serverError: 'Order not found' }

    // Fetch payment settings for split
    const { data: paySettings } = await supabase
      .from('organization_payment_settings')
      .select('provider_account_id, is_active')
      .eq('organization_id', order.organization_id)
      .single()

   
    const subaccountCode = paySettings?.is_active ? paySettings.provider_account_id : null

    // Initialize Paystack transaction for partial/split payment
    const email = order.customer_email || `order_${orderId}@ourmenuos.online`
    const reference = `${orderId}_split_${crypto.randomUUID().slice(0, 8)}`

    // Dynamically calculate platform fee to enforce OurMenuOS percentages
    const platformFeesConfig = await getPlatformFees()
    const businessFeePercent = platformFeesConfig.business_subaccount || 5
    const transactionChargeMinor = subaccountCode && businessFeePercent > 0
      ? Math.floor(amountMinor * (businessFeePercent / 100))
      : undefined

    let slug = 'default'
    if (order.location_id) {
      const { data: pageData } = await supabase.from('location_pages').select('slug').eq('location_id', order.location_id).limit(1).single()
      if (pageData?.slug) slug = pageData.slug
    }

    const { authorizationUrl: checkoutUrl } = await paymentProvider.initiatePayment({
      amountMinor: amountMinor,
      customerEmail: email,
      reference: reference,
      currency: 'NGN',
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/m/${slug}/payment-callback`,
      subaccountCode: subaccountCode || undefined,
      transactionChargeMinor
    })

    return { data: { checkoutUrl } }
  } catch (err: unknown) {
    return { serverError: (err as Error).message || 'Failed to initialize payment' }
  }
}


export async function optInMarketing(params: { orderId: string }): Promise<SafeResult<{ success: boolean }>> {
  const { orderId } = params;
  try {
    const supabase = await createClient()

    const { data: order } = await supabase
      .from('orders')
      .select('organization_id, customer_email')
      .eq('id', orderId)
      .single()

    if (!order || !order.customer_email) {
      return { serverError: 'Order or customer email not found' }
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

    return { data: { success: true } }
  } catch (err: unknown) {
    return { serverError: err instanceof Error ? err.message : 'Failed to opt in' }
  }
}

export async function checkIouStatus(organizationId: string): Promise<boolean> {
  if (!organizationId) return false;
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('iou_settings')
      .select('is_enabled')
      .eq('organization_id', organizationId)
      .maybeSingle()
    
    return data?.is_enabled ?? false
  } catch {
    return false
  }
}


const quoteSchema = z.object({
  page_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  location_id: z.string().uuid(),
  quote_data: z.object({
    customerName: z.string().min(1).max(100),
    customerEmail: z.string().email().optional().or(z.literal('')),
    customerPhone: z.string().min(5).max(20),
    projectName: z.string().min(1).max(200),
    deadline: z.string().optional(),
    budgetRange: z.string().optional(),
    brief: z.string().max(5000).optional(),
  })
})

export async function submitQuoteRequest(formData: FormData): Promise<SafeResult<{ success: boolean, referenceNumber?: string }>> {
  try {
    const { checkRateLimit } = await import('@/lib/upstash');
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value || 'anonymous';
    const { success } = await checkRateLimit('quote_request', sessionId);
    
    if (!success) {
      throw new Error('Too many requests. Please wait a minute before submitting another quote.');
    }

    const supabase = await createClient()

    const rawData = {
      page_id: formData.get('page_id'),
      organization_id: formData.get('organization_id'),
      location_id: formData.get('location_id'),
      quote_data: JSON.parse(formData.get('quote_data') as string || '{}')
    }

    const parsed = quoteSchema.safeParse(rawData)
    if (!parsed.success) {
      throw new Error('Invalid quote data submitted')
    }

    const { page_id, quote_data } = parsed.data
    
    const referenceNumber = `QUO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

    const { error } = await supabase
      .from('page_bookings')
      .insert({
        page_id,
        status: 'pending',
        booking_notes: JSON.stringify({ ...quote_data, referenceNumber }),
        customer_name: quote_data.customerName,
        customer_email: quote_data.customerEmail,
        customer_phone: quote_data.customerPhone,
      })

    if (error) throw error

    return { data: { success: true, referenceNumber } }
  } catch (err: unknown) {
    Sentry.captureException(err)
    return { serverError: err instanceof Error ? err.message : 'Failed to submit quote request' }
  }
}
