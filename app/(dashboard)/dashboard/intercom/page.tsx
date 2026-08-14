import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { IntercomHub } from './intercom-hub'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Intercom Hub | OurMenu OS',
  description: 'Unified customer table calls & internal staff intercom communication hub.',
}

export default async function IntercomPage() {
  const supabase = await createClient()
  const adminClient = await createAdminClient()
  const cookieStore = await cookies()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user organization membership
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, role, department')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  let orgId = member?.organization_id
  let role = member?.role || 'staff'
  let userDepartment = member?.department || 'General'

  if (!orgId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .limit(1)
      .single()
    if (org) {
      orgId = org.id
      role = 'owner'
    }
  }

  if (!orgId) {
    redirect('/dashboard/settings')
  }

  // Fetch organization info for business_type
  const { data: orgData } = await adminClient
    .from('organizations')
    .select('id, name, business_type')
    .eq('id', orgId)
    .single()

  const businessType = orgData?.business_type || 'restaurant'

  // Resolve active location from cookie or first location
  const { data: locations } = await adminClient
    .from('locations')
    .select('id, name, slug, ai_name, ai_enabled')
    .eq('organization_id', orgId)

  const activeLocId = cookieStore.get('ourmenu_active_location_id')?.value
  const activeLocation = locations?.find(l => l.id === activeLocId) || locations?.[0] || null
  const aiName = activeLocation?.ai_name || 'Tego AI'

  // Fetch initial customer service requests (Guest calls, assistance, inquiries, AI escalations)
  let initialCustomerRequests: any[] = []
  if (activeLocation) {
    const { data: reqs } = await adminClient
      .from('service_requests')
      .select('id, location_id, table_identifier, request_type, custom_message, status, priority, urgency_score, created_at, updated_at, ai_summary, complaint_details')
      .eq('location_id', activeLocation.id)
      .in('status', ['pending', 'acknowledged'])
      .order('created_at', { ascending: false })
      .limit(50)

    initialCustomerRequests = reqs || []
  }

  // Fetch org staff members for 1-on-1 direct messaging and department assignments
  const { data: staffMembers } = await adminClient
    .from('organization_members')
    .select('id, user_id, role, department, users:user_id(email, raw_user_meta_data)')
    .eq('organization_id', orgId)

  const formattedStaff = (staffMembers || []).map((m: any) => {
    const meta = m.users?.raw_user_meta_data || {}
    const displayName = meta.full_name || meta.name || m.users?.email?.split('@')[0] || 'Staff Member'
    return {
      userId: m.user_id,
      role: m.role || 'staff',
      department: m.department || 'General',
      name: displayName,
      email: m.users?.email || ''
    }
  })

  // Suggested department channels tailored to business type for quick-add
  let suggestedChannels: string[] = ['kitchen', 'floor', 'management']
  if (['supermarket', 'grocery', 'retail', 'convenience'].includes(businessType)) {
    suggestedChannels = ['inventory', 'cashier', 'customer-service', 'management']
  } else if (['salon', 'spa', 'barbershop', 'wellness'].includes(businessType)) {
    suggestedChannels = ['reception', 'practitioners', 'management']
  } else if (['clinic', 'pharmacy', 'healthcare'].includes(businessType)) {
    suggestedChannels = ['reception', 'triage', 'pharmacy', 'management']
  } else if (['hotel', 'shortlet', 'hospitality', 'resort'].includes(businessType)) {
    suggestedChannels = ['front-desk', 'housekeeping', 'concierge', 'management']
  } else if (['consulting', 'agency', 'professional', 'services'].includes(businessType)) {
    suggestedChannels = ['front-desk', 'client-support', 'management']
  }

  const { data: existingChannels } = await adminClient
    .from('intercom_channels')
    .select('id, name, type, organization_id')
    .eq('organization_id', orgId)

  const existingNames = new Set((existingChannels || []).map(c => c.name?.toLowerCase()))

  // Ensure only #general is created by default
  if (!existingNames.has('general')) {
    const { data: newGeneral } = await adminClient
      .from('intercom_channels')
      .insert({
        organization_id: orgId,
        type: 'location',
        name: 'general'
      })
      .select('id')
      .single()

    if (newGeneral) {
      await adminClient.from('intercom_channel_members').insert({
        channel_id: newGeneral.id,
        user_id: user.id
      })
    }
  }

  // Re-fetch all channels
  const { data: allChannels } = await adminClient
    .from('intercom_channels')
    .select('id, name, type, organization_id')
    .eq('organization_id', orgId)

  return (
    <IntercomHub
      userId={user.id}
      userRole={role}
      userDepartment={userDepartment}
      organizationId={orgId}
      businessType={businessType}
      aiName={aiName}
      activeLocation={activeLocation}
      locations={locations || []}
      initialCustomerRequests={initialCustomerRequests}
      initialChannels={allChannels || []}
      suggestedChannels={suggestedChannels}
      staffList={formattedStaff}
    />
  )
}
