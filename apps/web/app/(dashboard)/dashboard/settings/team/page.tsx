/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect, @typescript-eslint/ban-ts-comment */
// FIXME: Developer bypassed types/rules. Requires refactoring for true perfection.
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import TeamManager from './team-manager'
import DangerZone from './danger-zone'

export default async function TeamPage() {
  const supabase = await createClient()

  // Fetch current user
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) {
    // Demo Mode bypass
  }

  const cookieStore = await cookies()
  const isDemo = !user && cookieStore.get('demo_mode')?.value === '1'

  if (!user && !isDemo) {
    redirect('/login')
  }

  const userId = user?.id || 'demo-user-id'

  // Fetch organization and role
  let organization = null
  let role = 'viewer'

  let members: any[] = []
  let invites: any[] = []

  if (isDemo) {
    organization = { id: 'demo-org', name: 'Demo Venue', slug: 'demo-venue' }
    role = 'owner'
    members = [
      { user_id: 'demo-user-id', email: 'owner@ourmenuos.online', role: 'owner', created_at: new Date(1718236800000 - 86400000 * 10).toISOString() },
      { user_id: 'manager-1', email: 'manager@ourmenuos.online', role: 'manager', created_at: new Date(1718236800000 - 86400000 * 5).toISOString() }
    ]
    invites = [
      { id: 'invite-1', email: 'staff@ourmenuos.online', role: 'viewer', token: 'mock-token', expires_at: new Date(1718236800000 + 86400000 * 2).toISOString() }
    ]
  } else {
    const { data: member } = await supabase
      .from('organization_members')
      .select('role, organizations(id, name, slug)')
      .eq('user_id', userId)
      .single()

    if (member && member.organizations) {
      organization = member.organizations
      role = member.role
    } else {
      const { data } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('created_by', userId)
        .single()
      organization = data
      role = 'owner'
    }

    const { data: membersRaw } = await supabase
      .from('organization_member_details')
      .select('*')
      .eq('organization_id', organization?.id || '')

    members = (membersRaw || []).map((m) => ({
      user_id: m.user_id,
      email: m.email,
      role: m.role,
      created_at: m.created_at,
    }))

    const { data: invitesRaw } = await supabase
      .from('organization_invites')
      .select('*')
      .eq('organization_id', organization?.id || '')
      .order('created_at', { ascending: false })

    invites = (invitesRaw || []).map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      token: i.token,
      expires_at: i.expires_at,
    }))
  }

  // Only owners and managers can access this page
  const isOwnerOrManager = role === 'owner' || role === 'manager'
  if (!isOwnerOrManager || !organization) {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/dashboard/settings" className="text-zinc-500 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Business Settings</span>
          <h1 className="text-2xl font-bold text-white">Team Management</h1>
        </div>
      </div>
      <p className="text-sm text-zinc-400 mb-8 ml-10">
        Manage access for staff, editors, and managers in your business dashboard.
      </p>

      <div className="ml-10">
        <TeamManager
          organizationId={organization.id}
          currentUserId={userId}
          currentUserRole={role}
          members={members}
          invites={invites}
        />
        <DangerZone orgId={organization.id} isOwner={role === 'owner'} />
      </div>
    </div>
  )
}
