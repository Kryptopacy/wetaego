import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApiKeyManager } from './api-key-manager'

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
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-6">API Keys</h1>
        <div className="rounded-xl border border-yellow-800 bg-yellow-900/20 p-6">
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
    <div className="max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">API Keys</h1>
          <p className="text-sm text-zinc-400">Manage inbound API keys for custom POS and external integrations.</p>
        </div>
      </div>

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
