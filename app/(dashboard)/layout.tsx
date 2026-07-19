import { ReactNode } from 'react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
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
  let locations: { id: string; name: string; slug?: string; portal_display_name?: string | null }[] = []
  let activeLocationId = ''
  let locationSlug = ''
  let pagesList: { id: string, title: string, template_type: string, is_published: boolean }[] = []
  let activePageId = cookieStore.get('ourmenu_active_page_id')?.value || ''
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
      .select('role, page_id, organizations(id, name, subscription_tier, subscription_status, subscription_plan, trial_ends_at, purchased_credits, monthly_free_credits_used)')
      .eq('user_id', userData.user.id)
      .limit(1)
      .maybeSingle()

    if (member && member.organizations) {
      // Supabase infers joined single relations as either an object or an array.
      // We safely cast it to the expected structure.
      const orgData = Array.isArray(member.organizations) ? member.organizations[0] : member.organizations
      
      if (orgData && orgData.name) {
        orgName = orgData.name
        isOwnerOrManager = ['owner', 'manager'].includes(member.role)
        
        const planLimits: Record<string, number> = { lite: 10, pro: 50, enterprise: 200 }
        const availableFree = (planLimits[orgData.subscription_tier || 'lite'] || 0) - (orgData.monthly_free_credits_used || 0)
        const cb = Math.max(0, availableFree) + (orgData.purchased_credits || 0)
        if (!isNaN(cb)) credits = cb

        plan = orgData.subscription_plan || orgData.subscription_tier || 'lite'
        planStatus = orgData.subscription_status || 'trialing'
        trialEndsAt = orgData.trial_ends_at || null

        orgId = orgData.id
      }
    }

    if (orgId) {
        const { data: locs } = await supabase
          .from('locations')
          .select('id, name, slug, portal_display_name')
          .eq('organization_id', orgId)

        if (locs && locs.length > 0) {
          locations = locs
          
          const savedId = cookieStore.get('ourmenu_active_location_id')?.value
          const isGlobalView = savedId === 'global' && locs.length > 1
          let activeLoc = locs.find((l: Record<string, unknown>) => l.id === savedId) || locs[0]
          
          // Fetch templates — use adminClient to bypass RLS so the sidebar dropdown
          // is always populated regardless of policy configuration.
          const adminClient = await createAdminClient()
          
          let pagesQuery = adminClient
            .from('location_pages')
            .select('id, title, template_type, is_published, location_id')
            
          if (member?.page_id) {
            pagesQuery = pagesQuery.eq('id', member.page_id)
          } else if (isGlobalView) {
            pagesQuery = pagesQuery.in('location_id', locs.map((l: { id: string }) => l.id))
          } else {
            pagesQuery = pagesQuery.eq('location_id', activeLoc.id)
          }
            
          const { data: pages, error: pagesErr } = await pagesQuery
            .order('is_primary', { ascending: false })
            .order('created_at', { ascending: false })
            
          if (pagesErr) console.error('[layout] location_pages fetch error:', pagesErr)

          if (member?.page_id && pages && pages.length > 0) {
            // RBAC: Lock location to the one owning this page
            activeLoc = locs.find((l: { id: string }) => l.id === pages[0].location_id) || activeLoc
            locations = [activeLoc] // UI restriction: only show this location
            activePageId = member.page_id // UI restriction: force active page
          }

          if (isGlobalView && !member?.page_id) {
            activeLocationId = 'global'
            locationSlug = 'global'
          } else {
            activeLocationId = activeLoc.id
            locationSlug = activeLoc.slug
          }

          const templates = new Set<string>()
          if (pages) {
            pagesList = pages
            if (activePageId) {
              const activePage = pages.find(p => p.id === activePageId)
              if (activePage) templates.add(activePage.template_type)
            } else {
              pages.filter(p => p.is_published).forEach(p => templates.add(p.template_type))
            }
            if (pages.length > 0) firstTemplate = pages[0].template_type
          }

          if (templates.has('restaurant') || templates.has('catalog')) {
            dynamicNavItems.push({ href: '/dashboard/orders', label: 'Order Inbox', icon: 'ClipboardList', badge: 'LIVE' })
            dynamicNavItems.push({ href: '/dashboard/pos', label: 'Point of Sale', icon: 'MonitorSmartphone' })
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

          // Add Developer/Integration settings
          dynamicNavItems.push({ href: '/dashboard/webhooks', label: 'Webhooks', icon: 'Zap' })
          dynamicNavItems.push({ href: '/dashboard/api', label: 'API Keys', icon: 'QrCode' })
        }
    }
  }

  const isAdmin = isAdminEmail(userEmail)

  const initialData: InitialDashboardData = {
    orgName,
    locations,
    activeLocationId,
    locationSlug,
    pages: pagesList,
    activePageId,
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
