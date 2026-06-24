import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/utils/currency'
import { Users, Mail, TrendingUp, Award } from 'lucide-react'
import Link from 'next/link'
import { cookies } from 'next/headers'

export default async function CustomersPage() {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  const cookieStore = await cookies()
  const isDemo = !user && cookieStore.get('demo_mode')?.value === '1'

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

  // Fetch customer profiles
  const { data: customers } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('organization_id', orgId)
    .order('last_visit_at', { ascending: false })

  const profiles = customers || []

  // Basic stats
  const totalCustomers = profiles.length
  const marketingOptIns = profiles.filter(p => p.marketing_opt_in).length
  const totalPoints = profiles.reduce((sum, p) => sum + (p.loyalty_points || 0), 0)

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
          <span className="text-3xl font-bold text-white">{totalCustomers}</span>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <Mail className="w-5 h-5" />
            <span className="font-medium">Marketing Subscribers</span>
          </div>
          <span className="text-3xl font-bold text-white">{marketingOptIns}</span>
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

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Customer Directory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-zinc-800/50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-6 py-4 font-medium">Customer Email</th>
                <th className="px-6 py-4 font-medium">Orders</th>
                <th className="px-6 py-4 font-medium">Lifetime Value</th>
                <th className="px-6 py-4 font-medium">Loyalty Points</th>
                <th className="px-6 py-4 font-medium">Last Visit</th>
                <th className="px-6 py-4 font-medium text-right">Marketing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {profiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    No customers found. Shadow profiles are built automatically when customers checkout.
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-200">{profile.email}</td>
                    <td className="px-6 py-4">{profile.total_orders}</td>
                    <td className="px-6 py-4 font-medium text-emerald-400">
                      {formatCurrency(profile.total_spend_minor || 0, currencyCode)}
                    </td>
                    <td className="px-6 py-4 font-bold text-blue-400">{profile.loyalty_points || 0}</td>
                    <td className="px-6 py-4">
                      {profile.last_visit_at ? new Date(profile.last_visit_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {profile.marketing_opt_in ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                          Opted In
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-zinc-500/10 px-2 py-1 text-xs font-medium text-zinc-400 ring-1 ring-inset ring-zinc-500/20">
                          Unsubscribed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
