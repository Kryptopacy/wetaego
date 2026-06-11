import { createClient } from '@/lib/supabase/server'
import { OrdersClient } from './orders-client'

export default async function OrdersPage() {
  const supabase = await createClient()

  // For MVP, we just show a placeholder that lists any orders we can find.
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id

  let org = null
  let orders: any[] = []
  let serviceRequests: any[] = []

  if (userId) {
    const { data: orgData } = await supabase.from('organizations').select('id').eq('created_by', userId).single()
    org = orgData

    if (org) {
      // Fetch Orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false })
      
      orders = ordersData || []

      // Fetch Service Requests
      const { data: requestsData } = await supabase
        .from('service_requests')
        .select('*')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: true })
      
      serviceRequests = requestsData || []
    }
  }

  return (
    <div className="max-w-6xl h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-8 flex-shrink-0">
        <h1 className="text-2xl font-bold text-white">Live Operations</h1>
        <div className="flex gap-2">
          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm font-medium border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Receiving Orders
          </span>
        </div>
      </div>

      {org ? (
        <OrdersClient 
          organizationId={org.id} 
          initialOrders={orders} 
          initialServiceRequests={serviceRequests} 
        />
      ) : (
        <p className="text-zinc-500">Please create an organization first.</p>
      )}
    </div>
  )
}
