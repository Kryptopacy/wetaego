import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DomainManager } from './domain-manager'
import { PageHeader } from '@/components/ui/page-header'

export default async function DomainPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    redirect('/login')
  }

  const { data: member } = await supabase
    .from('organization_members')
    .select('role, organizations(id)')
    .eq('user_id', user.id).limit(1).maybeSingle()

  let orgId = ''
  if (member && member.organizations) {
    const orgs = member.organizations as { id: string } | { id: string }[]
    orgId = Array.isArray(orgs) ? orgs[0]?.id || '' : orgs.id || ''
  } else {
    const { data } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id).limit(1).maybeSingle()
    orgId = data?.id || ''
  }

  if (!orgId) {
    return (
      <div className="max-w-4xl space-y-6">
        <PageHeader
          title="Custom Domains"
          description="Manage white-labeled domains and automatic SSL provisioning for your storefronts."
        />
        <div className="rounded-2xl border border-yellow-800 bg-yellow-900/20 p-6">
          <p className="text-yellow-400">Please complete your Business Settings first.</p>
        </div>
      </div>
    )
  }

  // Fetch locations
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, slug')
    .eq('organization_id', orgId)
    .order('name')

  const locationIds = locations?.map(l => l.id) || []

  // Fetch custom domains
  let domains: import('@/lib/supabase/types').Database['public']['Tables']['custom_domains']['Row'][] = []
  if (locationIds.length > 0) {
    const { data: customDomains } = await supabase
      .from('custom_domains')
      .select('*')
      .in('location_id', locationIds)
      .order('created_at', { ascending: false })
    
    domains = customDomains || []
  }

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      <PageHeader
        title="Custom Domains"
        description="Connect and manage custom domains (e.g. menu.yourbrand.com) directly to your OurMenu storefronts with automatic SSL."
      />

      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-300 text-sm mb-8">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🌐</span>
          <span><strong>White-Labeling:</strong> Connect your own domains (e.g., menu.yourbrand.com) directly to your OurMenu storefronts. We automatically provision SSL certificates.</span>
        </div>
      </div>

      <DomainManager 
        initialDomains={domains} 
        locations={locations || []} 
        organizationId={orgId} 
      />
    </div>
  )
}
