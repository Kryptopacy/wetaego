import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApiKeyManager } from './api-key-manager'
import { PageHeader } from '@/components/ui/page-header'

export default async function ApiKeysPage() {
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
          title="API Keys"
          description="Manage inbound API keys for custom POS, webhook listeners, and third-party integrations."
        />
        <div className="rounded-2xl border border-yellow-800 bg-yellow-900/20 p-6">
          <p className="text-yellow-400">Please complete your Business Settings first.</p>
        </div>
      </div>
    )
  }

  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      <PageHeader
        title="API Keys"
        description="Manage inbound API keys for custom POS systems, ERP synchronization, and external automations."
      />

      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-blue-300 text-sm mb-8">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🔐</span>
          <span><strong>Security Notice:</strong> Your API keys carry many privileges, so be sure to keep them secure! Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.</span>
        </div>
      </div>

      <ApiKeyManager initialKeys={apiKeys || []} organizationId={orgId} />
    </div>
  )
}
