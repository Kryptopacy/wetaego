'use client'



import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
  
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { setActiveLocationCookie } from './layout-actions'
import {
  LayoutDashboard, ClipboardList, BarChart3, BookOpen, CreditCard, Menu, MessageSquare, Package, QrCode, Settings, Users, Zap, X, User, FileText, LogOut, TrendingUp, Truck, MapPin, ChevronDown, Check, Clock, Megaphone, Bot, Sparkles, Palette, MonitorSmartphone, MessagesSquare, ExternalLink, Monitor
} from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuGroup, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
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
  tooltip?: string
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
  Package,
  Clock,
  Bot,
  Sparkles,
  Palette,
  Truck,
  MonitorSmartphone,
  MessagesSquare
}


// managerItems are now built dynamically inside ClientLayout

function NavLink({ href, label, icon: iconProp, badge, exact, tooltip, onClick }: {
  href: string; label: string; icon: React.ElementType | string; badge?: string; exact?: boolean; tooltip?: string; onClick?: () => void
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
      <div className="relative flex items-start gap-3 w-full z-10 py-0.5">
        <Icon className={`w-4 h-4 shrink-0 transition-colors mt-0.5 ${isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate leading-tight">{label}</span>
            {badge && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                {badge}
              </span>
            )}
          </div>
          {tooltip && (
            <span className="text-[10px] text-zinc-500 mt-0.5 md:hidden whitespace-normal leading-tight">
              {tooltip}
            </span>
          )}
        </div>
      </div>
      {tooltip && (
        <div className="hidden md:block absolute left-full ml-4 px-2 py-1 bg-zinc-800 text-zinc-200 text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg border border-zinc-700 pointer-events-none">
          {tooltip}
        </div>
      )}
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
  locations: { id: string, name: string, portal_display_name?: string | null }[];
  activeLocationId: string;
  locationSlug: string;
  pages: { id: string, title: string, template_type: string, is_published: boolean }[];
  activePageId: string;
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
  const [locations] = useState<{ id: string, name: string, portal_display_name?: string | null }[]>(initialData.locations)
  const [activeLocationId, setActiveLocationId] = useState(initialData.activeLocationId)
  const [activePageId, setActivePageId] = useState(initialData.activePageId)
  const [pages] = useState(initialData.pages)
  const [locationSlug] = useState(initialData.locationSlug)
  const [isOwnerOrManager] = useState(initialData.isOwnerOrManager)
  const [time, setTime] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dynamicNavItems, setDynamicNavItems] = useState<NavItem[]>(initialData.dynamicNavItems)
  const [isTrialBannerDismissed, setIsTrialBannerDismissed] = useState(false)

  const [credits] = useState<number | null>(initialData.credits)

  let trialDaysLeft = null
  if (initialData.planStatus === 'trial' && initialData.trialEndsAt) {
    const diff = new Date(initialData.trialEndsAt).getTime() - new Date().getTime()
    trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)))
  }

  const activePage = pages.find(p => p.id === activePageId)
  const activeTemplate = activePage ? activePage.template_type : initialData.templateType

  const managerItems: NavItem[] = [
    { 
      href: activePageId ? `/dashboard/pages/${activePageId}/edit` : '/dashboard/taxonomy', 
      label: activeTemplate === 'booking' ? 'Services Manager' : 
             activeTemplate === 'listing' ? 'Listings Manager' : 
             activeTemplate === 'rate_card' ? 'Offerings Manager' : 'Catalog Manager', 
      icon: BookOpen,
      tooltip: 'Manage your offerings, categories, and items'
    },
    { href: '/dashboard/pages', label: 'Your Pages', icon: FileText, tooltip: 'Manage your business pages and branding' },
    { href: '/dashboard/qr', label: 'QR & Signage', icon: QrCode, tooltip: 'Generate print-ready QR codes for tables, rooms, and pages' },
    { href: '/dashboard/inventory', label: 'Inventory (BOM)', icon: Package, tooltip: 'Bill of Materials - Track ingredients and items used per service' },
    { href: '/dashboard/customers', label: 'CRM & Loyalty', icon: Users, tooltip: 'Manage customer profiles and loyalty points' },
    { href: '/dashboard/team-performance', label: 'Performance', icon: BarChart3, tooltip: 'Business ratings, customer feedback, and staff leaderboard' },
    { href: '/dashboard/marketing', label: 'Marketing Hub', icon: Megaphone, tooltip: 'Broadcasts, Ads, and Deals' },
    { href: '/dashboard/settings', label: 'Settings & Apps', icon: Settings, tooltip: 'Configure business settings and integrations' },
    { href: '/dashboard/billing', label: 'Billing & Plan', icon: CreditCard, tooltip: 'Manage your subscription and credits' },
    { href: '/dashboard/support', label: 'Help & Support', icon: MessageSquare, tooltip: 'Get help and contact OurMenuOS support' },
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center justify-between bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5 hover:bg-zinc-800 transition-colors outline-none focus:ring-1 focus:ring-emerald-500">
                    <span className="truncate">
                      {activePageId 
                        ? `↳ ${pages.find(p => p.id === activePageId)?.title || 'Page'}`
                        : activeLocationId === 'global'
                          ? '🌐 All Businesses (Global View)'
                          : `🏢 ${locations.find(l => l.id === activeLocationId)?.portal_display_name || locations.find(l => l.id === activeLocationId)?.name || 'Overview'}`}
                    </span>
                    <ChevronDown className="w-4 h-4 opacity-50 shrink-0 ml-2" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width) max-h-[60vh] overflow-y-auto">
                  {locations.length > 1 && (
                    <>
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          className="cursor-pointer font-bold py-2.5"
                          onClick={async () => {
                            setActiveLocationId('global')
                            setActivePageId('')
                            await setActiveLocationCookie('global', '')
                            window.location.reload()
                          }}
                        >
                          <div className="flex items-center w-full">
                            <span className="mr-2 text-base">🌐</span>
                            <span className="flex-1 truncate text-white">All Businesses (Global View)</span>
                            {!activePageId && activeLocationId === 'global' && <Check className="w-4 h-4 text-emerald-500" />}
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator className="bg-zinc-800 my-1" />
                    </>
                  )}
                  {locations.map((loc) => (
                    <DropdownMenuGroup key={loc.id}>
                      <DropdownMenuLabel className="text-xs text-zinc-500 uppercase tracking-wider font-bold">
                        {loc.portal_display_name || loc.name}
                      </DropdownMenuLabel>
                      
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={async () => {
                          setActiveLocationId(loc.id)
                          setActivePageId('')
                          await setActiveLocationCookie(loc.id, '')
                          window.location.reload()
                        }}
                      >
                        <div className="flex items-center w-full">
                          <span className="mr-2">🏢</span>
                          <span className="flex-1 truncate">Overview (General)</span>
                          {!activePageId && activeLocationId === loc.id && <Check className="w-4 h-4 text-emerald-500" />}
                        </div>
                      </DropdownMenuItem>

                      {loc.id === activeLocationId && (
                        <>
                          {pages.map(page => (
                            <DropdownMenuItem
                              key={page.id}
                              className="cursor-pointer pl-6"
                              onClick={async () => {
                                setActivePageId(page.id)
                                await setActiveLocationCookie(activeLocationId, page.id)
                                window.location.reload()
                              }}
                            >
                              <div className="flex items-center w-full">
                                <span className="mr-2 text-zinc-500">↳</span>
                                <span className="flex-1 truncate">{page.title}</span>
                                {activePageId === page.id && <Check className="w-4 h-4 text-emerald-500" />}
                              </div>
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem className="cursor-pointer pl-6 text-emerald-400 font-semibold" asChild>
                            <Link href="/dashboard/menus" onClick={onClose}>
                              <span className="mr-2 text-emerald-400">➕</span>
                              <span className="flex-1 truncate">+ Create Menu / Catalog</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {locations.length > 1 && <DropdownMenuSeparator />}
                    </DropdownMenuGroup>
                  ))}
                  
                  {isOwnerOrManager && (
                    <>
                      <DropdownMenuSeparator className="bg-zinc-800 my-1" />
                      <DropdownMenuItem className="cursor-pointer" asChild>
                        <Link href="/dashboard/settings?tab=locations" className="flex items-center w-full text-emerald-400 py-1.5" onClick={onClose}>
                          <span className="mr-2">➕</span>
                          <span className="flex-1 font-bold">+ Add / Manage Locations</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 space-y-8">
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

          {/* Timeclock — staff clock in/out lives here in the sidebar */}
          {locationSlug && (
            <div className="mb-3">
              <TimeclockWidget
                locationId={locationSlug}
                isManager={isOwnerOrManager}
                fullWidth
              />
            </div>
          )}

          <Link 
            href="/dashboard/profile"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all w-full mb-1"
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
        </div>
    </>
  )

  return (
    <div className="h-dvh overflow-hidden bg-black flex selection:bg-emerald-500/30 print:bg-white print:h-auto print:overflow-visible">
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
          <div className="flex flex-col">
            <span className="text-white font-bold tracking-tight text-sm leading-tight">
              {activePageId 
                ? pages.find(p => p.id === activePageId)?.title || 'Page'
                : locations.find(l => l.id === activeLocationId)?.portal_display_name || locations.find(l => l.id === activeLocationId)?.name || 'OurMenu OS'}
            </span>
            {activePageId && (
              <span className="text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
                {locations.find(l => l.id === activeLocationId)?.portal_display_name || locations.find(l => l.id === activeLocationId)?.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {credits !== null && (
            <Link href="/dashboard/billing" className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-full border border-emerald-500/20 transition-colors shadow-sm">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-black text-emerald-400">{credits}</span>
            </Link>
          )}
          <NotificationCenter />
          <button onClick={() => setMobileMenuOpen(true)} className="text-zinc-400 hover:text-white ml-1">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-60 bg-black/80 backdrop-blur-sm print:hidden">
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
        {/* Desktop Top Bar — sits as a real header above page content, no overlap */}
        <header className="hidden md:flex shrink-0 items-center justify-between px-8 py-0 h-14 border-b border-white/5 bg-[#0a0a0a]/70 backdrop-blur-md sticky top-0 z-20 print:hidden">
          {/* Left: Page context hint — pages inject their own h1 below, so we keep this light */}
          <div className="flex items-center gap-2 min-w-0">
            {orgName && (
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest truncate">
                {orgName}
              </span>
            )}
          </div>
          {/* Right: global controls */}
          <div className="flex items-center gap-2.5">
            {isOwnerOrManager && (
              <Link
                href="/dashboard/kiosk"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
                title="Launch Kiosk Mode for Tablets & Staff Stations"
              >
                <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kiosk Mode</span>
              </Link>
            )}

            {locationSlug && (
              <a
                href={`/m/${locationSlug}?preview=true`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 text-xs font-bold rounded-xl transition-all shadow-sm group"
                title="Open Live Public Storefront"
              >
                <span>Live Storefront</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            )}

            {credits !== null && (
              <Link href="/dashboard/billing" className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-full border border-emerald-500/20 transition-colors shadow-sm cursor-pointer hover:scale-105 active:scale-95 duration-200">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-black text-emerald-400">{credits}</span>
              </Link>
            )}
            <NotificationCenter />
            {!orgName && (
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Setup Workspace</span>
            )}
          </div>
        </header>
        <div className="flex-1 p-4 md:px-8 md:py-7 max-w-[1600px] mx-auto w-full print:p-0">
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
