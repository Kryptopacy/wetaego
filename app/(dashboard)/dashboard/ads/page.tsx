import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdsNetworkSettings } from '@/lib/utils/settings'
import { AdsManagerClient } from './ads-manager-client'
import { AlertCircle, Zap } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ad Manager | WETAEGO',
  description: 'Manage dynamic ads across your digital menus and customer portals.',
}

export default async function AdsManagerPage() {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData?.user) {
    redirect('/login')
  }

  // Verify Global Toggles
  const adsNetwork = await getAdsNetworkSettings()
  if (!adsNetwork.enable_byo_ads) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
          <Zap className="w-8 h-8 text-zinc-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Feature Not Available</h2>
        <p className="text-zinc-400 max-w-md">
          The Ad Network module is currently disabled by the platform administrators. Check back later or contact support.
        </p>
      </div>
    )
  }

  // Verify Organization & Location
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, role, organizations(subscription_plan)')
    .eq('user_id', userData.user.id)
    .single()

  if (!member) {
    redirect('/dashboard')
  }

  const isProOrEnterprise = ['pro', 'enterprise'].includes((member.organizations as { subscription_plan?: string })?.subscription_plan || 'lite')

  if (!isProOrEnterprise) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
          <Zap className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Unlock Ad Manager</h2>
        <p className="text-zinc-400 max-w-md mb-8">
          The Ad Manager allows you to natively inject your own sponsors directly into your digital catalogs and booking pages without affecting performance.
        </p>
        <Link href="/dashboard/billing" className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors">
          View Plans & Upgrade
        </Link>
      </div>
    )
  }

  // Fetch Locations
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('organization_id', member.organization_id)

  if (!locations || locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertCircle className="w-12 h-12 text-zinc-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No Locations Found</h2>
        <p className="text-zinc-400">You need to create a location before managing ads.</p>
      </div>
    )
  }

  // Fetch Ads for these locations
  const locationIds = locations.map(l => l.id)
  const { data: ads } = await supabase
    .from('sponsored_ads')
    .select('*')
    .in('location_id', locationIds)
    .order('created_at', { ascending: false })

  // Note: Analytics aggregation is best done via an RPC or grouping, but for MVP we fetch events.
  // Wait, if there are thousands of events, fetching them all is bad. We'll use a server action to fetch stats.

  return (
    <div className="max-w-6xl space-y-6 pb-20">
      <PageHeader
        title="Ad Manager"
        description="Bring your own sponsors. Seamlessly inject native partner banners and sponsored promotions into your storefronts."
      />

      <AdsManagerClient initialAds={(ads as unknown as Parameters<typeof AdsManagerClient>[0]['initialAds']) || []} locations={locations} />
    </div>
  )
}
