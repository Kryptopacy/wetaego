/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { locationId } = await req.json()
    if (!locationId) {
      return NextResponse.json({ error: 'Missing locationId' }, { status: 400 })
    }

    const supabase = await createClient()

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

    const orderIds = recentOrders.map((o: any) => o.id)

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
    const { object } = await generateObject({
      model: google('gemini-3.1-flash'),
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
  } catch (error: any) {
    console.error('Forecast Error:', error)
    return NextResponse.json({ error: 'Failed to generate forecast' }, { status: 500 })
  }
}
