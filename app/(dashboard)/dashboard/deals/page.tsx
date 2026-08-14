import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DealsManager from './deals-manager'
import { PageHeader } from '@/components/ui/page-header'

export const metadata = {
  title: 'Deals & Sales | OurMenu OS',
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>
}) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData?.user) redirect('/login')

  const resolvedSearchParams = await searchParams
  const locationId = resolvedSearchParams.location

  if (!locationId) {
    return (
      <div className="max-w-6xl space-y-6">
        <PageHeader
          title="Deals & Sales"
          description="Create active flash sales, bundle deals, and quantity discounts that float on your public menu."
        />
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
          <p className="text-zinc-400 text-sm">Please select a location from the sidebar location picker to manage deals.</p>
        </div>
      </div>
    )
  }

  // Fetch the organization id for this location to ensure auth
  const { data: locationData } = await supabase
    .from('locations')
    .select('organization_id')
    .eq('id', locationId)
    .single()

  if (!locationData) redirect('/dashboard')
  const orgId = locationData.organization_id

  const { data: deals } = await supabase
    .from('deals')
    .select(`
      *,
      deal_items (
        *,
        menu_items ( id, name, price_minor, image_url )
      )
    `)
    .eq('location_id', locationId)
    .order('created_at', { ascending: false })

  // menu_items are linked via category_id -> categories -> pages, 
  // but they DO have organization_id. Fetch all for this org.
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('id, name, price_minor')
    .eq('organization_id', orgId)
    .order('name', { ascending: true })

  return (
    <div className="max-w-6xl space-y-6">
      <PageHeader
        title="Deals & Sales"
        description="Create active deals that float on your public storefront. Configure quantity limits, bundles, or time windows."
      />

      <DealsManager 
        deals={deals || []} 
        menuItems={menuItems || []} 
        orgId={orgId} 
        locationId={locationId} 
      />
    </div>
  )
}
