import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { formatCurrency } from '@/lib/utils/currency'

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
    .select('user_id, role')
    .eq('organization_id', orgId)

  // 2. Fetch order reviews (Staff + Business)
  const { data: reviewsRaw } = await supabase
    .from('order_reviews')
    .select('*')
    .eq('organization_id', orgId)
    .eq('location_id', activeLocationId)
    .order('created_at', { ascending: false })
  
  const reviews: { id: string; staff_id: string | null; staff_rating: number; staff_feedback: string | null; business_rating: number | null; business_feedback: string | null; created_at: string }[] = (reviewsRaw as unknown as { id: string; staff_id: string | null; staff_rating: number; staff_feedback: string | null; business_rating: number | null; business_feedback: string | null; created_at: string }[]) || []

  // 3. Fetch tips (Orders with assigned staff and tip > 0)
  const { data: ordersWithTipsRaw } = await supabase
    .from('orders')
    .select('id, assigned_staff_id, tip_amount_minor, created_at')
    .eq('organization_id', orgId)
    .eq('location_id', activeLocationId)
    .gt('tip_amount_minor', 0)
  
  const ordersWithTips: { id: string; assigned_staff_id: string | null; tip_amount_minor: number | null; created_at: string }[] = (ordersWithTipsRaw as unknown as { id: string; assigned_staff_id: string | null; tip_amount_minor: number | null; created_at: string }[]) || []

  // 4. Fetch User Profiles for Staff
  const staffIds = (staffMembers || []).map(s => s.user_id)
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, full_name')
    .in('id', staffIds)

  const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]))

  // Calculate stats per staff
  const staffStatsRaw = (staffMembers || []).map((staff) => {
    const staffId = staff.user_id
    const fullName = profileMap.get(staffId)

    const name = fullName ? fullName : `Staff ${staffId.slice(0, 6).toUpperCase()}`

    const staffReviews = reviews?.filter(r => r.staff_id === staffId && r.staff_rating) || []
    const avgRating = staffReviews.length > 0 
      ? staffReviews.reduce((sum, r) => sum + (r.staff_rating || 0), 0) / staffReviews.length 
      : 0

    const staffTips = ordersWithTips?.filter(o => o.assigned_staff_id === staffId) || []
    const totalTipsMinor = staffTips.reduce((sum, o) => sum + (o.tip_amount_minor || 0), 0)

    return {
      userId: staffId,
      name,
      role: staff.role,
      reviewCount: staffReviews.length,
      avgRating,
      totalTipsMinor,
      recentFeedback: staffReviews.filter(r => r.staff_feedback).map(r => r.staff_feedback).slice(0, 3)
    }
  })
  
  const staffStats = staffStatsRaw.sort((a, b) => b.totalTipsMinor - a.totalTipsMinor)

  // Calculate Business Stats
  const bizReviews = reviews?.filter(r => r.business_rating) || []
  const avgBizRating = bizReviews.length > 0
    ? bizReviews.reduce((sum, r) => sum + (r.business_rating || 0), 0) / bizReviews.length
    : 0

  const isOwnerOrManager = role === 'owner' || role === 'manager'

  if (!isOwnerOrManager) {
    const myStats = staffStats.find(s => s.userId === userId) || {
      userId, name: 'You', role, reviewCount: 0, avgRating: 0, totalTipsMinor: 0, recentFeedback: []
    }

    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">My Performance</h1>
          <p className="text-zinc-400">Track your personal tips and service feedback.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-zinc-500 font-bold uppercase tracking-wider text-xs mb-1">Your Tips Earned</h3>
            <div className="text-4xl font-black text-green-400">
              {formatCurrency(myStats.totalTipsMinor, currencyCode)}
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-zinc-500 font-bold uppercase tracking-wider text-xs mb-1">Your Service Rating</h3>
            <div className="text-4xl font-black text-white flex items-center gap-2">
              {myStats.avgRating > 0 ? myStats.avgRating.toFixed(1) : '-'} <span className="text-yellow-500 text-2xl">★</span>
              <span className="text-sm font-medium text-zinc-500 ml-2">({myStats.reviewCount} reviews)</span>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mt-12 mb-4">Your Recent Feedback</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myStats.recentFeedback.map((feedback, idx) => (
            <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
              <p className="text-zinc-300 text-sm leading-relaxed">&quot;{feedback}&quot;</p>
            </div>
          ))}
          {myStats.recentFeedback.length === 0 && (
            <div className="col-span-full py-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
              No personal feedback received yet.
            </div>
          )}
        </div>
      </div>
    )
  }

  // Full Leaderboard for Owners/Managers
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Team Performance & Feedback</h1>
          <p className="text-zinc-400">Track staff tips, service ratings, and overall restaurant feedback.</p>
        </div>
        <a 
          href="/dashboard/manage/feedback" 
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium text-sm transition-colors border border-white/5"
        >
          View Feedback Inbox
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-zinc-500 font-bold uppercase tracking-wider text-xs mb-1">Total Tips Collected</h3>
          <div className="text-4xl font-black text-blue-500">
            {formatCurrency(ordersWithTips?.reduce((sum, o) => sum + (o.tip_amount_minor || 0), 0) || 0, currencyCode)}
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-zinc-500 font-bold uppercase tracking-wider text-xs mb-1">Overall Restaurant Rating</h3>
          <div className="text-4xl font-black text-white flex items-center gap-2">
            {avgBizRating.toFixed(1)} <span className="text-yellow-500 text-2xl">★</span>
            <span className="text-sm font-medium text-zinc-500 ml-2">({bizReviews.length} reviews)</span>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-white mt-12 mb-4">Staff Leaderboard</h2>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400">
            <tr>
              <th className="px-6 py-4 font-medium">Staff Member</th>
              <th className="px-6 py-4 font-medium text-right">Service Rating</th>
              <th className="px-6 py-4 font-medium text-right">Tips Earned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {staffStats.map((staff) => (
              <tr key={staff.userId} className="hover:bg-zinc-800/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-white">{staff.name}</div>
                  <div className="text-zinc-500 text-xs uppercase tracking-wider">{staff.role}</div>
                  {staff.recentFeedback.length > 0 && (
                    <div className="mt-2 text-xs text-zinc-400 italic">
                      &quot;{staff.recentFeedback[0]}&quot;
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end items-center gap-1 font-bold text-white">
                    {staff.avgRating > 0 ? staff.avgRating.toFixed(1) : '-'} <span className="text-yellow-500">★</span>
                  </div>
                  <div className="text-zinc-500 text-xs">{staff.reviewCount} reviews</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="font-bold text-green-400">
                    {formatCurrency(staff.totalTipsMinor, currencyCode)}
                  </div>
                </td>
              </tr>
            ))}
            {staffStats.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">No staff members found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-bold text-white mt-12 mb-4">Recent Restaurant Feedback</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bizReviews.filter(r => r.business_feedback).slice(0, 6).map((review) => (
          <div key={review.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-1 text-yellow-500 text-sm">
                {Array.from({ length: review.business_rating || 0 }).map((_, i) => <span key={i}>★</span>)}
              </div>
              <div className="text-xs text-zinc-500">
                {new Date(review.created_at).toLocaleDateString()}
              </div>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">&quot;{review.business_feedback}&quot;</p>
          </div>
        ))}
        {bizReviews.filter(r => r.business_feedback).length === 0 && (
          <div className="col-span-full py-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
            No written feedback received yet.
          </div>
        )}
      </div>
    </div>
  )
}
