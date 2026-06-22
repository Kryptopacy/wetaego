import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function TeamPerformancePage() {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  const isDemo = !userData?.user && (await cookies()).get('demo_mode')?.value === '1'
  if (!userData?.user && !isDemo) redirect('/login')
  const user = userData?.user

  // Fetch organization
  const { data: member } = await supabase
    .from('organization_members')
    .select('organizations(id, name)')
    .eq('user_id', userData.user!.id)
    .single()

  const orgId = (member?.organizations as { id: string })?.id
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviews: { id: string; staff_id: string | null; staff_rating: number; staff_feedback: string | null; business_rating: number | null; business_feedback: string | null; created_at: string }[] = reviewsRaw as unknown as any || []

  // 3. Fetch tips (Orders with assigned staff and tip > 0)
  const { data: ordersWithTipsRaw } = await supabase
    .from('orders')
    .select('id, assigned_staff_id, tip_amount_minor, created_at')
    .eq('organization_id', orgId)
    .eq('location_id', activeLocationId)
    .gt('tip_amount_minor', 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ordersWithTips: { id: string; assigned_staff_id: string | null; tip_amount_minor: number | null; created_at: string }[] = ordersWithTipsRaw as unknown as any || []

  // Calculate stats per staff
  const staffStats = staffMembers?.map((staff) => {
    const userId = staff.user_id
    const name = `Staff ${userId.slice(0, 6).toUpperCase()}`

    const staffReviews = reviews?.filter(r => r.staff_id === userId && r.staff_rating) || []
    const avgRating = staffReviews.length > 0 
      ? staffReviews.reduce((sum, r) => sum + (r.staff_rating || 0), 0) / staffReviews.length 
      : 0

    const staffTips = ordersWithTips?.filter(o => o.assigned_staff_id === userId) || []
    const totalTipsMinor = staffTips.reduce((sum, o) => sum + (o.tip_amount_minor || 0), 0)

    return {
      userId,
      name,
      role: staff.role,
      reviewCount: staffReviews.length,
      avgRating,
      totalTipsMinor,
      recentFeedback: staffReviews.filter(r => r.staff_feedback).map(r => r.staff_feedback).slice(0, 3)
    }
  }).sort((a, b) => b.totalTipsMinor - a.totalTipsMinor) || []

  // Calculate Business Stats
  const bizReviews = reviews?.filter(r => r.business_rating) || []
  const avgBizRating = bizReviews.length > 0
    ? bizReviews.reduce((sum, r) => sum + (r.business_rating || 0), 0) / bizReviews.length
    : 0

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Team Performance & Feedback</h1>
        <p className="text-zinc-400">Track staff tips, service ratings, and overall restaurant feedback.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-zinc-500 font-bold uppercase tracking-wider text-xs mb-1">Total Tips Collected</h3>
          <div className="text-4xl font-black text-blue-500">
            ₦{((ordersWithTips?.reduce((sum, o) => sum + (o.tip_amount_minor || 0), 0) || 0) / 100).toLocaleString()}
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
  { }
  {/* eslint-disable-next-line react/no-unescaped-entities */}
                      "{staff.recentFeedback[0]}"
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
                    ₦{(staff.totalTipsMinor / 100).toLocaleString()}
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


