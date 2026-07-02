import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { InventoryClient } from './inventory-client'

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) redirect('/login')
  const userId = userData.user.id

  // Get org
  const { data: member } = await supabase
    .from('organization_members')
    .select('role, organizations(id, name)')
    .eq('user_id', userId)
    .single()

  let org: { id: string; name: string } | null = null
  let role = 'viewer'

  if (member?.organizations) {
    org = member.organizations as { id: string; name: string }
    role = member.role
  } else {
    const { data } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('created_by', userId)
      .single()
    org = data
    role = 'owner'
  }

  if (!org) redirect('/dashboard/settings')

  const isEditor = ['owner', 'manager', 'editor'].includes(role)

  // Get active location
  const savedLocId = cookieStore.get('ourmenu_active_location_id')?.value
  const { data: locs } = await supabase
    .from('locations')
    .select('id, name, currency_code')
    .eq('organization_id', org.id)

  const locations = locs ?? []
  const activeLoc =
    locations.find((l) => l.id === savedLocId) ?? locations[0]

  if (!activeLoc) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-6">Inventory Manager</h1>
        <div className="rounded-xl border border-yellow-800 bg-yellow-900/20 p-6">
          <p className="text-yellow-400">Please complete your Business Settings to create a location first.</p>
        </div>
      </div>
    )
  }

  // Load inventory items
  const { data: items } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('organization_id', org.id)
    .eq('location_id', activeLoc.id)
    .eq('is_archived', false)
    .order('category')
    .order('name')

  // Load recent movements (last 50)
  const { data: movements } = await supabase
    .from('inventory_movements')
    .select('*')
    .eq('organization_id', org.id)
    .eq('location_id', activeLoc.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-6xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory Manager</h1>
          <p className="text-zinc-500 text-sm mt-1">Track physical stock levels across your {activeLoc.name} location</p>
        </div>
      </div>
      <InventoryClient
        organizationId={org.id}
        locationId={activeLoc.id}
        locationName={activeLoc.name}
        currencyCode={activeLoc.currency_code ?? 'NGN'}
        initialItems={items ?? []}
        initialMovements={movements ?? []}
        isEditor={isEditor}
      />
    </div>
  )
}
