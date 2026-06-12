'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, ClipboardList, BarChart3, BookOpen,
  FileText, Settings, CreditCard, LogOut, Sparkles, Zap
} from 'lucide-react'
import { GlobalRealtime } from './global-realtime'
import { NotificationCenter } from './notification-center'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/orders', label: 'Live Fulfillment', icon: ClipboardList, badge: 'LIVE' },
  { href: '/dashboard/forecast', label: 'Demand Forecast', icon: BarChart3 },
]

const managerItems = [
  { href: '/dashboard/menu', label: 'Catalog Manager', icon: BookOpen },
  { href: '/dashboard/pages', label: 'Custom Pages', icon: FileText },
  { href: '/dashboard/settings', label: 'Settings & Team', icon: Settings },
]

function NavLink({ href, label, icon: Icon, badge, exact }: {
  href: string; label: string; icon: any; badge?: string; exact?: boolean
}) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
        isActive
          ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-white border border-violet-500/30 shadow-lg shadow-violet-900/20'
          : 'text-zinc-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gradient-to-b from-violet-400 to-indigo-400 rounded-full" />
      )}
      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
          {badge}
        </span>
      )}
    </Link>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [orgName, setOrgName] = useState('Pacy Grills')
  const [locationSlug, setLocationSlug] = useState('')
  const [isExpired, setIsExpired] = useState(false)
  const [isOwnerOrManager, setIsOwnerOrManager] = useState(true)
  const [time, setTime] = useState('')

  useEffect(() => {
    const fetchOrg = async () => {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user) {
        const { data: member } = await supabase
          .from('organization_members')
          .select('organizations(id, name)')
          .eq('user_id', userData.user.id)
          .single()
        if (member && (member.organizations as any)?.name) {
          setOrgName((member.organizations as any).name)
        }
        // Fetch location slug for Live Preview link
        const orgId = (member?.organizations as any)?.id
        if (orgId) {
          const { data: loc } = await supabase
            .from('locations')
            .select('slug')
            .eq('organization_id', orgId)
            .single()
          if (loc?.slug) setLocationSlug(loc.slug)
        }
      }
    }
    fetchOrg()

    const update = () => setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
    update()
    const i = setInterval(update, 60000)
    return () => clearInterval(i)
  }, [])

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-zinc-100 font-sans">

      {/* === SIDEBAR === */}
      <aside className="w-64 shrink-0 hidden md:flex flex-col border-r border-white/5 bg-zinc-950/80 backdrop-blur-xl">

        {/* Logo */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-tight">OurMenu OS</div>
              <div className="text-[10px] text-zinc-500 font-medium">{orgName}</div>
            </div>
          </div>
        </div>

        {/* Live clock */}
        <div className="mx-4 mb-4 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">Local Time</span>
          <span className="text-[11px] font-mono text-zinc-300">{time}</span>
        </div>

        <div className="px-3 flex-1 flex flex-col gap-1 overflow-y-auto">
          {/* Main Nav */}
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Operations</p>
          {navItems.map(item => <NavLink key={item.href} {...item} />)}

          {/* Manager Nav */}
          {isOwnerOrManager && (
            <>
              <div className="mt-8 mb-4 px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Guest Experience
              </div>
              <Link 
                href={locationSlug ? `/m/${locationSlug}` : '/dashboard/settings'} 
                target={locationSlug ? '_blank' : undefined}
                className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors group mb-4"
              >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Live Preview
                <svg className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>

              <div className="mb-4 px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                System
              </div>
              {managerItems.map(item => <NavLink key={item.href} {...item} />)}
            </>
          )}
        </div>



        {/* Bottom Nav */}
        <div className="px-3 pb-4 space-y-1 border-t border-white/5 pt-4">
          {isOwnerOrManager && (
            <NavLink href="/dashboard/billing" label="Billing & Plans" icon={CreditCard} />
          )}
          <Link
            href="/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* === MAIN AREA === */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Header */}
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-white">OurMenu OS</span>
          </div>
          
          <div className="flex-1"></div>
          
          <div className="flex items-center gap-4">
            <NotificationCenter />
          </div>
        </header>

        {/* Global Realtime Provider for Chimes and Toasts */}
        <GlobalRealtime />

        {/* Expired Banner */}
        {isExpired && (
          <div className="bg-gradient-to-r from-red-900/80 to-orange-900/80 text-white px-6 py-3 flex items-center justify-between border-b border-red-500/20">
            <span className="text-sm"><strong>Trial Ended:</strong> Customers can no longer place orders.</span>
            <Link href="/dashboard/billing" className="bg-white text-red-700 font-bold px-4 py-1.5 rounded-full text-xs hover:bg-zinc-100 transition-colors">
              Upgrade Now →
            </Link>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
