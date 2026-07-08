
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import Link from 'next/link'
import {
  BarChart3, BookOpen, ClipboardList, FileText,
  QrCode, Sparkles, TrendingUp, Users, ArrowRight,
  Globe, AlertTriangle
} from 'lucide-react'
import { OnboardingChecklist } from './components/onboarding-checklist'
import { RevenueDataPoint } from './components/revenue-chart'
import { BUSINESS_TYPE_PRESETS } from '@/lib/templates/presets'
import { format, subDays, startOfDay } from 'date-fns'
import { DashboardStats } from './components/dashboard-stats'
import { Suspense } from 'react'

export default async function DashboardOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  
  

  if (!user) {
    redirect('/login')
  }

  let orgId = ''
  let orgName = 'Your Venue'
  let locationSlug = ''
  let orgBusinessType: string | null = null

  const { data: member } = await supabase
    .from('organization_members')
    .select('role, organizations(id, name, business_type)')
    .eq('user_id', user!.id)
    .single()

  if (member?.organizations) {
    const org = member.organizations as unknown as { id: string, name: string, business_type: string | null }
    orgId = org.id
    orgName = org.name || 'Your Venue'
    orgBusinessType = org.business_type
  } else {
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, business_type')
      .eq('created_by', user!.id)
      .single()
    orgId = org?.id || ''
    orgName = org?.name || 'Your Venue'
    orgBusinessType = org?.business_type || null
  }

  let templateType = 'catalog'
  if (orgBusinessType && BUSINESS_TYPE_PRESETS[orgBusinessType]) {
    templateType = BUSINESS_TYPE_PRESETS[orgBusinessType].template_type
  }

  // Time-aware greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (orgId) {
    const { data: loc } = await supabase
      .from('locations')
      .select('slug')
      .eq('organization_id', orgId)
      .single()
  
    locationSlug = loc?.slug || ''
  }

  // Heavy fetches moved to DashboardStats component for streaming

  const aiModules = [
    {
      href: '/dashboard/pages',
      icon: Sparkles,
      label: 'AI Copywriter & Image Studio',
      desc: 'Auto-generate engaging descriptions and professional images for your items and services.',
      color: 'from-violet-600/20 to-fuchsia-600/10',
      border: 'border-violet-500/20',
      iconColor: 'text-violet-400',
    },
    {
      href: '/dashboard/forecast',
      icon: BarChart3,
      label: 'Demand Forecast',
      desc: 'Predict which items to stock up on in the next 7 days.',
      color: 'from-violet-600/20 to-fuchsia-600/10',
      border: 'border-violet-500/20',
      iconColor: 'text-violet-400',
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

  // Use the template's default currency if none is found on the org (defaults to NGN)
  const currencyCode = 'NGN' // Note: In a real multi-currency setup, this would come from the org settings

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* === WELCOME HEADER === */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-zinc-500 text-sm mb-1">
            {orgId ? `${greeting}, ${orgName} 👋` : `Welcome to OurMenu OS 👋`}
          </p>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {orgId ? 'Overview' : 'Get Started'}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {orgId 
              ? `Here's what's happening across your venue today.` 
              : `Complete your business profile to unlock your dashboard.`}
          </p>
        </div>
        {orgId && (
          <Link
            href="/dashboard/menu"
            className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-900/30"
          >
            <Sparkles className="w-4 h-4" />
            Open AI Studio
          </Link>
        )}
      </div>

      <OnboardingChecklist 
        hasOrg={!!orgId} 
        hasLocation={!!locationSlug} 
        hasMenu={true} 
        hasQR={true} 
        templateType={templateType}
      />

      {!!orgId && (
        <>
          <Suspense fallback={
            <div className="w-full flex items-center justify-center p-12 bg-zinc-900/40 rounded-2xl border border-white/[0.06] animate-pulse h-[400px]">
              <p className="text-zinc-500 font-medium">Loading metrics...</p>
            </div>
          }>
            <DashboardStats orgId={orgId} templateType={templateType} />
          </Suspense>

      {/* === AI MODULES GRID === */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
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
        </>
      )}
    </div>
  )
}


