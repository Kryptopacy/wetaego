import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { FeedbackInboxClient } from './feedback-client'

export default async function FeedbackManagementPage() {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) redirect('/login')

  const userId = userData?.user?.id || 'demo-user-id'

  // Fetch organization and role
  let orgId = ''
  const { data: member } = await supabase
    .from('organization_members')
    .select('role, organizations(id, name)')
    .eq('user_id', userId)
    .maybeSingle()

  if (member && member.organizations) {
    orgId = (member.organizations as { id: string }).id
  } else {
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', userId).limit(1).maybeSingle()
    if (org) {
      orgId = org.id
    }
  }

  if (!orgId) redirect('/dashboard')

  // Get active location
  const cookieStore = await cookies()
  const savedLocId = cookieStore.get('ourmenu_active_location_id')?.value

  let locationId = savedLocId
  if (!locationId) {
    const { data: loc } = await supabase.from('locations').select('id').eq('organization_id', orgId).limit(1).single()
    locationId = loc?.id
  }
  const activeLocationId = locationId || ''

  if (!activeLocationId) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <p className="text-zinc-500">Please create a location first.</p>
      </div>
    )
  }

  // Fetch staff members
  const { data: staffMembers } = await supabase
    .from('organization_members')
    .select('user_id, role')
    .eq('organization_id', orgId)

  const staffIds = (staffMembers || []).map(s => s.user_id)
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, full_name')
    .in('id', staffIds)

  const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]))
  const staffList = (staffMembers || []).map(staff => ({
    id: staff.user_id,
    name: profileMap.get(staff.user_id) || `Staff ${staff.user_id.slice(0, 6).toUpperCase()}`
  }))

  // Fetch order reviews (Staff + Business)
  const { data: reviewsRaw } = await supabase
    .from('order_reviews')
    .select('id, order_id, staff_id, staff_rating, staff_feedback, business_rating, business_feedback, created_at, orders(customer_name)')
    .eq('organization_id', orgId)
    .eq('location_id', activeLocationId)
    .order('created_at', { ascending: false })
  const reviews = reviewsRaw || []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedReviews = reviews.map((r: any) => ({
    id: r.id,
    orderId: r.order_id,
    customerName: r.orders?.customer_name || 'Anonymous',
    staffId: r.staff_id,
    staffName: r.staff_id ? (profileMap.get(r.staff_id) || `Staff ${r.staff_id.slice(0, 6).toUpperCase()}`) : null,
    staffRating: r.staff_rating,
    staffFeedback: r.staff_feedback,
    businessRating: r.business_rating,
    businessFeedback: r.business_feedback,
    createdAt: r.created_at
  }))

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Feedback Inbox</h1>
        <p className="text-zinc-400">Read and manage written feedback from your customers.</p>
      </div>
      
      <FeedbackInboxClient reviews={mappedReviews} staffList={staffList} />
    </div>
  )
}
