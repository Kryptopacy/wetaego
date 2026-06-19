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
  const userId = user.id

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
    role = 'owner'
  }

  const cookieStore = await cookies()
  const savedLocId = cookieStore.get('ourmenu_active_location_id')?.value

  let locationId = savedLocId
  if (!locationId) {
    const { data: loc } = await supabase.from('locations').select('id').eq('organization_id', org?.id).limit(1).single()
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
        <h1 className="text-2xl font-bold text-white mb-6">Menu Manager</h1>
        <div className="rounded-xl border border-yellow-800 bg-yellow-900/20 p-6">
          <p className="text-yellow-400">Please complete your Business Settings to create your first menu.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold text-white">Menu Manager</h1>
        <TranslateMenuButton orgId={org.id} categories={categories} />
      </div>

      <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Add Category</h2>
        <form action={createCategory as unknown as (payload: FormData) => void} className="flex gap-4 items-end">
          <input type="hidden" name="organization_id" value={org.id} />
          <input type="hidden" name="menu_id" value={menu.id} />
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-zinc-300">Category Name</label>
            <input type="text" name="name" required className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. Signature Cocktails" />
          </div>
          <button type="submit" className="px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors border border-zinc-700">Add Category</button>
        </form>
      </div>

      <CategoryTabs categories={categories} orgId={org.id} />
    </div>
  )
}
