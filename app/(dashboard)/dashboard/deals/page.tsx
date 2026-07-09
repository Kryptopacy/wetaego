import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DealsManager from './deals-manager'

export const metadata = {
  title: 'Deals & Sales - OurMenu OS',
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
      <div className="p-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Deals & Sales</h1>
        <p className="text-zinc-500 mt-2">Please select a location from the sidebar location picker to manage deals.</p>
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
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Deals & Sales</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Create active deals that float on your public menu. Configure quantity limits or time windows.
          </p>
        </div>
      </div>

      <DealsManager 
        deals={deals || []} 
        menuItems={menuItems || []} 
        orgId={orgId} 
        locationId={locationId} 
      />
    </div>
  )
}
