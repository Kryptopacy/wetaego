'use client'



import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
  
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { setActiveLocationCookie } from './layout-actions'
import {
  LayoutDashboard, ClipboardList, BarChart3, BookOpen, ChevronRight, CreditCard, Home, Menu, MessageSquare, Package, QrCode, Settings, Store, Users, Zap, X, User, FileText, LogOut, TrendingUp, Truck, MapPin
} from 'lucide-react'
import { GlobalRealtime } from './global-realtime'
import { NotificationCenter } from './notification-center'
import { ServiceWorkerRegistration } from '@/app/components/service-worker-registration'
import { TimeclockWidget } from './timeclock-widget'
import { CommandPalette } from './components/command-palette'

export interface NavItem {
  href: string
  label: string
  icon: React.ElementType | string
  badge?: string
  exact?: boolean
}

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  BookOpen,
  FileText,
  Settings,
  CreditCard,
  LogOut,
  Zap,
  Menu,
  X,
  Users,
  QrCode,
  TrendingUp,
  MessageSquare,
  Package
}


// managerItems are now built dynamically inside ClientLayout

function NavLink({ href, label, icon: iconProp, badge, exact, onClick }: {
  href: string; label: string; icon: React.ElementType | string; badge?: string; exact?: boolean; onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)
  const Icon = typeof iconProp === 'string' ? ICON_MAP[iconProp] : iconProp
  
  if (!Icon) return null;

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
          className="absolute inset-0 bg-zinc-800/50 border border-zinc-700/50 rounded-xl"
          initial={false}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      {isActive && (
        <motion.span 
          layoutId="activeNavIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-500 rounded-full z-10" 
          initial={false}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      <div className="relative flex items-center gap-3 w-full z-10">
        <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
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

function BottomNavItem({ href, label, icon: iconProp, badge, exact, onClick }: {
  href: string; label: string; icon: React.ElementType | string; badge?: string; exact?: boolean; onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)
  const Icon = typeof iconProp === 'string' ? ICON_MAP[iconProp] : iconProp
  
  if (!Icon) return null;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center w-full py-1 gap-1 transition-colors ${
        isActive ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      <div className="relative">
        <Icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : 'scale-100'}`} />
        {badge && (
          <span className="absolute -top-1 -right-2 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0a0a0a]" />
        )}
      </div>
      <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>{label}</span>
      {isActive && (
        <motion.div
          layoutId="activeBottomNav"
          className="absolute -bottom-2 w-8 h-1 bg-emerald-500 rounded-t-full shadow-[0_-2px_10px_rgba(139,92,246,0.5)]"
          initial={false}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
    </Link>
  )
}

export interface InitialDashboardData {
  orgName: string;
  locations: { id: string, name: string }[];
  activeLocationId: string;
  locationSlug: string;
  isOwnerOrManager: boolean;
  userEmail: string;
  isAdmin: boolean;
  credits: number | null;
  dynamicNavItems: NavItem[];
  plan?: string;
  planStatus?: string;
  trialEndsAt?: string | null;
  templateType: string;
  hasOrg: boolean;
}

export default function ClientLayout({ children, initialData }: { children: ReactNode, initialData: InitialDashboardData }) {
  const [orgName] = useState(initialData.orgName)
  const [locations] = useState<{ id: string, name: string }[]>(initialData.locations)
  const [activeLocationId, setActiveLocationId] = useState(initialData.activeLocationId)
  const [locationSlug] = useState(initialData.locationSlug)
  const [isOwnerOrManager] = useState(initialData.isOwnerOrManager)
  const [time, setTime] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dynamicNavItems, setDynamicNavItems] = useState<NavItem[]>(initialData.dynamicNavItems)
  const [isTrialBannerDismissed, setIsTrialBannerDismissed] = useState(false)

  // Append Delivery Kanban to daily operations if not already there
  useEffect(() => {
    setDynamicNavItems(prev => {
      if (!prev.find(item => item.href === '/dashboard/delivery')) {
        return [...prev, { href: '/dashboard/delivery', label: 'Delivery Hub', icon: Truck }]
      }
      return prev
    })
  }, [])

  const [credits] = useState<number | null>(initialData.credits)

  let trialDaysLeft = null
  if (initialData.planStatus === 'trial' && initialData.trialEndsAt) {
    const diff = new Date(initialData.trialEndsAt).getTime() - new Date().getTime()
    trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)))
  }

  const managerItems: NavItem[] = [
    { href: '/dashboard/inventory', label: 'Inventory (BOM)', icon: Package },
    { href: '/dashboard/resources', label: 'Visual Resources', icon: MapPin },
    { href: '/dashboard/customers', label: 'CRM & Loyalty', icon: Users },
    { href: '/dashboard/team-performance', label: 'Team Performance', icon: BarChart3 },
    { href: '/dashboard/manage/feedback', label: 'Feedback Inbox', icon: MessageSquare },
    { href: '/dashboard/qr', label: 'QR Generator', icon: QrCode },
    { 
      href: '/dashboard/menu', 
      label: initialData.templateType === 'booking' ? 'Services Manager' : 
             initialData.templateType === 'listing' ? 'Listings Manager' : 
             initialData.templateType === 'rate_card' ? 'Offerings Manager' : 'Catalog Manager', 
      icon: BookOpen 
    },
    { href: '/dashboard/pages', label: 'Your Pages', icon: FileText },
    { href: '/dashboard/settings', label: 'Settings & Team', icon: Settings },
    { href: '/dashboard/billing', label: 'Billing & Plan', icon: CreditCard },
  ]

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
              <div className="flex items-center gap-2">
                <span className="text-white font-bold tracking-tight leading-tight">OurMenu OS</span>
                {initialData.plan && (
                  <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                    {initialData.plan}
                  </span>
                )}
              </div>
            </div>
          </Link>
          {locations.length > 0 && (
            <div className="relative">
              <select
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 appearance-none focus:outline-none focus:border-emerald-500 transition-colors"
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

          {isOwnerOrManager && initialData.hasOrg && (
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

          {isOwnerOrManager && !initialData.hasOrg && (
            <div className="space-y-1">
              <div className="px-3 flex items-center gap-2 mb-3">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Setup</h3>
                <div className="h-px flex-1 bg-zinc-800/50"></div>
              </div>
              <NavLink href="/dashboard/settings" label="Settings & Team" icon={Settings} onClick={onClose} />
            </div>
          )}

          {initialData.isAdmin && (
            <div className="space-y-1">
              <div className="px-3 flex items-center gap-2 mb-3 mt-4">
                <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Superadmin</h3>
                <div className="h-px flex-1 bg-emerald-500/20"></div>
              </div>
              <NavLink href="/dashboard/admin" label="Developer Console" icon={Zap} onClick={onClose} />
            </div>
          )}
        </div>

        <div className="p-4 mt-auto">
          {!isTrialBannerDismissed && trialDaysLeft !== null && trialDaysLeft > 0 && (
            <div className="relative flex items-center justify-between px-3 py-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 mb-3 pr-8">
              <span className="text-xs font-medium text-blue-400">Free Trial</span>
              <span className="text-xs font-bold text-blue-300">{trialDaysLeft} days left</span>
              <button 
                onClick={(e) => { e.preventDefault(); setIsTrialBannerDismissed(true) }} 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-blue-400/70 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                aria-label="Dismiss trial banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {trialDaysLeft === 0 && initialData.planStatus === 'trial' && (
             <div className="flex items-center justify-between px-3 py-2.5 bg-red-500/10 rounded-xl border border-red-500/20 mb-3">
             <span className="text-xs font-medium text-red-400">Free Trial</span>
             <span className="text-xs font-bold text-red-300">Expired</span>
           </div>
          )}
          {credits !== null && (
            <Link href="/dashboard/billing" className="flex items-center justify-between px-3 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl border border-emerald-500/20 mb-4 transition-colors group" onClick={onClose}>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-100">Credits</span>
              </div>
              <span className="text-xs font-black text-emerald-400 group-hover:scale-110 transition-transform">{credits}</span>
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

          <Link 
            href="/dashboard/profile"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all w-full mb-1"
          >
            <User className="w-4 h-4" />
            <span>My Profile</span>
          </Link>

          <button 
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full mb-4"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
          
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
    <div className="h-[100dvh] overflow-hidden bg-black flex selection:bg-emerald-500/30 print:bg-white print:h-auto print:overflow-visible">
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
      <main className="flex-1 flex flex-col h-full relative pt-16 pb-20 md:pt-0 md:pb-0 overflow-y-auto print:pt-0 print:pb-0 print:overflow-visible">
        <CommandPalette />
        <div className="absolute top-0 right-0 p-6 z-10 hidden md:block print:hidden">
          <div className="flex items-center gap-4 bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 px-4 py-2 rounded-full shadow-xl">
            {locationSlug && <TimeclockWidget locationId={locationSlug} />}
            <div className="w-px h-4 bg-zinc-800"></div>
            <NotificationCenter />
            <div className="w-px h-4 bg-zinc-800"></div>
            {orgName ? (
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{orgName}</span>
            ) : (
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Setup Workspace</span>
            )}
          </div>
        </div>
        <div className="flex-1 p-4 md:p-10 max-w-[1600px] mx-auto w-full print:p-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-white/10 z-50 flex items-center justify-around px-2 pb-safe pt-2 print:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <BottomNavItem href="/dashboard" icon={LayoutDashboard} label="Home" exact />
        {dynamicNavItems[0] && (
          <BottomNavItem href={dynamicNavItems[0].href} icon={dynamicNavItems[0].icon} label={dynamicNavItems[0].label} badge={dynamicNavItems[0].badge} />
        )}
        <BottomNavItem href="/dashboard/pages" icon={FileText} label="Pages" />
        <BottomNavItem href="/dashboard/settings" icon={Settings} label="Settings" />
      </div>
    </div>
  )
}
