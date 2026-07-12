import { Database } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { CategoryTabs } from './category-tabs'
import { TranslateMenuButton } from './translate-menu-button'
import { AutoImportButton } from './auto-import-button'
import { cookies } from 'next/headers'

export default async function MenuManagerPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    redirect('/login')
  }
  const userId = user!.id

  let org: { id: string } | null = null

  let categories: (Database['public']['Tables']['menu_categories']['Row'] & { menu_items?: Database['public']['Tables']['menu_items']['Row'][] })[] = []

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
  const { data: orgLocs } = await supabase.from('locations').select('id').eq('organization_id', org?.id || '')
  
  let locationId = savedLocId
  if (!orgLocs?.find(l => l.id === savedLocId)) {
    locationId = orgLocs?.[0]?.id || ''
  }
  const activeLocationId = locationId || ''

  // Find the menu for the active location, or fall back to any menu in the org
  let menuQuery = supabase
    .from('menus')
    .select('id')
    .eq('organization_id', org?.id || '')
    
  if (activeLocationId) {
    menuQuery = menuQuery.eq('location_id', activeLocationId)
  }

  const { data: menuData } = await menuQuery.maybeSingle()
  
  // If no menu for active location, try any menu in the org
  let menu: { id: string } | null = menuData
  if (!menu && org?.id) {
    const { data: fallbackMenu } = await supabase
      .from('menus')
      .select('id')
      .eq('organization_id', org.id)
      .limit(1)
      .maybeSingle()
    menu = fallbackMenu
  }

  if (menu) {
    const { data: catData } = await supabase
      .from('menu_categories')
      .select('*, menu_items(*)')
      .eq('menu_id', menu.id)
      .order('sort_order')
    
    categories = catData || []
  }

  if (!org || !menu) {
    return (
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-white mb-6">Primary Catalog</h1>
        <div className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold mb-1">No catalog set up yet</p>
            <p className="text-zinc-400 text-sm">
              Your primary catalog (for items, services, or products you sell) hasn&apos;t been created yet.
              Complete your <a href="/dashboard/settings" className="text-emerald-400 hover:underline">Business Settings</a> to get started.
            </p>
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

      <CategoryTabs categories={categories} orgId={org.id} menuId={menu.id} />
    </div>
  )
}
