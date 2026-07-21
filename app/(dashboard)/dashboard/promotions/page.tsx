import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PromoCodesManager from './promo-codes-manager'

export const metadata = {
  title: 'Promo Codes - OurMenu OS',
}

export default async function PromotionsPage({
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
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Promo Codes</h1>
        <p className="text-zinc-500 mt-2">Please select a location from the sidebar location picker to manage promo codes.</p>
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

  const { data: promoCodes } = await supabase
    .from('location_promo_codes')
    .select('*')
    .eq('location_id', locationId)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Promo Codes</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Create cart-level discount codes (like SUMMER20 or WELCOME5) that guests can apply at checkout.
          </p>
        </div>
      </div>

      <PromoCodesManager 
        promoCodes={(promoCodes || []) as any[]} 
        orgId={orgId} 
        locationId={locationId} 
      />
    </div>
  )
}
