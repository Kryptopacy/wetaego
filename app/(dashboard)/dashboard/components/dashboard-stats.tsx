import { createClient } from '@/lib/supabase/server'
import { format, subDays, startOfDay } from 'date-fns'
import { BookOpen, TrendingUp, QrCode, AlertTriangle, ShoppingBag, Calendar, Briefcase, BedDouble } from 'lucide-react'
import { RevenueChart, RevenueDataPoint } from './revenue-chart'

export async function DashboardStats({ 
  orgId, 
  templateType = 'catalog',
  businessType
}: { 
  orgId: string
  templateType?: string
  businessType?: string | null
}) {
  if (!orgId) return null

  const supabase = await createClient()

  // Fetch real stats
  const [menuItemsRes, pageItemsRes, qrScansRes, ordersRes, requestsRes] = await Promise.all([
    supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('page_items').select('id', { count: 'exact', head: true }),
    supabase.from('qr_codes').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase.from('service_requests').select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('status', 'pending'),
  ])
  
  const totalItemCount = Math.max(menuItemsRes.count ?? 0, pageItemsRes.count ?? 0)
  const qrCount = qrScansRes.count ?? 0
  const orderCount = ordersRes.count ?? 0
  const requestCount = requestsRes.count ?? 0

  // Fetch chart data for last 7 days
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
        entry.revenue += (order.total_amount_minor || 0)
        entry.orders += 1
      }
    })
  }

  const chartData: RevenueDataPoint[] = Array.from(daysMap.values())

  // Dynamic context mapping
  const isRetail = businessType === 'retail' || businessType === 'fashion' || businessType === 'boutique'
  const isSpa = templateType === 'booking' || businessType === 'spa' || businessType === 'salon'
  const isAgency = templateType === 'rate_card' || templateType === 'quote' || businessType === 'agency'
  const isLodging = templateType === 'listing' || businessType === 'hotel' || businessType === 'resort'

  const itemMeta = isRetail 
    ? { label: 'Active SKUs', icon: ShoppingBag }
    : isSpa 
      ? { label: 'Active Treatments', icon: Calendar }
      : isAgency 
        ? { label: 'Service Offerings', icon: Briefcase }
        : isLodging 
          ? { label: 'Suites & Rooms', icon: BedDouble }
          : { label: 'Menu Offerings', icon: BookOpen }

  const orderMeta = isSpa
    ? { label: "Today's Bookings" }
    : isAgency
      ? { label: "Active Inquiries" }
      : isLodging
        ? { label: "Active Stays" }
        : isRetail
          ? { label: "Today's Orders" }
          : { label: "Today's Orders" }

  const qrMeta = isLodging
    ? { label: 'In-Room Concierge QRs' }
    : isRetail
      ? { label: 'Display & Fitting QRs' }
      : isSpa
        ? { label: 'Check-in & Desk QRs' }
        : { label: 'Active Table QRs' }

  const requestMeta = isLodging
    ? { label: 'Guest Requests' }
    : isSpa
      ? { label: 'Treatment Calls' }
      : isRetail
        ? { label: 'Assistance Calls' }
        : { label: 'Table Calls' }

  const stats = [
    {
      label: itemMeta.label,
      value: totalItemCount,
      icon: itemMeta.icon,
      color: 'from-emerald-600 to-teal-600',
      glow: 'shadow-emerald-900/40',
      change: totalItemCount > 0 ? `${totalItemCount} live items` : 'No items yet',
      trend: 'neutral',
    },
    {
      label: orderMeta.label,
      value: orderCount,
      icon: TrendingUp,
      color: 'from-blue-600 to-indigo-600',
      glow: 'shadow-blue-900/40',
      change: orderCount > 0 ? `${orderCount} recorded` : 'Live activity',
      trend: 'up',
    },
    {
      label: qrMeta.label,
      value: qrCount,
      icon: QrCode,
      color: 'from-violet-600 to-purple-600',
      glow: 'shadow-purple-900/40',
      change: `${qrCount} stations`,
      trend: 'neutral',
    },
    {
      label: requestMeta.label,
      value: requestCount,
      icon: AlertTriangle,
      color: requestCount > 0 ? 'from-orange-600 to-red-600' : 'from-zinc-700 to-zinc-800',
      glow: requestCount > 0 ? 'shadow-orange-900/40' : 'shadow-none',
      change: requestCount > 0 ? `${requestCount} needs attention` : 'All clear',
      trend: requestCount > 0 ? 'alert' : 'neutral',
    },
  ]

  return (
    <div className="space-y-6">
      {/* === REVENUE PACING CHART === */}
      <div className="w-full">
        <RevenueChart data={chartData} currencyCode="NGN" />
      </div>

      {/* === CONTEXT-AWARE METRIC TILES === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div 
              key={i} 
              className="relative rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 overflow-hidden group hover:border-zinc-700 transition-all shadow-md"
            >
              <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-br ${stat.color} rounded-full blur-3xl opacity-[0.05] group-hover:opacity-20 transition-opacity duration-500`} />
              
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1.5">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg ${stat.glow} shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mt-3.5 flex items-center gap-1.5 text-xs font-semibold">
                <span className={stat.trend === 'alert' ? 'text-orange-400 font-bold' : stat.trend === 'up' ? 'text-emerald-400' : 'text-zinc-500'}>
                  {stat.change}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
