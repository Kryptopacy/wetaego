import { Database } from '@/lib/supabase/types'
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

  // Find the menu for the active location, or fall back to any menu in the org
  let menuQuery = supabase
    .from('menus')
    .select('id')
    .eq('organization_id', org?.id || '')
    
  if (activeLocationId) {
    menuQuery = menuQuery.eq('location_id', activeLocationId)
  }

  const { data: menuData } = await menuQuery.maybeSingle()
  
  let menu: { id: string } | null = menuData
  if (!menu && org?.id && activeLocationId) {
    // If no menu exists specifically for this active location, auto-create one so each location has its own catalogue
    const adminClient = await createAdminClient()
    const { data: newMenu } = await adminClient
      .from('menus')
      .insert({
        organization_id: org.id,
        location_id: activeLocationId,
        name: 'Main Menu',
      })
      .select('id')
      .single()
    if (newMenu) {
      menu = newMenu
    }
  }

  if (!menu || !org) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-6">Menu Manager</h1>
        <div className="rounded-xl border border-yellow-800 bg-yellow-900/20 p-6">
          <p className="text-yellow-400">Please complete your Business Settings to create a location and menu first.</p>
        </div>
      </div>
    )
  }

  // Load categories and items
  const { data: categoriesData } = await supabase
    .from('menu_categories')
    .select(`
      *,
      menu_items (*)
    `)
    .eq('menu_id', menu.id)
    .order('sort_order', { ascending: true })

  const categories = categoriesData ?? []

  if (categories.length === 0) {
    return (
      <div className="max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <h1 className="text-2xl font-bold text-white">Catalog Setup</h1>
          <AutoImportButton orgId={org.id} menuId={menu.id} />
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-white mb-2">Your menu is empty</h3>
            <p className="text-zinc-400 text-sm mb-6">
              Get started by importing our pre-built preset menu for your business type, or create your first category manually below.
            </p>
            <CategoryTabs key={`${menu.id}-${activeLocationId}`} categories={categories} orgId={org.id} menuId={menu.id} />
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
          <AutoImportButton orgId={org.id} menuId={menu.id} />
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

      <CategoryTabs key={`${menu.id}-${activeLocationId}`} categories={categories} orgId={org.id} menuId={menu.id} />
    </div>
  )
}
