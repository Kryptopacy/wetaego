import { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import ClientLayout, { InitialDashboardData, NavItem } from './client-layout'
import { cookies } from 'next/headers'
import { isAdminEmail } from '@/lib/utils/admin'
import { IntercomWidget } from '@/components/intercom/intercom-widget'
import { AICopilotWidget } from './dashboard/components/ai-copilot-widget'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const cookieStore = await cookies()

  let orgName = ''
  let orgId = ''
  let isOwnerOrManager = true
  const userEmail = userData?.user?.email || ''
  let credits: number | null = null
  let locations: Record<string, unknown>[] = []
  let activeLocationId = ''
  let locationSlug = ''
  let plan = 'lite'
  let planStatus = 'trial'
  let trialEndsAt: string | null = null
  let firstTemplate = 'catalog'
  const baseNavItems: NavItem[] = [
    { href: '/dashboard', label: 'Overview', icon: 'LayoutDashboard', exact: true },
  ]
  const dynamicNavItems: NavItem[] = [...baseNavItems]

  if (userData?.user) {
    const { data: member } = await supabase
      .from('organization_members')
      .select('role, organizations(id, name, subscription_tier, subscription_status, subscription_plan, trial_ends_at, purchased_credits, monthly_free_credits_used)')
      .eq('user_id', userData.user.id)
      .single()

    if (member && (member.organizations as Record<string, unknown>)?.name) {
      orgName = (member.organizations as Record<string, unknown>).name as string
      isOwnerOrManager = ['owner', 'manager'].includes(member.role)
      const orgData = member.organizations as { id: string; subscription_tier?: string; monthly_free_credits_used?: number; purchased_credits?: number; subscription_plan?: string; subscription_status?: string; trial_ends_at?: string; }
      const planLimits: Record<string, number> = { lite: 10, pro: 50, enterprise: 200 }
      const availableFree = (planLimits[orgData.subscription_tier || 'lite'] || 0) - (orgData.monthly_free_credits_used || 0)
      const cb = Math.max(0, availableFree) + (orgData.purchased_credits || 0)
      if (!isNaN(cb)) credits = cb

      plan = orgData.subscription_plan || orgData.subscription_tier || 'lite'
      planStatus = orgData.subscription_status || 'trial'
      trialEndsAt = orgData.trial_ends_at || null

      orgId = orgData.id
      if (orgId) {
        const { data: locs } = await supabase
          .from('locations')
          .select('*')
          .eq('organization_id', orgId)

        if (locs && locs.length > 0) {
          locations = locs
          
          const savedId = cookieStore.get('ourmenu_active_location_id')?.value
          const activeLoc = locs.find((l: Record<string, unknown>) => l.id === savedId) || locs[0]
          
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
            if (pages.length > 0) firstTemplate = pages[0].template_type
          }

          if (templates.has('restaurant') || templates.has('catalog')) {
            dynamicNavItems.push({ href: '/dashboard/orders', label: 'Order Inbox', icon: 'ClipboardList', badge: 'LIVE' })
          }
          if (templates.has('booking')) {
            dynamicNavItems.push({ href: '/dashboard/bookings', label: 'Bookings (BMS)', icon: 'BookOpen' })
          }
          if (templates.has('listing')) {
            dynamicNavItems.push({ href: '/dashboard/properties', label: 'Properties (PMS)', icon: 'FileText' })
          }
          if (templates.has('rate_card') || templates.has('info') || templates.has('custom')) {
            dynamicNavItems.push({ href: '/dashboard/quotes', label: 'Quotes & Inquiries', icon: 'FileText' })
          }
          
          dynamicNavItems.push({ href: '/dashboard/analytics', label: 'Deep Analytics', icon: 'TrendingUp' })
          dynamicNavItems.push({ href: '/dashboard/forecast', label: 'Demand Forecast', icon: 'BarChart3' })
        }
      }
    }
  }

  const isAdmin = isAdminEmail(userEmail)

  const initialData: InitialDashboardData = {
    orgName,
    locations,
    activeLocationId,
    locationSlug,
    isOwnerOrManager,
    userEmail,
    isAdmin,
    credits,
    dynamicNavItems,
    plan,
    planStatus,
    trialEndsAt,
    templateType: firstTemplate,
    hasOrg: !!orgId
  }

  return (
    <ClientLayout initialData={initialData}>
      {children}
      {userData?.user && orgId && (
        <>
          <IntercomWidget userId={userData.user.id} organizationId={orgId} />
          <AICopilotWidget organizationId={orgId} />
        </>
      )}
    </ClientLayout>
  )
}
