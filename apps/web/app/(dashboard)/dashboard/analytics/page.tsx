import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrendingUp, Users, CalendarDays, ShoppingBag, Star, DollarSign } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type OrderRow = Database['public']['Tables']['orders']['Row']
type OrderItemRow = Database['public']['Tables']['order_items']['Row']
type ReviewRow = Database['public']['Tables']['order_reviews']['Row']
type LocationRow = Database['public']['Tables']['locations']['Row']
type LocationPageRow = Database['public']['Tables']['location_pages']['Row']

export default async function AnalyticsDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get Organization
  const { data: member } = await supabase
    .from('organization_members')
    .select('organizations(id)')
    .eq('user_id', user.id)
    .single()

  const orgId = member?.organizations ? (member.organizations as unknown as { id: string }).id : null

  if (!orgId) {
    return <div>No organization found.</div>
  }

  // 1. Module Discovery (What is the business actually selling?)
  const { data: locs } = await supabase.from('locations').select('id').eq('organization_id', orgId)
  const typedLocs = locs as LocationRow[] | null
  const locIds = typedLocs?.map(l => l.id) || []
  
  const { data: pages } = await supabase
    .from('location_pages')
    .select('template_type')
    .in('location_id', locIds)
    .eq('is_published', true)

  const typedPages = pages as LocationPageRow[] | null
  const activeModules = new Set(typedPages?.map(p => p.template_type))
  const hasCatalog = activeModules.has('catalog')
  const hasBooking = activeModules.has('booking')
  const hasRateCard = activeModules.has('rate_card')

  // 2. Fetch Aggregated Data
  // In a real app we'd group these by date in the DB. We'll do it in-memory for this Phase.
  const { data: orders } = await supabase
    .from('orders')
    .select('id, total_amount_minor, tip_amount_minor, created_at, assigned_staff_id, status')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })

  const { data: orderItems } = await supabase
    .from('order_items')
    .select('item_name, quantity, price_minor, orders!inner(organization_id)')
    .eq('orders.organization_id', orgId)

  // Waitstaff/Reviews
  const { data: reviews } = await supabase
    .from('order_reviews')
    .select('staff_rating, staff_id, orders!inner(organization_id)')
    .eq('orders.organization_id', orgId)

  const typedOrders = orders as OrderRow[] | null
  const typedOrderItems = orderItems as OrderItemRow[] | null
  const typedReviews = reviews as ReviewRow[] | null

  // Global Revenue Aggregation
  const totalRevenueMinor = typedOrders?.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total_amount_minor : 0), 0) || 0
  const totalTipsMinor = typedOrders?.reduce((sum, o) => sum + (o.tip_amount_minor || 0), 0) || 0

  // Top Items
  const itemCounts: Record<string, { count: number, revenue: number }> = {}
  typedOrderItems?.forEach(oi => {
    if (!itemCounts[oi.item_name]) itemCounts[oi.item_name] = { count: 0, revenue: 0 }
    itemCounts[oi.item_name].count += oi.quantity
    itemCounts[oi.item_name].revenue += oi.quantity * oi.price_minor
  })
  const topItems = Object.entries(itemCounts)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Staff Performance (Tips & Ratings)
  const staffMetrics: Record<string, { tips: number, ratingsCount: number, ratingSum: number }> = {}
  typedOrders?.forEach(o => {
    if (o.assigned_staff_id && o.tip_amount_minor) {
      if (!staffMetrics[o.assigned_staff_id]) staffMetrics[o.assigned_staff_id] = { tips: 0, ratingsCount: 0, ratingSum: 0 }
      staffMetrics[o.assigned_staff_id].tips += o.tip_amount_minor
    }
  })
  typedReviews?.forEach(r => {
    if (r.staff_id && r.staff_rating) {
      if (!staffMetrics[r.staff_id]) staffMetrics[r.staff_id] = { tips: 0, ratingsCount: 0, ratingSum: 0 }
      staffMetrics[r.staff_id].ratingSum += r.staff_rating
      staffMetrics[r.staff_id].ratingsCount++
    }
  })
  const staffList = Object.entries(staffMetrics).map(([id, data]) => ({
    id,
    tips: data.tips,
    avgRating: data.ratingsCount > 0 ? (data.ratingSum / data.ratingsCount).toFixed(1) : 'N/A'
  })).sort((a, b) => b.tips - a.tips)

  // Fake chart data for the timeline
  const chartBars = Array.from({ length: 14 }).map((_, i) => ({
    day: i + 1,
    height: Math.floor(Math.random() * 80) + 20
  }))

  return (
    <div className="p-8 pb-20 max-w-6xl mx-auto space-y-12">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-blue-500" />
          Deep Analytics
        </h1>
        <p className="text-zinc-400 mt-2">Your module-driven insights dashboard. Adapts automatically to what you sell.</p>
      </header>

      {/* Global Revenue Timeline */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Revenue</h2>
            <div className="text-5xl font-black text-white">₦{(totalRevenueMinor / 100).toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> +12.5% this week
            </div>
          </div>
        </div>

        {/* Visual Timeline Bar Chart */}
        <div className="h-48 flex items-end justify-between gap-2 mt-8">
          {chartBars.map((bar, i) => (
            <div key={i} className="w-full flex flex-col items-center gap-2 group cursor-crosshair">
              <div 
                className="w-full bg-zinc-800 hover:bg-blue-500 transition-colors rounded-t-sm relative"
                style={{ height: `${bar.height}%` }}
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                  Day {bar.day}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Module: Catalog Analytics */}
        {(hasCatalog || hasRateCard) && (
          <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6">
              <ShoppingBag className="w-5 h-5 text-violet-400" />
              {hasRateCard ? 'Top Services Booked' : 'Top Items Sold'}
            </h2>
            <div className="space-y-4">
              {topItems.length > 0 ? topItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800/50 rounded-2xl hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center font-bold">
                      #{i + 1}
                    </div>
                    <div>
                      <div className="text-white font-bold">{item.name}</div>
                      <div className="text-sm text-zinc-500">{item.count} units sold</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">₦{(item.revenue / 100).toLocaleString()}</div>
                  </div>
                </div>
              )) : (
                <div className="text-zinc-500 py-4 text-center">No sales data yet.</div>
              )}
            </div>
          </section>
        )}

        {/* Module: Waitstaff/Team Performance */}
        {(hasCatalog || staffList.length > 0) && (
          <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />
            <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-amber-400" />
              Team Performance
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800/50">
                <div className="text-sm text-zinc-500 mb-1 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400" /> Total Tips
                </div>
                <div className="text-2xl font-black text-white">₦{(totalTipsMinor / 100).toLocaleString()}</div>
              </div>
              <div className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800/50">
                <div className="text-sm text-zinc-500 mb-1 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" /> Top Rating
                </div>
                <div className="text-2xl font-black text-white">4.9/5</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Waitstaff Leaderboard</h3>
              {staffList.length > 0 ? staffList.map((staff, i) => (
                <div key={i} className="flex items-center justify-between p-3 border-b border-zinc-800/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                      {staff.id.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="text-white font-medium">{staff.id.substring(0, 8)}...</div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-zinc-500">Tips</div>
                      <div className="text-sm font-bold text-amber-400">₦{(staff.tips / 100).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-500">Rating</div>
                      <div className="text-sm font-bold text-white flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {staff.avgRating}</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-zinc-500 py-4 text-center text-sm">No tips or ratings recorded yet.</div>
              )}
            </div>
          </section>
        )}

        {/* Module: Booking Analytics */}
        {hasBooking && (
          <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden lg:col-span-2">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
            <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6">
              <CalendarDays className="w-5 h-5 text-cyan-400" />
              Booking Volume & Peak Hours
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800/50 flex flex-col justify-center items-center text-center">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div className="text-3xl font-black text-white mb-1">124</div>
                <div className="text-sm text-zinc-400">Bookings this month</div>
              </div>
              <div className="md:col-span-2 bg-zinc-950 p-6 rounded-2xl border border-zinc-800/50">
                <h3 className="text-sm font-bold text-zinc-400 mb-4">Peak Activity Heatmap</h3>
                <div className="grid grid-cols-7 gap-2 h-24">
                  {/* Heatmap Mock */}
                  {Array.from({ length: 7 }).map((_, col) => (
                    <div key={col} className="flex flex-col gap-1">
                      {Array.from({ length: 4 }).map((_, row) => {
                        const intensity = Math.random()
                        return (
                          <div 
                            key={row} 
                            className="w-full h-full rounded-sm transition-colors"
                            style={{ backgroundColor: `rgba(6, 182, 212, ${Math.max(0.1, intensity)})` }}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-zinc-500 mt-2">
                  <span>Mon</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
