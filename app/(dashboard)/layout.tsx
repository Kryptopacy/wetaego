import { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import ClientLayout, { InitialDashboardData, NavItem } from './client-layout'
import { cookies } from 'next/headers'
import {
  LayoutDashboard, ClipboardList, BarChart3, BookOpen,
  FileText, Settings, Users, QrCode, TrendingUp, MessageSquare
} from 'lucide-react'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const cookieStore = await cookies()

  let orgName = ''
  let isOwnerOrManager = true
  const userEmail = userData?.user?.email || ''
  let credits: number | null = null
  let locations: any[] = []
  let activeLocationId = ''
  let locationSlug = ''
  const baseNavItems: NavItem[] = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard as any, exact: true },
  ]
  const dynamicNavItems: NavItem[] = [...baseNavItems]

  if (userData?.user) {
    const { data: member } = await supabase
      .from('organization_members')
      .select('role, organizations(id, name, subscription_tier, purchased_credits, monthly_free_credits_used)')
      .eq('user_id', userData.user.id)
      .single()

    if (member && (member.organizations as any)?.name) {
      orgName = (member.organizations as any).name
      isOwnerOrManager = ['owner', 'manager'].includes(member.role)
      const orgData = member.organizations as any
      const planLimits: Record<string, number> = { lite: 10, pro: 50, enterprise: 200 }
      const availableFree = (planLimits[orgData.subscription_tier] || 0) - (orgData.monthly_free_credits_used || 0)
      const cb = Math.max(0, availableFree) + (orgData.purchased_credits || 0)
      if (!isNaN(cb)) credits = cb

      const orgId = orgData.id
      if (orgId) {
        const { data: locs } = await supabase
          .from('locations')
          .select('*')
          .eq('organization_id', orgId)

        if (locs && locs.length > 0) {
          locations = locs
          
          const savedId = cookieStore.get('ourmenu_active_location_id')?.value
          const activeLoc = locs.find((l: any) => l.id === savedId) || locs[0]
          
          activeLocationId = activeLoc.id
          locationSlug = activeLoc.slug

          // Fetch templates
          const { data: pages } = await supabase
            .from('location_pages')
            .select('template_type')
            .eq('location_id', activeLoc.id)
            .eq('is_published', true)

          const templates = new Set<string>()
          if (pages) {
            pages.forEach(p => templates.add(p.template_type))
          }

          if (templates.has('restaurant') || templates.has('catalog')) {
            dynamicNavItems.push({ href: '/dashboard/orders', label: 'Order Inbox', icon: ClipboardList as any, badge: 'LIVE' })
          }
          if (templates.has('booking')) {
            dynamicNavItems.push({ href: '/dashboard/bookings', label: 'Bookings (BMS)', icon: BookOpen as any })
          }
          if (templates.has('listing')) {
            dynamicNavItems.push({ href: '/dashboard/properties', label: 'Properties (PMS)', icon: FileText as any })
          }
          if (templates.has('rate_card') || templates.has('info') || templates.has('custom')) {
            dynamicNavItems.push({ href: '/dashboard/quotes', label: 'Quotes & Inquiries', icon: FileText as any })
          }
          
          dynamicNavItems.push({ href: '/dashboard/analytics', label: 'Deep Analytics', icon: TrendingUp as any })
          dynamicNavItems.push({ href: '/dashboard/forecast', label: 'Demand Forecast', icon: BarChart3 as any })
        }
      }
    }
  }

  const initialData: InitialDashboardData = {
    orgName,
    locations,
    activeLocationId,
    locationSlug,
    isOwnerOrManager,
    userEmail,
    credits,
    dynamicNavItems
  }

  return (
    <ClientLayout initialData={initialData}>
      {children}
    </ClientLayout>
  )
}
