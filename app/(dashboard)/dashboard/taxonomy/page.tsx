import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { TaxonomyEditor } from './taxonomy-editor'
import { PageHeader } from '@/components/ui/page-header'

export default async function TaxonomyManagerPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    redirect('/login')
  }

  const cookieStore = await cookies()
  const savedLocId = cookieStore.get('ourmenu_active_location_id')?.value

  // Verify the savedLocId belongs to the org
  const { data: member } = await supabase
    .from('organization_members')
    .select('organizations(id)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
    
  let orgId = ''
  if (member && member.organizations) {
    const org = Array.isArray(member.organizations) ? member.organizations[0] : member.organizations
    orgId = org?.id || ''
  } else {
    const { data } = await supabase.from('organizations').select('id').eq('created_by', user.id).limit(1).maybeSingle()
    orgId = data?.id || ''
  }

  if (!orgId) redirect('/dashboard')

  const { data: orgLocs } = await supabase.from('locations').select('id, name').eq('organization_id', orgId)
  
  let locationId = savedLocId
  if (!orgLocs?.find(l => l.id === savedLocId) && savedLocId !== 'global') {
    locationId = orgLocs?.[0]?.id || ''
  }
  const activeLocationId = (savedLocId === 'global' ? orgLocs?.[0]?.id : locationId) || orgLocs?.[0]?.id || ''

  if (!activeLocationId) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-6">Taxonomy Manager</h1>
        <div className="rounded-xl border border-yellow-800 bg-yellow-900/20 p-6">
          <p className="text-yellow-400">Please complete your Business Settings to create a location first.</p>
        </div>
      </div>
    )
  }

  // Fetch location pages
  const { data: pagesData } = await supabase
    .from('location_pages')
    .select('id, title, template_type, is_published')
    .eq('location_id', activeLocationId)
    .order('is_primary', { ascending: false })

  const pages = pagesData || []

  if (pages.length === 0) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-6">Taxonomy Manager</h1>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-6">
          <p className="text-zinc-400">No pages found for this location. Create a page first to manage its taxonomy.</p>
        </div>
      </div>
    )
  }

  // Pre-fetch collections and items for the first page
  const defaultPage = pages[0]
  
  const { data: collections } = await supabase
    .from('page_collections')
    .select('*')
    .eq('page_id', defaultPage.id)
    .order('sort_order', { ascending: true })

  const { data: items } = await supabase
    .from('page_items')
    .select(`
      *,
      page_item_collections(collection_id)
    `)
    .eq('page_id', defaultPage.id)

  return (
    <div className="max-w-6xl space-y-6 pb-20">
      <PageHeader
        title="Taxonomy & Collections"
        description="Organize your offerings into nested categories, collections, and custom modifier groups."
      />

      <TaxonomyEditor 
        orgId={orgId} 
        pages={pages} 
        initialCollections={collections || []}
        initialItems={items || []}
        activeLocationId={activeLocationId}
      />
    </div>
  )
}
