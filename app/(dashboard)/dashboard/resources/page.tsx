import { createClient } from '@/lib/supabase/server'

import { MapPin } from 'lucide-react'
import { ResourcesClient } from './resources-client'

export default async function ResourcesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1).single()
  const orgData = await supabase.from('organizations').select('id').eq('created_by', user.id).single()
  const orgId = member?.organization_id || orgData?.data?.id
  
  if (!orgId) return <div className="p-8 text-zinc-100">No organization found.</div>

  const { cookies } = await import('next/headers')
  const locationId = (await cookies()).get('active_location_id')?.value

  if (!locationId) {
    return <div className="p-8 text-zinc-100">Please select a location from the sidebar.</div>
  }

  const { data: locData } = await supabase.from('locations').select('slug').eq('id', locationId).single()
  const locationSlug = locData?.slug || ''

  const { data: resources } = await supabase
    .from('resources')
    .select('*')
    .eq('organization_id', orgId)
    .eq('location_id', locationId)
    .order('zone_name')
    .order('name')

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500">
            <MapPin className="w-8 h-8" />
          </div>
          Visual Resource Manager
        </h1>
        <p className="text-zinc-400">Map your physical footprint and generate dynamic QR codes to track incoming orders by zone.</p>
      </header>

      <ResourcesClient 
        initialResources={resources || []}
        organizationId={orgId}
        locationId={locationId}
        slug={locationSlug}
      />
    </main>
  )
}
