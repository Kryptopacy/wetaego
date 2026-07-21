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
  const locationId = (await cookies()).get('ourmenu_active_location_id')?.value

  if (!locationId) {
    return <div className="p-8 text-zinc-100">Please select a location from the sidebar.</div>
  }

  const { data: locData } = await supabase
    .from('locations')
    .select('slug, name, theme_color, location_pages(*)')
    .eq('id', locationId)
    .single()
  
  const locationSlug = locData?.slug || ''

  const { data: resources } = await supabase
    .from('resources')
    .select('*')
    .eq('organization_id', orgId)
    .eq('location_id', locationId)
    .order('zone_name')
    .order('name')

  const { data: qrCodes } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  const { data: qrZones } = await supabase
    .from('qr_zones')
    .select('*')
    .eq('location_id', locationId)

  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_tier, logo_url')
    .eq('id', orgId)
    .single()

  const { getFreeQrLimit } = await import('@/lib/utils/billing')
  const planLimit = await getFreeQrLimit(org?.subscription_tier || 'lite')

  const { getCreditBalance } = await import('@/lib/payments/credits')
  const creditBalance = await getCreditBalance(orgId)

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ourmenuos.online'

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500">
            <MapPin className="w-8 h-8" />
          </div>
          Resources & QR Codes
        </h1>
        <p className="text-zinc-400">Map your physical footprint and generate dynamic QR codes to track incoming orders by zone.</p>
      </header>

      <ResourcesClient 
        initialResources={resources || []}
        organizationId={orgId}
        location={(locData as any) || undefined}
        locationId={locationId}
        slug={locationSlug}
        qrCodes={qrCodes || []}
        qrZones={qrZones || []}
        baseUrl={baseUrl}
        planLimit={planLimit}
        creditBalance={creditBalance}
        orgLogo={org?.logo_url || null}
      />
    </main>
  )
}
