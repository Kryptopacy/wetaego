import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Truck } from 'lucide-react'
import { DeliveryClient } from './delivery-client'

import { Database } from '@/lib/supabase/types'

type Order = Database['public']['Tables']['orders']['Row']

export default async function DeliveryPage() {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    redirect('/login')
  }

  // Determine user's active org and location
  const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1).single()
  const orgId = member?.organization_id || (await supabase.from('organizations').select('id').eq('created_by', user.id).single())?.data?.id
  
  if (!orgId) return <div className="p-8 text-white">No organization found.</div>

  const { cookies } = await import('next/headers')
  const locationId = (await cookies()).get('active_location_id')?.value

  if (!locationId) {
    return <div className="p-8 text-white">Please select a location from the sidebar.</div>
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

  // Get currency for this location
  const { data: location } = await supabase.from('locations').select('currency_code').eq('id', locationId).single()

  return (
    <div className="max-w-7xl h-[calc(100vh-80px)] flex flex-col space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Truck className="w-6 h-6 text-indigo-400" />
          Fulfillment Board
        </h1>
        <p className="text-zinc-400 mt-1">Manage incoming orders and fulfillments.</p>
      </div>

      <DeliveryClient 
        initialOrders={orders || []} 
        organizationId={orgId} 
        locationId={locationId} 
        currencyCode={location?.currency_code || 'NGN'}
      />
    </div>
  )
}
