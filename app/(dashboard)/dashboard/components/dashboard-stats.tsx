import { createClient } from '@/lib/supabase/server'
import { format, subDays, startOfDay } from 'date-fns'
import { BookOpen, TrendingUp, QrCode, AlertTriangle } from 'lucide-react'
import { RevenueChart, RevenueDataPoint } from './revenue-chart'

export async function DashboardStats({ orgId, templateType }: { orgId: string, templateType: string }) {
  if (!orgId) return null

  const supabase = await createClient()

  // Fetch real stats
  const [menuItemsRes, qrScansRes, ordersRes, requestsRes] = await Promise.all([
    supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('qr_codes').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase.from('service_requests').select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('status', 'pending'),
  ])
  
  const menuCount = menuItemsRes.count ?? 0
  const qrCount = qrScansRes.count ?? 0
  const orderCount = ordersRes.count ?? 0
  const requestCount = requestsRes.count ?? 0

  // Fetch chart data for last 7 days
  let chartData: RevenueDataPoint[] = []
  const sevenDaysAgo = startOfDay(subDays(new Date(), 6)).toISOString()
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('created_at, total_amount_minor, status')
    .eq('organization_id', orgId)
    .eq('status', 'paid')
    .gte('created_at', sevenDaysAgo)

  // Build default 7 days structure with zero values
  const daysMap = new Map<string, RevenueDataPoint>()
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i)
    daysMap.set(format(d, 'yyyy-MM-dd'), { date: format(d, 'EEE'), revenue: 0, orders: 0 })
  }

  if (recentOrders) {
    recentOrders.forEach(order => {
      const dateKey = format(new Date(order.created_at), 'yyyy-MM-dd')
      if (daysMap.has(dateKey)) {
        const entry = daysMap.get(dateKey)!
        entry.revenue += order.total_amount_minor || 0
        entry.orders += 1
      }
    })
  }

  chartData = Array.from(daysMap.values())

  const stats = [
    {
      label: templateType === 'catalog' ? 'Menu Items' : templateType === 'booking' ? 'Services' : templateType === 'listing' ? 'Listings' : 'Offerings',
      value: menuCount,
      icon: BookOpen,
      color: 'from-emerald-600 to-teal-600',
      glow: 'shadow-emerald-900/40',
      change: menuCount > 0 ? `${menuCount} active` : 'None yet',
      trend: 'neutral',
    },
    {
      label: templateType === 'catalog' ? "Today's Orders" : templateType === 'booking' ? "Today's Bookings" : templateType === 'listing' ? "Today's Inquiries" : "Today's Requests",
      value: orderCount,
      icon: TrendingUp,
      color: 'from-emerald-600 to-teal-600',
      glow: 'shadow-emerald-900/40',
      change: 'Live count',
      trend: 'up',
    },
    {
      label: templateType === 'listing' ? 'Printed Signs' : 'Active QR Codes',
      value: qrCount,
      icon: QrCode,
      color: 'from-blue-600 to-cyan-600',
      glow: 'shadow-blue-900/40',
      change: 'All locations',
      trend: 'neutral',
    },
    {
      label: 'Service Requests',
      value: requestCount,
      icon: AlertTriangle,
      color: requestCount ? 'from-orange-600 to-red-600' : 'from-zinc-600 to-zinc-700',
      glow: requestCount ? 'shadow-orange-900/40' : 'shadow-none',
      change: requestCount ? 'Needs attention' : 'All clear',
      trend: requestCount ? 'alert' : 'neutral',
    },
  ]

  const currencyCode = 'NGN' // Setup for future multi-currency

  return (
    <>
      {/* === REVENUE CHART === */}
      <div className="w-full">
        <RevenueChart data={chartData} currencyCode={currencyCode} />
      </div>

      {/* === STATS GRID === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div 
              key={i} 
              className="relative rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-5 overflow-hidden group"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} rounded-full blur-3xl opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500`} />
              
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-zinc-500 text-sm font-medium mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white tracking-tight">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg ${stat.glow}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span className={stat.trend === 'up' ? 'text-emerald-400' : stat.trend === 'alert' ? 'text-red-400' : 'text-zinc-500'}>
                  {stat.change}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
