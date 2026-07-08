import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Wallet, AlertCircle, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'
import { IOUClient } from './iou-client'

export default async function IOUsPage() {
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

  // Get currency code & settings from location/org
  const { data: loc } = await supabase.from('locations').select('currency_code').eq('organization_id', orgId).limit(1).single()
  const currencyCode = loc?.currency_code || 'NGN'

  const { data: orgData } = await supabase.from('organizations').select('metadata').eq('id', orgId).single()
  const settings = (orgData?.metadata as Record<string, unknown>) || {}

  // Fetch paginated customer profiles WITH ACTIVE TABS (Limit 50)
  const { data: customers } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('organization_id', orgId)
    .gt('credit_balance_minor', 0)
    .order('last_visit_at', { ascending: false })
    .limit(50)

  // Fetch aggregates
  const { data: tabData } = await supabase
    .from('customer_profiles')
    .select('credit_balance_minor')
    .eq('organization_id', orgId)
    .gt('credit_balance_minor', 0)
    
  const totalOutstandingMinor = (tabData || []).reduce((sum, p) => sum + (p.credit_balance_minor || 0), 0)
  const activeTabsCount = tabData?.length || 0

  return (
    <div className="max-w-6xl space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-green-500" />
            Active IOUs (Tabs)
          </h1>
          <p className="text-zinc-400 mt-1">Manage open tabs, track outstanding credit, and configure auto-payment reminders.</p>
        </div>
        <Link 
          href="/dashboard/settings?tab=general" 
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-sm border border-zinc-700"
        >
          <AlertCircle className="w-4 h-4" />
          Configure Auto-Reminders
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">Total Outstanding</span>
          </div>
          <span className="text-3xl font-bold text-green-400">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(totalOutstandingMinor / 100)}
          </span>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <Wallet className="w-5 h-5" />
            <span className="font-medium">Active Tabs</span>
          </div>
          <span className="text-3xl font-bold text-white">{activeTabsCount}</span>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Reminder Settings</span>
          </div>
          <span className="text-xl font-bold text-white capitalize">{settings.iou_reminder_frequency || 'Not Configured'}</span>
          <p className="text-xs text-zinc-500 mt-2">Min Installment: {settings.iou_min_installment_pct || 100}%</p>
        </div>
      </div>

      <IOUClient initialCustomers={customers || []} currencyCode={currencyCode} />
    </div>
  )
}
