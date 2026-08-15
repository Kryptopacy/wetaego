import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DeliveryClient } from './delivery-client'
import { PageHeader } from '@/components/ui/page-header'

export default async function DeliveryPage() {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    redirect('/login')
  }

  // Determine user's active org and location
  const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1).single()
  const orgId = member?.organization_id || (await supabase.from('organizations').select('id').eq('created_by', user.id).limit(1).maybeSingle())?.data?.id
  
  if (!orgId) return <div className="p-8 text-white">No organization found.</div>

  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  let locationId = cookieStore.get('ourmenu_active_location_id')?.value || cookieStore.get('active_location_id')?.value

  if (!locationId || locationId === 'global') {
    const { data: firstLoc } = await supabase
      .from('locations')
      .select('id')
      .eq('organization_id', orgId)
      .limit(1)
      .maybeSingle()
    locationId = firstLoc?.id
  }

  if (!locationId) {
    return <div className="p-8 text-white">Please create a location in Settings.</div>
  }

  // Fetch active orders
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('organization_id', orgId)
    .eq('location_id', locationId)
    .in('status', ['paid', 'preparing', 'out_for_delivery', 'completed'])
    .order('created_at', { ascending: false })
    .limit(100)

  // Get currency and page delivery settings for this location
  const { data: location } = await supabase.from('locations').select('currency_code').eq('id', locationId).single()
  const { data: pageData } = await supabase
    .from('location_pages')
    .select('id, delivery_enabled, delivery_fee_minor, delivery_minimum_order_minor, delivery_note')
    .eq('location_id', locationId)
    .limit(1)
    .maybeSingle()

  return (
    <div className="max-w-7xl h-[calc(100vh-8rem)] flex flex-col space-y-6 pb-6">
      <PageHeader
        title="Delivery & Fulfillment"
        description="Kanban pipeline for managing delivery drivers, order packaging, and pickups."
      />

      <DeliveryClient 
        initialOrders={orders || []} 
        organizationId={orgId} 
        locationId={locationId} 
        currencyCode={location?.currency_code || 'NGN'}
        pageId={pageData?.id}
        initialDeliverySettings={{
          delivery_enabled: pageData?.delivery_enabled ?? false,
          delivery_fee_minor: pageData?.delivery_fee_minor ?? 0,
          delivery_minimum_order_minor: pageData?.delivery_minimum_order_minor ?? 0,
          delivery_note: pageData?.delivery_note ?? '',
        }}
      />
    </div>
  )
}
