import { checkRateLimit } from '@/lib/upstash'

import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { getAiModels, getCreditCosts } from '@/lib/utils/settings'
import { createClient } from '@/lib/supabase/server'
import { chargeCredits } from '@/lib/payments/credits'

const forecastSchema = z.object({
  locationId: z.string().uuid('Invalid location ID')
})

export async function POST(req: Request) {
  try {
    const { success: rlSuccess } = await checkRateLimit('ai_forecast');
    if (!rlSuccess) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json()
    const parsed = forecastSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }

    const { locationId } = parsed.data

    const supabase = await createClient()

    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get location to find organization_id
    const { data: locationData } = await supabase
      .from('locations')
      .select('organization_id')
      .eq('id', locationId)
      .single()

    if (!locationData) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    const organizationId = locationData.organization_id

    // Verify user belongs to org
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userData.user.id)
      .single()

    let isAuthorized = !!member
    if (!member) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', organizationId)
        .eq('created_by', userData.user.id)
        .single()
      isAuthorized = !!org
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Charge credits
    const creditCosts = await getCreditCosts() as Record<string, number>
    const cost = creditCosts.forecast || 3 // Forecasts are expensive
    const charge = await chargeCredits(organizationId, cost, 'Demand Forecasting', userData.user.id)
    
    if (!charge.success) {
      return NextResponse.json({ error: charge.error }, { status: 402 })
    }

    // 1. Pull last 30 days of order_items data for this location
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, created_at')
      .eq('location_id', locationId)
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (!recentOrders || recentOrders.length === 0) {
      return NextResponse.json({ forecasts: [], message: 'Not enough order history to generate a forecast. Check back after a few days of sales.' })
    }

    const orderIds = recentOrders.map((o: { id: string }) => o.id)

    const { data: orderItems } = await supabase
      .from('order_items')
      .select('item_name, quantity, created_at')
      .in('order_id', orderIds)

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json({ forecasts: [], message: 'No item sales data found yet.' })
    }

    // 2. Aggregate: count total quantity sold per item and compute daily velocity
    const itemMap: Record<string, { totalQty: number; daysSeen: Set<string> }> = {}
    for (const item of orderItems) {
      const day = item.created_at.split('T')[0]
      if (!itemMap[item.item_name]) {
        itemMap[item.item_name] = { totalQty: 0, daysSeen: new Set() }
      }
      itemMap[item.item_name].totalQty += item.quantity
      itemMap[item.item_name].daysSeen.add(day)
    }

    const aggregated = Object.entries(itemMap).map(([name, stats]) => ({
      name,
      total_qty_sold_30d: stats.totalQty,
      active_selling_days: stats.daysSeen.size,
      avg_daily_velocity: parseFloat((stats.totalQty / Math.max(stats.daysSeen.size, 1)).toFixed(2))
    })).sort((a, b) => b.total_qty_sold_30d - a.total_qty_sold_30d)

    // 3. Ask Gemini to produce a forecast for each item
    const aiModels = await getAiModels() as Record<string, string>
    const modelName = aiModels.text_generation || 'gemini-3.5-flash'

    const { object } = await generateObject({
      model: google(modelName),
      schema: z.object({
        forecasts: z.array(z.object({
          item_name: z.string(),
          trend: z.enum(['rising', 'stable', 'declining']).describe('Trend direction based on velocity relative to peers.'),
          predicted_units_next_7d: z.number().describe('Predicted units needed in the next 7 days.'),
          stock_alert: z.enum(['critical', 'order_soon', 'sufficient']).describe('Stock alert level.'),
          insight: z.string().describe('One concise, actionable sentence for the manager.')
        }))
      }),
      prompt: `You are a sharp hospitality operations analyst. Given the following 30-day sales velocity data for a restaurant, produce a demand forecast.

For each item, assess:
- Its 'trend': Is it a rising star (selling faster than the average), stable, or declining?
- 'predicted_units_next_7d': Extrapolate from avg_daily_velocity to project the next 7 days. Apply a slight uplift for rising trends and downward correction for declining.
- 'stock_alert': Based on predicted demand — 'critical' if it's a top-5 seller and trending up, 'order_soon' for stable/moderate demand, 'sufficient' for slow-movers.
- 'insight': One crisp, actionable sentence a restaurant manager would find valuable.

Sales data (last 30 days):
${JSON.stringify(aggregated, null, 2)}`
    })

    return NextResponse.json(object)
  } catch (error) {
     
    console.error('Forecast Error:', error)
    
    // Catch AI Provider Timeouts & Overloads
    const err = error as Error & { message?: string, name?: string }
    const isTimeout = err?.name === 'TimeoutError' || err?.message?.includes('timeout')
    const isOverloaded = err?.message?.includes('503') || err?.message?.includes('overloaded')
    
    if (isTimeout || isOverloaded) {
      return NextResponse.json({ error: 'AI service is temporarily overloaded or timed out. Please try again in a moment.' }, { status: 503 })
    }
    
    return NextResponse.json({ error: 'Failed to generate forecast' }, { status: 500 })
  }
}
