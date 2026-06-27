import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Mail, TrendingUp, Award } from 'lucide-react'
import Link from 'next/link'
import { CustomersClient } from './customers-client'


export default async function CustomersPage() {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    redirect('/login')
  }

  const userId = user?.id || 'demo-user-id'

  // Find user's org
  let orgId = ''
  const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', userId).limit(1).single()
  if (member) {
    orgId = member.organization_id
  } else {
    const { data: orgData } = await supabase.from('organizations').select('id').eq('created_by', userId).single()
    if (orgData) orgId = orgData.id
  }

  if (!orgId) {
    return <div className="p-8 text-white">No organization found.</div>
  }

  // Get a currency code from the first location
  const { data: loc } = await supabase.from('locations').select('currency_code').eq('organization_id', orgId).limit(1).single()
  const currencyCode = loc?.currency_code || 'NGN'

  // Fetch paginated customer profiles (Limit 50)
  const { data: customers } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('organization_id', orgId)
    .order('last_visit_at', { ascending: false })
    .limit(50)

  // Fetch scalable exact counts without loading massive row payloads
  const { count: totalCustomers } = await supabase
    .from('customer_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  const { count: marketingOptIns } = await supabase
    .from('customer_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('marketing_opt_in', true)

  // Fetch only the loyalty_points column for aggregation to avoid OOM crashes
  const { data: pointsData } = await supabase
    .from('customer_profiles')
    .select('loyalty_points')
    .eq('organization_id', orgId)
    
  const totalPoints = (pointsData || []).reduce((sum, p) => sum + (p.loyalty_points || 0), 0)

  return (
    <div className="max-w-6xl space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            CRM & Loyalty
          </h1>
          <p className="text-zinc-400 mt-1">Manage your customer relationships and view shadow profiles built automatically at checkout.</p>
        </div>
        <Link 
          href="/dashboard/settings?tab=general" 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <Award className="w-4 h-4" />
          Configure Loyalty Program
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <Users className="w-5 h-5" />
            <span className="font-medium">Total Customers</span>
          </div>
          <span className="text-3xl font-bold text-white">{totalCustomers || 0}</span>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <Mail className="w-5 h-5" />
            <span className="font-medium">Marketing Subscribers</span>
          </div>
          <span className="text-3xl font-bold text-white">{marketingOptIns || 0}</span>
          <p className="text-xs text-zinc-500 mt-2">Explicit GDPR opt-ins at checkout</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">Points in Circulation</span>
          </div>
          <span className="text-3xl font-bold text-white">{totalPoints}</span>
        </div>
      </div>

      <CustomersClient 
        organizationId={orgId} 
        initialProfiles={customers || []} 
        currencyCode={currencyCode} 
      />
    </div>
  )
}
