import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

import { CategoryTabs } from './category-tabs'
import { TranslateMenuButton } from './translate-menu-button'
import { AutoImportButton } from './auto-import-button'

export default async function MenuManagerPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    redirect('/login')
  }
  const userId = user!.id

  let org: { id: string } | null = null

  const { data: member } = await supabase
    .from('organization_members')
    .select('role, organizations(id)')
    .eq('user_id', userId)
    .single()

  if (member && member.organizations) {
    org = member.organizations as { id: string }
  } else {
    const { data } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', userId)
      .single()
    org = data
  }

  const cookieStore = await cookies()
  const savedLocId = cookieStore.get('ourmenu_active_location_id')?.value

  // Verify the savedLocId belongs to the org
  const { data: orgLocs } = await supabase.from('locations').select('id, name').eq('organization_id', org?.id || '')
  
  let locationId = savedLocId
  if (!orgLocs?.find(l => l.id === savedLocId) && savedLocId !== 'global') {
    locationId = orgLocs?.[0]?.id || ''
  }
  const activeLocationId = (savedLocId === 'global' ? orgLocs?.[0]?.id : locationId) || orgLocs?.[0]?.id || ''

  // Find the primary page for the active location
  const { data: pagesData } = await supabase
    .from('location_pages')
    .select('id, title, template_type')
    .eq('location_id', activeLocationId)
    .order('is_primary', { ascending: false })

  let page = pagesData?.[0]
  
  if (!page && org?.id && activeLocationId) {
    // If no page exists, auto-create a primary catalog page
    const adminClient = await createAdminClient()
    const { data: newPage } = await adminClient
      .from('location_pages')
      .insert({
        location_id: activeLocationId,
        title: 'Main Catalog',
        slug: 'main-catalog',
        is_primary: true,
        template_type: 'catalog'
      })
      .select('id, title, template_type')
      .single()
    if (newPage) {
      page = newPage
    }
  }

  if (!page || !org) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-6">Catalog Manager</h1>
        <div className="rounded-xl border border-yellow-800 bg-yellow-900/20 p-6">
          <p className="text-yellow-400">Please complete your Business Settings to create a location and page first.</p>
        </div>
      </div>
    )
  }

  // Load collections (formerly categories) and their items
  const { data: collectionsData } = await supabase
    .from('page_collections')
    .select('*')
    .eq('page_id', page.id)
    .order('sort_order', { ascending: true })

  const collections = collectionsData ?? []

  // Load items
  const { data: itemsData } = await supabase
    .from('page_items')
    .select(`
      *,
      page_item_collections (
        collection_id
      )
    `)
    .eq('page_id', page.id)
    .order('sort_order', { ascending: true })

  const items = itemsData ?? []

  // Reconstruct the nested shape expected by CategoryTabs
  const categories = collections.map(col => {
    return {
      ...col,
      menu_items: items.filter(item => 
        item.page_item_collections.some((link: any) => link.collection_id === col.id)
      ).map(item => ({
        ...item,
        // Map page_items fields back to what the UI expects for now, or just pass as is if we update UI
        price: item.price_minor ? item.price_minor / 100 : 0
      }))
    }
  })

  // Add an "Uncategorized" bucket for items with no collection
  const uncategorizedItems = items.filter((item: any) => !item.page_item_collections || item.page_item_collections.length === 0)
  if (uncategorizedItems.length > 0) {
    categories.push({
      id: 'uncategorized',
      page_id: page.id,
      name: 'Uncategorized',
      slug: 'uncategorized',
      parent_id: null,
      sort_order: 9999,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      menu_items: uncategorizedItems.map(item => ({
        ...item,
        price: item.price_minor ? item.price_minor / 100 : 0
      }))
    })
  }

  if (categories.length === 0) {
    return (
      <div className="max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <h1 className="text-2xl font-bold text-white">Catalog Setup</h1>
          <AutoImportButton orgId={org.id} menuId={page.id} />
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-white mb-2">Your catalog is empty</h3>
            <p className="text-zinc-400 text-sm mb-6">
              Get started by importing our pre-built preset menu for your business type, or create your first category manually below.
            </p>
            <CategoryTabs key={`${page.id}-${activeLocationId}`} categories={categories} orgId={org.id} menuId={page.id} allCollections={collections} pageId={page.id} templateType={page?.template_type} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold text-white">Primary Catalog</h1>
        <div className="flex items-center gap-3">
          <AutoImportButton orgId={org.id} menuId={page.id} />
          <TranslateMenuButton orgId={org.id} categories={categories} />
        </div>
      </div>

      {savedLocId === 'global' && orgLocs && orgLocs.length > 1 && (
        <div className="mb-6 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-blue-300 text-sm">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🌐</span>
            <span>You are currently in <strong>All Businesses (Global View)</strong>. Showing catalogue for primary branch: <strong>{orgLocs.find(l => l.id === activeLocationId)?.name || 'Main Branch'}</strong>.</span>
          </div>
          <span className="text-xs opacity-75 shrink-0">Switch business from the top dropdown to edit another branch.</span>
        </div>
      )}

      <CategoryTabs key={`${page.id}-${activeLocationId}`} categories={categories} orgId={org.id} menuId={page.id} allCollections={collections} pageId={page.id} templateType={page?.template_type} />
    </div>
  )
}
