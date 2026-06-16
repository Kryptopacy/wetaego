'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, ClipboardList, BarChart3, BookOpen,
  FileText, Settings, CreditCard, LogOut, Zap, Menu, X, Users, QrCode
} from 'lucide-react'
import { GlobalRealtime } from './global-realtime'
import { NotificationCenter } from './notification-center'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/orders', label: 'Live Fulfillment', icon: ClipboardList, badge: 'LIVE' },
  { href: '/dashboard/forecast', label: 'Demand Forecast', icon: BarChart3 },
]

const managerItems = [
  { href: '/dashboard/team-performance', label: 'Team Performance', icon: Users },
  { href: '/dashboard/qr', label: 'QR Generator', icon: QrCode },
  { href: '/dashboard/menu', label: 'Catalog Manager', icon: BookOpen },
  { href: '/dashboard/pages', label: 'Custom Pages', icon: FileText },
  { href: '/dashboard/settings', label: 'Settings & Team', icon: Settings },
]

function NavLink({ href, label, icon: Icon, badge, exact, onClick }: {
  href: string; label: string; icon: any; badge?: string; exact?: boolean; onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      onClick={onClick}
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
  const [isOwnerOrManager, setIsOwnerOrManager] = useState(true)
  const [time, setTime] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const fetchOrg = async () => {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user) {
        const { data: member } = await supabase
          .from('organization_members')
          .select('role, organizations(id, name)')
          .eq('user_id', userData.user.id)
          .single()
        if (member && (member.organizations as any)?.name) {
          setOrgName((member.organizations as any).name)
          setIsOwnerOrManager(['owner', 'manager'].includes(member.role))
        }
        
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

  const renderNavContent = (onClose?: () => void) => (
    <>
        <div className="p-6 pb-2">
          <Link href="/dashboard" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/20 group-hover:scale-105 transition-transform duration-300">
              <span className="text-white font-black text-xl tracking-tighter">OM</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold tracking-tight leading-tight">{orgName}</span>
              <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">OS Version 1.0</span>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-hide">
          <div className="space-y-1">
            <h3 className="px-3 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Daily Operations</h3>
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} onClick={onClose} />
            ))}
          </div>

          {isOwnerOrManager && (
            <div className="space-y-1">
              <div className="px-3 flex items-center gap-2 mb-3">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Management</h3>
                <div className="h-px flex-1 bg-zinc-800/50"></div>
              </div>
              {managerItems.map((item) => (
                <NavLink key={item.href} {...item} onClick={onClose} />
              ))}
            </div>
          )}
        </div>

        <div className="p-4 mt-auto">
          {locationSlug && (
            <a 
              href={`/m/${locationSlug}`} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white text-sm font-medium rounded-xl transition-all mb-4 group"
            >
              Live Preview
              <svg className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          )}
          
          <div className="flex items-center justify-between px-3 py-2 bg-black/40 rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-xs font-medium text-zinc-400">System Active</span>
            </div>
            <span className="text-xs font-mono text-zinc-500">{time}</span>
          </div>
        </div>
    </>
  )

  return (
    <div className="min-h-screen bg-black flex selection:bg-violet-500/30 print:bg-white">
      <GlobalRealtime />
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-[#0a0a0a] border-r border-white/5 relative z-20 print:hidden">
        {renderNavContent()}
      </aside>

      {/* Mobile Header & Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 z-50 flex items-center justify-between px-4 print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-sm">OM</span>
          </div>
          <span className="text-white font-bold tracking-tight">{orgName}</span>
        </div>
        <div className="flex items-center gap-4">
          <NotificationCenter />
          <button onClick={() => setMobileMenuOpen(true)} className="text-zinc-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm print:hidden">
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#0a0a0a] border-l border-white/5 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex justify-end p-4">
              <button onClick={() => setMobileMenuOpen(false)} className="text-zinc-400 hover:text-white bg-zinc-900 p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderNavContent(() => setMobileMenuOpen(false))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen relative pt-16 md:pt-0 print:pt-0">
        <div className="absolute top-0 right-0 p-6 z-10 hidden md:block print:hidden">
          <div className="flex items-center gap-4 bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 px-4 py-2 rounded-full shadow-xl">
            <NotificationCenter />
            <div className="w-px h-4 bg-zinc-800"></div>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{orgName}</span>
          </div>
        </div>
        <div className="flex-1 p-4 md:p-10 max-w-[1600px] mx-auto w-full print:p-0">
          {children}
        </div>
      </main>
    </div>
  )
}
