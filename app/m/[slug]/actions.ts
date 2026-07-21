'use server'
import { Database } from '@/lib/supabase/types'
type RequestType = NonNullable<Database['public']['Tables']['service_requests']['Row']['request_type']> | 'waiter' | 'bill' | 'cleanup'

import { createClient, createAdminClient } from '@/lib/supabase/server'
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
import { dispatchLocationWebhook } from '@/lib/webhooks/dispatch'

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

    const supabase = await createAdminClient()

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
  isSplitPayment?: boolean,
  resourceId?: string,
  deliveryLat?: number | null,
  deliveryLng?: number | null,
  splitCount?: number,
  splitType?: string,
  splitShares?: number[],
  useWalletBalance?: boolean,
  walletAmountAppliedMinor?: number,
  promoCode?: string,
  useLoyaltyPoints?: boolean
}): Promise<SafeResult<{ checkoutUrl?: string, orderId: string, paymentMethod: string }>> {
  const {
    organizationId, locationId, items, totalAmountMinor, tipAmountMinor = 0,
    tableIdentifier, customerNote, customerEmail, paymentFractionMinor,
    paymentMethod = 'card', discountAmountMinor = 0, customerName, customerPhone,
    fulfillmentType, deliveryInstructions, staffId: _staffId, staffSubaccountOverride,
    pageId, idempotencyKey, subtotalMinor, taxTotalMinor, taxBreakdown, isSplitPayment,
    resourceId, splitCount, splitType, splitShares, useWalletBalance, walletAmountAppliedMinor,
    promoCode, useLoyaltyPoints
  } = params;
  const supabase = await createAdminClient()

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
    
    // Fetch Payment Settings and Location Data upfront for delivery fee
    const [
      { data: paySettings },
      { data: location }
    ] = await Promise.all([
      supabase.from('organization_payment_settings').select('provider_account_id, is_active').eq('organization_id', organizationId).single(),
      supabase.from('locations').select('delivery_fee_minor, delivery_minimum_order_minor').eq('id', locationId).single()
    ])

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

    // Server-side promo code validation
    let serverDiscountMinor = 0
    let validatedPromoCodeId: string | null = null
    if (promoCode) {
      const { data: promo, error: promoError } = await supabase
        .from('location_promo_codes')
        .select('id, discount_type, discount_value, max_uses, current_uses, valid_until, is_active')
        .eq('location_id', locationId)
        .eq('code', promoCode.toUpperCase())
        .single()

      if (promoError || !promo || !promo.is_active || (promo.valid_until && new Date(promo.valid_until) < new Date()) || (promo.max_uses !== null && promo.current_uses >= promo.max_uses)) {
        throw new Error('Invalid, expired, or fully used promo code. Please remove it and try again.')
      }

      validatedPromoCodeId = promo.id
      if (promo.discount_type === 'percentage') {
        serverDiscountMinor = Math.floor(serverSubtotalMinor * (promo.discount_value / 100))
      } else {
        serverDiscountMinor = promo.discount_value
      }
    }

    let customerProfileIdForLoyalty: string | null = null
    let pointsToDeduct = 0

    if (useLoyaltyPoints && customerEmail) {
      const { data: loyaltySettings } = await supabase
        .from('loyalty_settings')
        .select('is_enabled, reward_threshold, reward_discount_minor')
        .eq('organization_id', organizationId)
        .single()
        
      if (loyaltySettings?.is_enabled) {
        const { data: customerProfile } = await supabase
          .from('customer_profiles')
          .select('id, loyalty_points')
          .eq('organization_id', organizationId)
          .eq('email', customerEmail)
          .single()
          
        if (customerProfile && (customerProfile.loyalty_points || 0) >= (loyaltySettings.reward_threshold || 0)) {
          serverDiscountMinor += (loyaltySettings.reward_discount_minor || 0)
          customerProfileIdForLoyalty = customerProfile.id
          pointsToDeduct = (loyaltySettings.reward_threshold || 0)
        }
      }
    }

    // Apply discount server-side, capped at subtotal to prevent negative totals
    const clampedDiscountMinor = Math.min(serverDiscountMinor, serverSubtotalMinor)
    
    // Add delivery fee if applicable
    const isDelivery = fulfillmentType === 'delivery'
    if (isDelivery && location?.delivery_minimum_order_minor && serverSubtotalMinor < location.delivery_minimum_order_minor) {
      throw new Error('Minimum order amount for delivery not met.')
    }
    const appliedDeliveryFee = (isDelivery && location?.delivery_fee_minor) ? location.delivery_fee_minor : 0
    
    // Sanitize client-provided tax to prevent negative injection
    const sanitizedTaxMinor = Math.max(0, taxTotalMinor || 0)

    // Calculate final total (Taxes are included upfront, but Tips are handled post-service)
    const verifiedTotalMinor = Math.max(0, serverSubtotalMinor - clampedDiscountMinor) + sanitizedTaxMinor + appliedDeliveryFee

    // Guard: reject if client total deviates >5% from server-computed total (fraud detection)
    const deviation = Math.abs(verifiedTotalMinor - totalAmountMinor) / Math.max(verifiedTotalMinor, 1)
    if (deviation > 0.05 && verifiedTotalMinor > 0) {
      throw new Error('Order total mismatch. Please refresh and try again.')
    }

  // ----------------------------------------

  const subaccountCode = staffSubaccountOverride || (paySettings?.is_active ? paySettings.provider_account_id : null)

  // 3. Create Order using server-verified total
  const adminClient = await createAdminClient()
  const { data: order, error: orderError } = await adminClient
    .from('orders')
    .insert({
      organization_id: organizationId,
      location_id: locationId,
      page_id: pageId || null,
      customer_name: customerName || 'Guest',
      customer_phone: customerPhone || null,
      table_identifier: tableIdentifier || null,
      fulfillment_type: fulfillmentType || 'table',
      delivery_instructions: deliveryInstructions || null,
      status: 'pending',
      total_amount_minor: verifiedTotalMinor,
      tip_amount_minor: tipAmountMinor || 0,
      discount_amount_minor: clampedDiscountMinor,
      delivery_fee_minor: appliedDeliveryFee || null,
      customer_note: customerNote ? customerNote.slice(0, 500) : null,
      customer_email: customerEmail || null,
      subtotal_minor: subtotalMinor || 0,
      tax_total_minor: taxTotalMinor || 0,
      tax_breakdown: taxBreakdown || [],
      resource_id: resourceId || null,
      idempotency_key: idempotencyKey || null,
      delivery_latitude: params.deliveryLat || null,
      delivery_longitude: params.deliveryLng || null,
      metadata: {
        ...(splitCount ? { split_count: splitCount, split_type: splitType, split_shares: splitShares } : {})
      }
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

  const { error: itemsError } = await adminClient.from('order_items').insert(orderItemsData)
  if (itemsError) {
    // Roll back the order to prevent a paid order with no items
    await adminClient.from('orders').delete().eq('id', order.id)
    throw new Error('Failed to save order items. Please try again.')
  }

  // 4b. Seed Custom Milestones (if configured for this fulfillment type)
  const cMilestones = (location as { custom_milestones?: Record<string, string[]> | null })?.custom_milestones
  const flowKey = fulfillmentType || 'table'
  const flowMilestones = cMilestones?.[flowKey]
  if (flowMilestones && Array.isArray(flowMilestones) && flowMilestones.length > 0) {
    const milestonesToInsert = flowMilestones.map((title) => ({
      order_id: order.id,
      title,
      is_completed: false
    }))
    await adminClient.from('order_milestones').insert(milestonesToInsert)
  }

  // 4b. Decrement Inventory Stock (Atomically)
  const { error: stockError } = await adminClient.rpc('decrement_stock', {
    p_items: orderItemsData.map(item => ({ item_id: item.item_id, quantity: item.quantity }))
  })
  
  if (stockError) {
    // If stock decrement fails (e.g. someone bought the last item 1ms ago), rollback order!
    await adminClient.from('orders').delete().eq('id', order.id)
    throw new Error(stockError.message || 'One or more items in your cart just sold out. Please review your cart.')
  }

  let chargeAmountMinor = paymentFractionMinor ?? verifiedTotalMinor
  let finalPaymentMethod: string = paymentMethod

  // 4c. Process Wallet Split Tender
  if (useWalletBalance && walletAmountAppliedMinor && walletAmountAppliedMinor > 0) {
    if (!customerEmail) {
      await adminClient.from('orders').delete().eq('id', order.id)
      throw new Error('Email is required to use Wallet balance.')
    }
    const { data: customer } = await supabase
      .from('customer_profiles')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', customerEmail)
      .single()

    if (!customer) {
      await adminClient.from('orders').delete().eq('id', order.id)
      throw new Error('Customer profile not found for wallet checkout.')
    }

    const { data: rpcResult, error: walletError } = await adminClient.rpc('process_wallet_checkout', {
      p_order_id: order.id,
      p_organization_id: organizationId,
      p_customer_id: customer.id,
      p_amount_minor: walletAmountAppliedMinor
    })

    if (walletError || !(rpcResult as any)?.success) {
      await adminClient.from('orders').delete().eq('id', order.id)
      throw new Error(walletError?.message || 'Insufficient wallet balance.')
    }

    chargeAmountMinor -= walletAmountAppliedMinor
    
    // If wallet covers the entire charge, no external payment is needed
    if (chargeAmountMinor <= 0) {
      finalPaymentMethod = 'wallet'
      chargeAmountMinor = 0
    }
  }

  // 4d. IOU Payment Verification & Balance Update
  if (finalPaymentMethod === 'iou') {
    if (!customerEmail) {
      await adminClient.from('orders').delete().eq('id', order.id)
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
      await adminClient.from('orders').delete().eq('id', order.id)
      throw new Error('You are not approved for Pay Later purchases.')
    }

    const currentBalance = customer.credit_balance_minor || 0
    const limit = customer.credit_limit_minor || 0
    
    if (currentBalance + chargeAmountMinor > limit) {
      await adminClient.from('orders').delete().eq('id', order.id)
      throw new Error(`Insufficient IOU credit. Available: ${((limit - currentBalance)/100).toFixed(2)}`)
    }

    // Process checkout atomically
    const { error: rpcError } = await adminClient.rpc('process_iou_checkout', {
      p_order_id: order.id,
      p_organization_id: organizationId,
      p_customer_id: customer.id,
      p_amount_minor: chargeAmountMinor
    })

    if (rpcError) {
      await adminClient.from('orders').delete().eq('id', order.id)
      throw new Error(rpcError.message || 'Failed to process IOU payment')
    }

    return { data: { orderId: order.id, paymentMethod: 'iou' } }
  }

  // 5. Initialize Paystack Transaction if Active and method is card
  const isPaystackLive = paySettings?.is_active && paySettings?.provider_account_id
  
  if (isPaystackLive && finalPaymentMethod === 'card' && !isSplitPayment) {
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

    try {
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
    } catch (err: unknown) {
      console.error('Failed to initiate external payment', err)
      
      // Rollback wallet if it was deducted
      if (useWalletBalance && walletAmountAppliedMinor && walletAmountAppliedMinor > 0 && customerEmail) {
        const { data: customer } = await supabase
          .from('customer_profiles')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('email', customerEmail)
          .single()

        if (customer) {
          const { refundWalletTransaction } = await import('@/lib/payments/wallet-service')
          await refundWalletTransaction(adminClient, order.id, organizationId, customer.id, walletAmountAppliedMinor)
        }
      }

      await adminClient.from('orders').delete().eq('id', order.id)
      throw new Error('Payment initialization failed. Any applied wallet funds have been refunded.')
    }
  }

  // Deduct Loyalty Points if applied
  if (customerProfileIdForLoyalty && pointsToDeduct > 0 && finalPaymentMethod === 'card') {
    waitUntil((async () => {
      const { error } = await adminClient.rpc('increment_loyalty_points', {
        profile_id: customerProfileIdForLoyalty!,
        points: -pointsToDeduct
      })
      if (error) console.error('Failed to deduct loyalty points (card):', error)
    })())
  }

  // Fallback to manual/offline payment: trigger push notification immediately
  // For offline payments (cash, transfer, pay after service, wallet), the order is confirmed instantly.
  const isOfflinePayment = ['transfer', 'pay_on_delivery_cash', 'pay_on_delivery_link', 'pay_after_service', 'wallet'].includes(finalPaymentMethod)
  
  if (isOfflinePayment) {
    const { sendPushToOrg, newOrderNotification } = await import('@/lib/notifications/push')
    waitUntil(sendPushToOrg(organizationId, newOrderNotification(tableIdentifier || 'Takeaway', verifiedTotalMinor)))
    
    // Dispatch outbound webhook for offline created orders
    waitUntil(dispatchLocationWebhook(locationId, 'order.created', {
      order_id: order.id,
      total_amount_minor: verifiedTotalMinor,
      fulfillment_type: fulfillmentType || 'table',
      table_identifier: tableIdentifier,
      customer_name: customerName,
      customer_email: customerEmail,
      items
    }))
    
    // Record platform fee for offline payments that aren't split shares
    if (verifiedTotalMinor > 0 && !isSplitPayment) {
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

    // Increment promo code usage if applied
    if (validatedPromoCodeId) {
      waitUntil((async () => {
        try {
          const { data } = await supabase.from('location_promo_codes').select('current_uses').eq('id', validatedPromoCodeId).single()
          if (data) {
            await supabase.from('location_promo_codes').update({ current_uses: data.current_uses + 1 }).eq('id', validatedPromoCodeId)
          }
        } catch (err) {
          console.error('Failed to increment promo code usage:', err)
        }
      })())
    }

    // Award Loyalty Points for offline payments
    if (customerEmail && verifiedTotalMinor > 0) {
      waitUntil((async () => {
        try {
          const { data: loyaltySettings } = await supabase
            .from('loyalty_settings')
            .select('is_enabled, points_per_major_unit')
            .eq('organization_id', organizationId)
            .single()

          if (loyaltySettings?.is_enabled) {
            const { data: customerProfile } = await supabase
              .from('customer_profiles')
              .select('id')
              .eq('organization_id', organizationId)
              .eq('email', customerEmail)
              .single()

            if (customerProfile) {
              const majorUnits = Math.floor(verifiedTotalMinor / 100)
              const pointsToAward = majorUnits * (loyaltySettings.points_per_major_unit || 1)

              if (pointsToAward > 0) {
                await supabase.rpc('increment_loyalty_points', {
                  profile_id: customerProfile.id,
                  points: pointsToAward
                })
              }
            }
          }
        } catch (err) {
          console.error('Failed to award loyalty points for offline payment:', err)
        }
      })())
    }
    
    // Deduct Loyalty Points if applied
    if (customerProfileIdForLoyalty && pointsToDeduct > 0) {
      waitUntil((async () => {
        const { error } = await supabase.rpc('increment_loyalty_points', {
          profile_id: customerProfileIdForLoyalty!,
          points: -pointsToDeduct
        })
        if (error) console.error('Failed to deduct loyalty points:', error)
      })())
    }
    
    return { data: { orderId: order.id, paymentMethod: finalPaymentMethod } }
  }

  // Catch-all fallback
  return { data: { orderId: order.id, paymentMethod: finalPaymentMethod } };
};

  if (idempotencyKey) {
    return await withIdempotency(`checkout_${idempotencyKey}`, checkoutLogic);
  } else {
    return await checkoutLogic();
  }
}

export async function validatePromoCode(code: string, locationId: string): Promise<SafeResult<{
  id: string,
  discount_type: 'percentage' | 'flat',
  discount_value: number,
}>> {
  try {
    const supabase = await createAdminClient()
    const { data: promo, error } = await supabase
      .from('location_promo_codes')
      .select('id, discount_type, discount_value, max_uses, current_uses, valid_until, is_active')
      .eq('location_id', locationId)
      .eq('code', code.toUpperCase())
      .single()

    if (error || !promo) {
      return { serverError: 'Invalid promo code.' }
    }

    if (!promo.is_active) {
      return { serverError: 'This promo code is no longer active.' }
    }

    if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
      return { serverError: 'This promo code has expired.' }
    }

    if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
      return { serverError: 'This promo code has reached its usage limit.' }
    }

    return { 
      data: {
        id: promo.id,
        discount_type: promo.discount_type as 'percentage' | 'flat',
        discount_value: promo.discount_value
      } 
    }
  } catch (error) {
    console.error('Promo code validation error:', error)
    return { serverError: 'An error occurred while validating the promo code.' }
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

  const adminClient = await createAdminClient()
  const { error } = await adminClient.from('service_requests').insert({
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
    .limit(1)
    .maybeSingle()

  const whatsappNumber = location?.whatsapp_number || '08000000000'

  // Fire WhatsApp & Business Push/Sound/Email Notifications in the background without blocking the UI
  waitUntil(sendWhatsAppMessage(whatsappNumber, `Table ${tableIdentifier} needs a ${requestType}!`))
  waitUntil(notifyBusiness(locationId, {
    title: `[AI REQUEST] Staff Needed — Table ${tableIdentifier}`,
    body: `Requested: ${requestType}`,
    url: '/dashboard/orders',
    tag: `service_request_${locationId}`,
  }))

  return { data: { success: true } }
}

export async function getOrderPaymentStatusAction(orderId: string) {
  if (!orderId) return null;
  try {
    const supabase = await createAdminClient();
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, status, total_amount_minor, amount_paid_minor, table_identifier, created_at, organization_id, location_id, metadata, locations(currency_code), organizations(id, name, slug)')
      .eq('id', orderId)
      .single();
      
    if (error || !order) return null;
    return order;
  } catch {
    return null;
  }
}

export async function getFullOrderDetailsAction(orderId: string, locationId: string) {
  if (!orderId || !locationId) return null;
  try {
    const supabase = await createAdminClient();
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*), order_payments(*)')
      .eq('id', orderId)
      .eq('location_id', locationId)
      .single();
      
    if (error || !order) return null;
    return order;
  } catch {
    return null;
  }
}

export async function processExistingOrderPayment(params: {
  orderId: string,
  amountMinor: number
}): Promise<SafeResult<{ checkoutUrl?: string }>> {
  const { orderId, amountMinor } = params;
  try {
    const supabase = await createAdminClient()

    // Fetch the order to get org info and current payment balance
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, organization_id, total_amount_minor, amount_paid_minor, status, customer_email, location_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) return { serverError: 'Order not found' }

    if (order.status === 'paid' || order.status === 'completed' || (order.amount_paid_minor || 0) >= order.total_amount_minor) {
      return { serverError: 'Order is already fully paid.' }
    }

    if (amountMinor <= 0 || (order.amount_paid_minor || 0) + amountMinor > order.total_amount_minor) {
      return { serverError: 'Payment amount exceeds remaining balance.' }
    }

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
    const supabase = await createAdminClient()

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
    const supabase = await createAdminClient()
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

export async function submitQuoteRequest(formData: FormData): Promise<SafeResult<{ success: boolean, referenceNumber?: string, accessPin?: string }>> {
  try {
    const { checkRateLimit } = await import('@/lib/upstash');
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value || 'anonymous';
    const { success } = await checkRateLimit('quote_request', sessionId);
    
    if (!success) {
      throw new Error('Too many requests. Please wait a minute before submitting another quote.');
    }

    const supabase = await createAdminClient()

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
    const accessPin = Math.floor(100000 + Math.random() * 900000).toString()

    const { error } = await supabase
      .from('page_bookings')
      .insert({
        page_id,
        status: 'pending',
        booking_notes: JSON.stringify({ ...quote_data, referenceNumber, accessPin }),
        customer_name: quote_data.customerName,
        customer_email: quote_data.customerEmail,
        customer_phone: quote_data.customerPhone,
      })

    if (error) throw error

    return { data: { success: true, referenceNumber, accessPin } }
  } catch (err: unknown) {
    Sentry.captureException(err)
    return { serverError: err instanceof Error ? err.message : 'Failed to submit quote request' }
  }
}

export async function submitPaymentProof(formData: FormData): Promise<SafeResult<{ url: string }>> {
  try {
    const { checkRateLimit } = await import('@/lib/upstash');
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value || 'anonymous';
    const { success } = await checkRateLimit('upload_proof', sessionId);
    
    if (!success) {
      return { serverError: 'Too many uploads. Please wait a minute.' };
    }

    const orderId = formData.get('order_id') as string;
    const file = formData.get('file') as File | null;

    if (!orderId || !file) {
      return { serverError: 'Order ID and file are required.' };
    }
    if (!file.type.startsWith('image/')) {
      return { serverError: 'File must be an image.' };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { serverError: 'File size must be less than 5MB.' };
    }

    const adminClient = await createAdminClient();
    
    // Verify order exists
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('id, metadata, status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return { serverError: 'Order not found.' };
    }

    const ext = file.name.split('.').pop() || 'png';
    const fileName = `payment_proofs/${orderId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await adminClient
      .storage
      .from('public-assets')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { serverError: 'Failed to upload image.' };
    }

    const { data: publicUrlData } = adminClient.storage.from('public-assets').getPublicUrl(fileName);
    const proofUrl = publicUrlData.publicUrl;

    // Update order metadata
    const currentMetadata = (order.metadata as Record<string, unknown>) || {};
    const { error: updateError } = await adminClient
      .from('orders')
      .update({
        metadata: {
          ...currentMetadata,
          payment_proof_url: proofUrl,
        }
      })
      .eq('id', orderId);

    if (updateError) {
       console.error('Failed to update order metadata:', updateError);
       return { serverError: 'Failed to link image to order.' };
    }

    return { data: { url: proofUrl } };
  } catch (err: unknown) {
    Sentry.captureException(err);
    return { serverError: (err as Error).message || 'Unexpected error' };
  }
}

