
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import Link from 'next/link'
import {
  BarChart3, BookOpen, ClipboardList, FileText,
  QrCode, Sparkles, TrendingUp, Users, Zap, ArrowRight,
  Globe, AlertTriangle
} from 'lucide-react'

export default async function DashboardOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  
  

  if (!user) {
    redirect('/login')
  }

  let orgId = ''
  let orgName = 'Your Venue'
  let locationSlug = ''

  const { data: member } = await supabase
    .from('organization_members')
    .select('role, organizations(id, name)')
    .eq('user_id', user!.id)
    .single()

  if (member?.organizations) {
    orgId = (member.organizations as unknown as { id: string, name: string })?.id
    orgName = (member.organizations as unknown as { id: string, name: string })?.name || 'Your Venue'
  } else {
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('created_by', user!.id)
      .single()
    orgId = org?.id || ''
    orgName = org?.name || 'Your Venue'
  }

  if (orgId) {
    const { data: loc } = await supabase
      .from('locations')
      .select('slug')
      .eq('organization_id', orgId)
      .single()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
    locationSlug = loc?.slug || ''
  }

  // Fetch real stats or use mock stats
  let menuCount = 48
  let qrCount = 12
  let orderCount = 127
  let requestCount = 3

  if (orgId) {
    const [menuItemsRes, qrScansRes, ordersRes, requestsRes] = await Promise.all([
      supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('qr_codes').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)
        .gte('created_at', new Date(1718236800000 - 86400000).toISOString()),
      supabase.from('service_requests').select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId).eq('status', 'pending'),
    ])
    
    menuCount = menuItemsRes.count ?? 0
    qrCount = qrScansRes.count ?? 0
    orderCount = ordersRes.count ?? 0
    requestCount = requestsRes.count ?? 0
  }

  const stats = [
    {
      label: 'Menu Items',
      value: menuCount,
      icon: BookOpen,
      color: 'from-violet-600 to-indigo-600',
      glow: 'shadow-violet-900/40',
      change: '+2 this week',
      trend: 'up',
    },
    {
      label: "Today's Orders",
      value: orderCount,
      icon: TrendingUp,
      color: 'from-emerald-600 to-teal-600',
      glow: 'shadow-emerald-900/40',
      change: 'Live count',
      trend: 'up',
    },
    {
      label: 'Active QR Codes',
      value: qrCount,
      icon: QrCode,
      color: 'from-blue-600 to-cyan-600',
      glow: 'shadow-blue-900/40',
      change: 'Across all tables',
      trend: 'neutral',
    },
    {
      label: 'Pending Requests',
      value: requestCount,
      icon: AlertTriangle,
      color: requestCount ? 'from-orange-600 to-red-600' : 'from-zinc-600 to-zinc-700',
      glow: requestCount ? 'shadow-orange-900/40' : 'shadow-none',
      change: requestCount ? 'Needs attention' : 'All clear',
      trend: requestCount ? 'alert' : 'neutral',
    },
  ]

  const aiModules = [
    {
      href: '/dashboard/pages',
      icon: Sparkles,
      label: 'AI Copywriter & Image Studio',
      desc: 'Auto-generate engaging descriptions and professional images for your items and services.',
      color: 'from-violet-600/20 to-indigo-600/10',
      border: 'border-violet-500/20',
      iconColor: 'text-violet-400',
    },
    {
      href: '/dashboard/forecast',
      icon: BarChart3,
      label: 'Demand Forecast',
      desc: 'Predict which items to stock up on in the next 7 days.',
      color: 'from-emerald-600/20 to-teal-600/10',
      border: 'border-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      href: '/dashboard/orders',
      icon: ClipboardList,
      label: 'Smart Triage',
      desc: 'AI-ranked service requests. Critical alerts flash red instantly.',
      color: 'from-red-600/20 to-orange-600/10',
      border: 'border-red-500/20',
      iconColor: 'text-red-400',
    },
    {
      href: '/dashboard/pages',
      icon: Globe,
      label: 'Edge Translator',
      desc: 'Auto-detect tourist languages. Translate menus in one tap.',
      color: 'from-blue-600/20 to-cyan-600/10',
      border: 'border-blue-500/20',
      iconColor: 'text-blue-400',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* === WELCOME HEADER === */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-zinc-500 text-sm mb-1">Good morning, {orgName} 👋</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Overview</h1>
          <p className="text-zinc-400 text-sm mt-1">Here&apos;s what&apos;s happening across your venue today.</p>
        </div>
        <Link
          href="/dashboard/menu"
          className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-900/30"
        >
          <Sparkles className="w-4 h-4" />
          Open AI Studio
        </Link>
      </div>

      {/* === QUICK ACTIONS === */}
      <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 backdrop-blur p-6">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-zinc-400" />
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/orders"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold hover:from-violet-500 hover:to-indigo-500 transition-all shadow-md shadow-violet-900/30"
          >
            <ClipboardList className="w-4 h-4" />
            Live Fulfillment
          </Link>
          <Link
            href="/dashboard/menu"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            Catalog Manager
          </Link>
          <Link
            href="/dashboard/forecast"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition-all"
          >
            <BarChart3 className="w-4 h-4" />
            Run Forecast
          </Link>
          <Link
            href="/dashboard/pages"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition-all"
          >
            <FileText className="w-4 h-4" />
            Custom Pages
          </Link>
        </div>
      </div>

      {/* === STATS BENTO GRID === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, glow, change, trend }) => (
          <div
            key={label}
            className={`relative rounded-2xl border border-white/[0.06] bg-zinc-900/60 backdrop-blur p-5 overflow-hidden group hover:border-white/10 transition-all duration-300`}
          >
            {/* Subtle gradient orb */}
            <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${color} opacity-20 blur-2xl group-hover:opacity-30 transition-opacity`} />
            
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg ${glow}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-widest mb-1">{label}</p>
            <p className="text-4xl font-bold text-white tabular-nums">{value}</p>
            <p className={`text-xs mt-1.5 font-medium ${trend === 'alert' ? 'text-orange-400' : trend === 'up' ? 'text-emerald-400' : 'text-zinc-500'}`}>
              {change}
            </p>
          </div>
        ))}
      </div>

      {/* === AI MODULES GRID === */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="text-base font-bold text-white">AI Engine Modules</h2>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">4 ACTIVE</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {aiModules.map(({ href, icon: Icon, label, desc, color, border, iconColor }) => (
            <Link
              key={href}
              href={href}
              className={`group relative rounded-2xl border ${border} bg-gradient-to-br ${color} p-5 overflow-hidden hover:scale-[1.02] transition-all duration-300`}
            >
              <Icon className={`w-8 h-8 ${iconColor} mb-4`} />
              <h3 className="font-bold text-white text-sm mb-1.5">{label}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{desc}</p>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-4 h-4 text-zinc-400" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}


