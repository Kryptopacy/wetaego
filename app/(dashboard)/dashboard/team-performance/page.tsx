import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { PerformanceHubClient, StaffPerformanceItem, ReviewItem } from './performance-hub-client'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Performance & Feedback | WETAEGO',
  description: 'Business ratings, customer reviews, and staff service leaderboard.',
}

export default async function TeamPerformancePage() {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) redirect('/login')

  const userId = userData?.user?.id || 'demo-user-id'

  // Fetch organization and role
  let orgId = ''
  let role = 'viewer'
  const { data: member } = await supabase
    .from('organization_members')
    .select('role, organizations(id, name)')
    .eq('user_id', userId)
    .maybeSingle()

  if (member && member.organizations) {
    orgId = (member.organizations as { id: string }).id
    role = member.role
  } else {
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', userId).limit(1).maybeSingle()
    if (org) {
      orgId = org.id
      role = 'owner'
    }
  }

  if (!orgId) redirect('/dashboard')

  // Get active location
  const cookieStore = await cookies()
  const savedLocId = cookieStore.get('ourmenu_active_location_id')?.value

  let locationId = savedLocId
  if (!locationId || locationId === 'global') {
    const { data: loc } = await supabase.from('locations').select('id').eq('organization_id', orgId).limit(1).single()
    locationId = loc?.id
  }
  const activeLocationId = locationId || ''

  if (!activeLocationId) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <p className="text-zinc-500">Please create a location first in Settings.</p>
      </div>
    )
  }

  // Fetch currency code from active location
  const { data: locData } = await supabase
    .from('locations')
    .select('currency_code')
    .eq('id', activeLocationId)
    .single()
  const currencyCode = locData?.currency_code || 'NGN'

  // 1. Fetch staff members
  const { data: staffMembers } = await supabase
    .from('organization_members')
    .select('user_id, role, department')
    .eq('organization_id', orgId)

  // 2. Fetch order reviews (Staff + Business + Orders Customer Name)
  const { data: reviewsRaw } = await supabase
    .from('order_reviews')
    .select('id, staff_id, staff_rating, staff_feedback, business_rating, business_feedback, created_at, orders(customer_name)')
    .eq('organization_id', orgId)
    .eq('location_id', activeLocationId)
    .order('created_at', { ascending: false })
  
  const rawReviews = (reviewsRaw as any[]) || []

  // 3. Fetch tips (Orders with assigned staff and tip > 0)
  const { data: ordersWithTipsRaw } = await supabase
    .from('orders')
    .select('id, assigned_staff_id, tip_amount_minor, created_at')
    .eq('organization_id', orgId)
    .eq('location_id', activeLocationId)
    .gt('tip_amount_minor', 0)
  
  const ordersWithTips = (ordersWithTipsRaw as any[]) || []

  // 4. Fetch User Profiles for Staff
  const staffIds = (staffMembers || []).map(s => s.user_id)
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, full_name')
    .in('id', staffIds)

  const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]))

  // Calculate stats per staff (Sorted on client by rating / review volume, tips kept private)
  const staffStats: StaffPerformanceItem[] = (staffMembers || []).map((staff) => {
    const staffId = staff.user_id
    const fullName = profileMap.get(staffId)

    const name = fullName ? fullName : `Staff ${staffId.slice(0, 6).toUpperCase()}`

    const staffReviews = rawReviews.filter(r => r.staff_id === staffId && r.staff_rating)
    const avgRating = staffReviews.length > 0 
      ? staffReviews.reduce((sum, r) => sum + (r.staff_rating || 0), 0) / staffReviews.length 
      : 0

    const staffTips = ordersWithTips.filter(o => o.assigned_staff_id === staffId)
    const totalTipsMinor = staffTips.reduce((sum, o) => sum + (o.tip_amount_minor || 0), 0)

    return {
      userId: staffId,
      name,
      role: staff.role,
      department: staff.department || 'General',
      reviewCount: staffReviews.length,
      avgRating,
      totalTipsMinor,
      recentFeedback: staffReviews.filter(r => r.staff_feedback).map(r => r.staff_feedback).slice(0, 3)
    }
  })

  // Calculate Business Stats
  const bizReviews = rawReviews.filter(r => r.business_rating)
  const avgBizRating = bizReviews.length > 0
    ? bizReviews.reduce((sum, r) => sum + (r.business_rating || 0), 0) / bizReviews.length
    : 0

  const totalTipsCollectedMinor = ordersWithTips.reduce((sum, o) => sum + (o.tip_amount_minor || 0), 0)

  const isOwnerOrManager = role === 'owner' || role === 'manager'

  // Map review items
  const mappedReviews: ReviewItem[] = rawReviews.map(r => {
    const sName = r.staff_id ? profileMap.get(r.staff_id) : undefined
    const cName = r.orders?.customer_name || 'Guest'
    return {
      id: r.id,
      staffId: r.staff_id,
      staffName: sName,
      customerName: cName,
      staffRating: r.staff_rating,
      staffFeedback: r.staff_feedback,
      businessRating: r.business_rating,
      businessFeedback: r.business_feedback,
      createdAt: r.created_at
    }
  })

  return (
    <PerformanceHubClient
      currentUserId={userId}
      isOwnerOrManager={isOwnerOrManager}
      currencyCode={currencyCode}
      staffStats={staffStats}
      reviews={mappedReviews}
      avgBizRating={avgBizRating}
      totalBizReviews={bizReviews.length}
      totalTipsCollectedMinor={totalTipsCollectedMinor}
    />
  )
}
