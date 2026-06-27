import { Database } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createCategory } from './actions'
import { CategoryTabs } from './category-tabs'
import { TranslateMenuButton } from './translate-menu-button'
import { cookies } from 'next/headers'

export default async function MenuManagerPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) {
    // We handle the redirect below
  }

  if (!user) {
    redirect('/login')
  }
  const userId = user!.id

  let org: { id: string } | null = null
  let role = 'viewer'
  let menu: { id: string } | null = null
  let categories: (Database['public']['Tables']['menu_categories']['Row'] & { menu_items?: Database['public']['Tables']['menu_items']['Row'][] })[] = []

  const { data: member } = await supabase
    .from('organization_members')
    .select('role, organizations(id)')
    .eq('user_id', userId)
    .single()

  if (member && member.organizations) {
    org = member.organizations
    role = member.role
  } else {
    const { data } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', userId)
      .single()
    org = data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
    role = 'owner'
  }

  const cookieStore = await cookies()
  const savedLocId = cookieStore.get('ourmenu_active_location_id')?.value

  let locationId = savedLocId
  if (!locationId) {
    const { data: loc } = await supabase.from('locations').select('id').eq('organization_id', org?.id || '').limit(1).single()
    locationId = loc?.id
  }
  const activeLocationId = locationId || ''

  let menuQuery = supabase
    .from('menus')
    .select('id')
    .eq('organization_id', org?.id || '')
    
  if (activeLocationId) {
    menuQuery = menuQuery.eq('location_id', activeLocationId)
  }

  const { data: menuData } = await menuQuery.single()
  
  menu = menuData

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
        <div className="rounded-xl border border-yellow-800 bg-yellow-900/20 p-6">
          <p className="text-yellow-400">Please complete your Business Settings to create your first menu.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold text-white">Primary Catalog</h1>
        <TranslateMenuButton orgId={org.id} categories={categories} />
      </div>

      <CategoryTabs categories={categories} orgId={org.id} menuId={menu.id} />
    </div>
  )
}
