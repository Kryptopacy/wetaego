import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MarketingClient } from './marketing-client'

export default async function MarketingPage() {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) redirect('/login')

  const userId = userData.user.id

  // Derive orgId server-side — never trust client-supplied org
  let orgId = ''
  const { data: member } = await supabase
    .from('organization_members')
    .select('role, organization_id')
    .eq('user_id', userId)
    .in('role', ['owner', 'manager'])
    .limit(1)
    .single()

  if (member) {
    orgId = member.organization_id
  } else {
    // Fallback: check if creator
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', userId)
      .single()
    if (org) orgId = org.id
  }

  if (!orgId) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="rounded-2xl border border-amber-800/40 bg-amber-900/10 p-6">
          <p className="text-amber-400 text-sm font-medium">
            Only owners and managers can access Marketing broadcasts.
          </p>
        </div>
      </div>
    )
  }

  // Fetch opt-in count to surface on the page
  const { count: optInCount } = await supabase
    .from('customer_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('marketing_opt_in', true)

  return <MarketingClient orgId={orgId} optInCount={optInCount || 0} />
}
