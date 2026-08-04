import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import TeamManager from './team-manager'
import DangerZone from './danger-zone'
import { StaffShifts } from './staff-shifts'

export default async function TeamPage() {
  const supabase = await createClient()

  // Fetch current user
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) {
    // Demo Mode bypass
  }

  

  if (!user) {
    redirect('/login')
  }

  const userId = user?.id || 'demo-user-id'

  // Fetch organization and role
  let organization = null
  let role = 'viewer'

  let members: { 
    user_id: string; 
    email: string; 
    role: string; 
    created_at: string; 
    full_name?: string;
    department?: string;
    bank_name?: string;
    account_number?: string;
    account_name?: string;
  }[] = []
  let invites: { id: string; email: string; role: string; token: string; expires_at: string; department?: string }[] = []

  const { data: member } = await supabase
    .from('organization_members')
    .select('role, organizations(id, name, slug)')
    .eq('user_id', userId)
    .single()

  if (member && member.organizations) {
    organization = member.organizations as { id: string; name: string; slug: string }
    role = member.role
  } else {
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('created_by', userId).limit(1).maybeSingle()
    organization = org
    role = 'owner'
  }

  const { data: membersRaw } = await supabase
    .from('organization_member_details')
    .select('*')
    .eq('organization_id', organization?.id || '')

  const userIds = (membersRaw || []).map(m => m.user_id as string)
    
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name, bank_name, account_number, account_name')
      .in('id', userIds)

    const profilesMap = new Map(profiles?.map((p: { id: string, full_name?: string | null, bank_name?: string | null, account_number?: string | null, account_name?: string | null }) => [p.id, p]) || [])

    members = (membersRaw || []).map(m => {
      
      const profile = profilesMap.get(m.user_id as string) as { full_name?: string; bank_name?: string; account_number?: string; account_name?: string } | undefined
      return {
        user_id: m.user_id as string,
        email: m.email as string,
        role: m.role as string,
        created_at: m.created_at as string,
        department: m.department as string | undefined,
        full_name: profile?.full_name,
        bank_name: profile?.bank_name,
        account_number: profile?.account_number,
        account_name: profile?.account_name,
      }
    })

    const { data: invitesRaw } = await supabase
      .from('organization_invites')
      .select('*')
      .eq('organization_id', organization?.id || '')
      .order('created_at', { ascending: false })

    invites = (invitesRaw || []).map((i) => ({
      id: i.id as string,
      email: i.email as string,
      role: i.role as string,
      token: i.token as string,
      expires_at: i.expires_at as string,
      department: i.department as string | undefined,
    }))

  // Only owners and managers can access this page
  const isOwnerOrManager = role === 'owner' || role === 'manager'
  if (!isOwnerOrManager || !organization) {
    redirect('/dashboard')
  }

  // Fetch shifts for the organization's locations
  const { data: shiftsRaw } = await supabase
    .from('staff_shifts')
    .select(`
      id,
      clock_in_time,
      clock_out_time,
      status,
      profiles:user_id ( full_name, email ),
      locations:location_id ( name )
    `)
    .order('clock_in_time', { ascending: false })
    .limit(100)

  const { data: orgLocations } = await supabase
    .from('locations')
    .select('id')
    .eq('organization_id', organization.id)

  const orgLocationIds = orgLocations?.map(l => l.id) || []

  const shifts = (shiftsRaw || []).filter(shift => orgLocationIds.includes((shift.locations as unknown as { id: string })?.id))

  const { data: pagesRaw } = await supabase
    .from('location_pages')
    .select('id, title, slug')
    .in('location_id', orgLocationIds)
  const pages = (pagesRaw || []).map(p => ({ id: p.id, title: p.title, slug: p.slug }))

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
          pages={pages}
        />
        <StaffShifts shifts={shifts as unknown as Parameters<typeof StaffShifts>[0]['shifts']} />
        <DangerZone orgId={organization.id} isOwner={role === 'owner'} />
      </div>
    </div>
  )
}
