import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { POSClient } from './pos-client'

export const dynamic = 'force-dynamic'

export default async function POSPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const activeLocationId = cookieStore.get('ourmenu_active_location_id')?.value
  const activePageId = cookieStore.get('ourmenu_active_page_id')?.value

  if (!activeLocationId) {
    return <div className="p-8 text-white">Please select a location from the sidebar.</div>
  }

  // Check auth & role
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) redirect('/login')

  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', userData.user.id)
    .single()

  if (!member) return <div className="p-8 text-white">Access denied.</div>

  // Fetch the pages for this location
  let pagesQuery = supabase
    .from('location_pages')
    .select('*')
    .in('template_type', ['restaurant', 'catalog'])
    .eq('is_published', true)
    
  if (activeLocationId && activeLocationId !== 'global') {
    pagesQuery = pagesQuery.eq('location_id', activeLocationId)
  }
    
  if (activePageId) {
    pagesQuery = pagesQuery.eq('id', activePageId)
  }

  const { data: pages } = await pagesQuery

  if (!pages || pages.length === 0) {
    return <div className="p-8 text-white">No active menus or catalogs found for this location.</div>
  }

  const pageIds = pages.map(p => p.id)

  // Fetch all items for these pages
  const { data: rawItems } = await supabase
    .from('page_items')
    .select('*')
    .in('page_id', pageIds)
    .order('created_at', { ascending: false })

  const items = rawItems || []

  // Fetch location details for currency
  let locQuery = supabase.from('locations').select('id, currency_code, organization_id')
  if (activeLocationId && activeLocationId !== 'global') {
    locQuery = locQuery.eq('id', activeLocationId)
  }
  const { data: loc } = await locQuery.limit(1).maybeSingle()
  const resolvedLocationId = activeLocationId === 'global' ? (loc?.id || '') : activeLocationId

  return (
    <div className="flex h-[calc(100vh-(--spacing(16)))] w-full flex-col p-4 md:p-6 overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Point of Sale</h1>
          <p className="text-zinc-400 text-sm">Walk-in orders & cash register</p>
        </div>
      </div>
      
      <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden relative shadow-2xl">
        <POSClient 
          items={items as Parameters<typeof POSClient>[0]['items']} 
          pages={pages} 
          currency={loc?.currency_code || 'NGN'} 
          locationId={resolvedLocationId}
          organizationId={loc?.organization_id as string}
          staffId={userData.user.id}
        />
      </div>
    </div>
  )
}
