import { Database } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/server'
import { OrdersClient } from './orders-client'
import { mapSupabaseOrderToUI } from '@/lib/utils/transformers'
import { UIOrder } from '@/lib/types/frontend'
import { cookies } from 'next/headers'
import { getTranslations } from 'next-intl/server'

export default async function OrdersPage() {
  const supabase = await createClient()
  const t = await getTranslations('Dashboard')

  // For MVP, we just show a placeholder that lists any orders we can find.
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id

  let org: { id: string } | null = null
  let orders: UIOrder[] = []
  let serviceRequests: Database['public']['Tables']['service_requests']['Row'][] = []
  let menuItems: Database['public']['Tables']['menu_items']['Row'][] = []
  let activeLocationId = ''
  let billingMode = 'standard_checkout'
  let templateType = 'catalog'

  if (userId) {
    // Check if user is a member of an organization
    const { data: memberData } = await supabase.from('organization_members').select('organization_id, page_id').eq('user_id', userId).limit(1).single()
    
    if (memberData) {
      org = { id: memberData.organization_id }
    } else {
      // Fallback: check if they created one (though they should be a member)
      const { data: orgData } = await supabase.from('organizations').select('id').eq('created_by', userId).single()
      org = orgData
    }

    if (org) {
      // Get active location
      const cookieStore = await cookies()
      const savedLocId = cookieStore.get('ourmenu_active_location_id')?.value

      let locationId = savedLocId
      if (!locationId) {
        const { data: loc } = await supabase.from('locations').select('id').eq('organization_id', org.id).limit(1).single()
        locationId = loc?.id
      }
      activeLocationId = locationId || ''
      let activePageId = cookieStore.get('ourmenu_active_page_id')?.value || ''
      
      // RBAC: Force active page if restricted
      if (memberData?.page_id) {
        activePageId = memberData.page_id
      }

      if (activeLocationId || activePageId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let ordersQuery: any = supabase
          .from('orders')
          .select('*, order_items(*), order_milestones(*), order_payments(*)')
          .eq('organization_id', org.id)
          .order('created_at', { ascending: false })
          .limit(50)
          
        if (activeLocationId && !memberData?.page_id) {
          ordersQuery = ordersQuery.eq('location_id', activeLocationId)
        }
        
        if (activePageId) ordersQuery = ordersQuery.eq('page_id', activePageId)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let pageQuery: any = supabase
          .from('location_pages')
          .select('billing_mode, template_type')
          .eq('is_published', true)
          
        if (activeLocationId && !memberData?.page_id) {
          pageQuery = pageQuery.eq('location_id', activeLocationId)
        }
          
        if (activePageId) pageQuery = pageQuery.eq('id', activePageId)
        pageQuery = pageQuery.limit(1).single()

        // Run independent queries concurrently
        const [
          ordersResult,
          requestsResult,
          pageResult,
          itemsResult
        ] = await Promise.all([
          ordersQuery,
          supabase
            .from('service_requests')
            .select('*')
            .eq('organization_id', org.id)
            .eq('location_id', activeLocationId)
            .order('created_at', { ascending: true }),
          pageQuery,
          supabase
            .from('menu_items')
            .select('*')
            .eq('organization_id', org.id)
            .order('name')
        ])

        orders = (ordersResult.data || []).map(mapSupabaseOrderToUI)
        serviceRequests = requestsResult.data || []
        billingMode = pageResult.data?.billing_mode || 'standard_checkout'
        templateType = pageResult.data?.template_type || 'catalog'
        menuItems = itemsResult.data || []
      }
    }
  }

  return (
    <div className="max-w-6xl h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <h1 className="text-2xl font-bold text-white">{t('liveOperations')}</h1>
        <div className="flex gap-2">
          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm font-medium border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {t('receivingOrders')}
          </span>
        </div>
      </div>

      {org && activeLocationId ? (
        <OrdersClient 
          organizationId={org.id}
          locationId={activeLocationId}
          initialOrders={orders} 
          initialServiceRequests={serviceRequests} 
          initialMenuItems={menuItems}
          currentUserId={userId!}
          billingMode={billingMode}
          templateType={templateType}
        />
      ) : (
        <p className="text-zinc-500">Please create an organization and location first.</p>
      )}
    </div>
  )
}
