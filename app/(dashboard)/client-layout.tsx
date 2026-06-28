'use client'



import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { setActiveLocationCookie } from './layout-actions'
import {
  LayoutDashboard, ClipboardList, BarChart3, BookOpen,
   
   
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  FileText, Settings, CreditCard, LogOut, Zap, Menu, X, Users, QrCode, TrendingUp, MessageSquare
} from 'lucide-react'
import { GlobalRealtime } from './global-realtime'
import { NotificationCenter } from './notification-center'
import { ServiceWorkerRegistration } from '@/app/components/service-worker-registration'
import { TimeclockWidget } from './timeclock-widget'

export interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: string
  exact?: boolean
}

const baseNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
]

const managerItems: NavItem[] = [
  { href: '/dashboard/customers', label: 'CRM & Loyalty', icon: Users },
  { href: '/dashboard/team-performance', label: 'Team Performance', icon: BarChart3 },
  { href: '/dashboard/manage/feedback', label: 'Feedback Inbox', icon: MessageSquare },
  { href: '/dashboard/qr', label: 'QR Generator', icon: QrCode },
  { href: '/dashboard/menu', label: 'Catalog Manager', icon: BookOpen },
  { href: '/dashboard/pages', label: 'Your Pages', icon: FileText },
  { href: '/dashboard/settings', label: 'Settings & Team', icon: Settings },
]

function NavLink({ href, label, icon: Icon, badge, exact, onClick }: {
  href: string; label: string; icon: React.ElementType; badge?: string; exact?: boolean; onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
        isActive
          ? 'text-white'
          : 'text-zinc-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="activeNavBg"
          className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/10 border border-violet-500/30 rounded-xl shadow-lg shadow-violet-900/20"
          initial={false}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      {isActive && (
        <motion.span 
          layoutId="activeNavIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gradient-to-b from-violet-400 to-indigo-400 rounded-full z-10" 
          initial={false}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      <div className="relative flex items-center gap-3 w-full z-10">
        <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
        <span className="flex-1">{label}</span>
        {badge && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
            {badge}
          </span>
        )}
      </div>
    </Link>
  )
}

export interface InitialDashboardData {
  orgName: string;
  locations: any[];
  activeLocationId: string;
  locationSlug: string;
  isOwnerOrManager: boolean;
  userEmail: string;
  credits: number | null;
  dynamicNavItems: NavItem[];
}

export default function ClientLayout({ children, initialData }: { children: ReactNode, initialData: InitialDashboardData }) {
  const [orgName, setOrgName] = useState(initialData.orgName)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [locations, setLocations] = useState<any[]>(initialData.locations)
  const [activeLocationId, setActiveLocationId] = useState(initialData.activeLocationId)
  const [locationSlug, setLocationSlug] = useState(initialData.locationSlug)
  const [isOwnerOrManager, setIsOwnerOrManager] = useState(initialData.isOwnerOrManager)
  const [time, setTime] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userEmail, setUserEmail] = useState(initialData.userEmail)
  const [dynamicNavItems, setDynamicNavItems] = useState<NavItem[]>(initialData.dynamicNavItems)

  const [credits, setCredits] = useState<number | null>(initialData.credits)

  useEffect(() => {
    // Data is now fetched server-side in layout.tsx, so we don't need the client fetcher 
    // unless we want to refresh later. We just need the timer.

    const update = () => setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
    update()
    const i = setInterval(update, 60000)
    return () => clearInterval(i)
     
  }, [])

  const renderNavContent = (onClose?: () => void) => (
    <>
        <div className="p-6 pb-2">
          <Link href="/dashboard" className="flex items-center gap-3 group mb-4" onClick={onClose}>
            <div className="w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <Image src="/ourmenu-qr-icon.svg" alt="OurMenu Logo" width={32} height={32} className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold tracking-tight leading-tight">OurMenu OS</span>
              {/* OS Version removed as requested */}
            </div>
          </Link>
          {locations.length > 0 && (
            <div className="relative">
              <select
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 appearance-none focus:outline-none focus:border-violet-500 transition-colors"
                value={activeLocationId}
                onChange={async (e) => {
                  const newId = e.target.value
                  setActiveLocationId(newId)
                  await setActiveLocationCookie(newId)
                  window.location.reload()
                }}
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-hide">
          <div className="space-y-1">
            <h3 className="px-3 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Daily Operations</h3>
            {dynamicNavItems.map((item) => (
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

          {(userEmail === (process.env.ADMIN_EMAIL || 'kryptopacy@gmail.com')) && (
            <div className="space-y-1">
              <div className="px-3 flex items-center gap-2 mb-3 mt-4">
                <h3 className="text-xs font-bold text-violet-500 uppercase tracking-wider">Superadmin</h3>
                <div className="h-px flex-1 bg-violet-500/20"></div>
              </div>
              <NavLink href="/dashboard/admin" label="Developer Console" icon={Zap} onClick={onClose} />
            </div>
          )}
        </div>

        <div className="p-4 mt-auto">
          {credits !== null && (
            <Link href="/dashboard/billing" className="flex items-center justify-between px-3 py-2.5 bg-violet-500/10 hover:bg-violet-500/20 rounded-xl border border-violet-500/20 mb-4 transition-colors group" onClick={onClose}>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold text-violet-100">Credits</span>
              </div>
              <span className="text-xs font-black text-violet-400 group-hover:scale-110 transition-transform">{credits}</span>
            </Link>
          )}
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
      <ServiceWorkerRegistration />
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-[#0a0a0a] border-r border-white/5 relative z-20 print:hidden">
        {renderNavContent()}
      </aside>

      {/* Mobile Header & Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 z-50 flex items-center justify-between px-4 print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center">
            <Image src="/ourmenu-qr-icon.svg" alt="OurMenu Logo" width={24} height={24} className="object-contain" />
          </div>
          <span className="text-white font-bold tracking-tight">OurMenu OS</span>
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
            {locationSlug && <TimeclockWidget locationId={locationSlug} />}
            <div className="w-px h-4 bg-zinc-800"></div>
            <NotificationCenter />
            <div className="w-px h-4 bg-zinc-800"></div>
            {orgName ? (
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{orgName}</span>
            ) : (
              <div className="h-3 w-24 bg-zinc-800 rounded-full animate-pulse" />
            )}
          </div>
        </div>
        <div className="flex-1 p-4 md:p-10 max-w-[1600px] mx-auto w-full print:p-0">
          {children}
        </div>
      </main>
    </div>
  )
}
