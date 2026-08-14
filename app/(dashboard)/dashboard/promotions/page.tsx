import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PromoCodesManager, { PromoCode } from './promo-codes-manager'
import { PageHeader } from '@/components/ui/page-header'

export const metadata = {
  title: 'Promo Codes | OurMenu OS',
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
      <div className="max-w-6xl space-y-6">
        <PageHeader
          title="Promo Codes"
          description="Create cart-level coupon codes (like SUMMER20 or WELCOME5) that guests can apply at checkout."
        />
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
          <p className="text-zinc-400 text-sm">Please select a location from the sidebar location picker to manage promo codes.</p>
        </div>
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
    <div className="max-w-6xl space-y-6">
      <PageHeader
        title="Promo Codes"
        description="Create cart-level discount codes (like SUMMER20 or WELCOME5) that guests can apply at checkout."
      />

      <PromoCodesManager 
        promoCodes={(promoCodes || []) as PromoCode[]} 
        orgId={orgId} 
        locationId={locationId} 
      />
    </div>
  )
}
