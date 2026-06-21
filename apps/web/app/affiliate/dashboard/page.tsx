import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AffiliateDashboardPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData?.user) {
    redirect('/login?next=/affiliate/dashboard')
  }

  // Fetch Affiliate record
  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', userData.user.id)
    .single()

  if (!affiliate) {
    redirect('/affiliate/register')
  }

  // Fetch Referrals
  const { data: referrals } = await supabase
    .from('organizations')
    .select('id, name, created_at, subscription_status, subscription_plan')
    .eq('referred_by_affiliate_id', affiliate.id)
    .order('created_at', { ascending: false })

  // Fetch Earnings
  const { data: earnings } = await supabase
    .from('affiliate_earnings')
    .select('amount_minor, status')
    .eq('affiliate_id', affiliate.id)

  const pendingEarnings = earnings?.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount_minor, 0) || 0
  const paidEarnings = earnings?.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount_minor, 0) || 0

  const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/ref/${affiliate.referral_code}`

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Affiliate Dashboard</h1>
            <p className="text-zinc-400 mt-1">Manage your referrals and track your earnings.</p>
          </div>
          <Link href="/dashboard" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors">
            Back to App
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-zinc-400 text-sm font-medium mb-1">Total Referrals</h3>
            <p className="text-3xl font-bold">{referrals?.length || 0}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-zinc-400 text-sm font-medium mb-1">Pending Balance</h3>
            <p className="text-3xl font-bold text-yellow-500">₦{(pendingEarnings / 100).toLocaleString()}</p>
            <p className="text-xs text-zinc-500 mt-1">Available for next payout</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-zinc-400 text-sm font-medium mb-1">Total Paid</h3>
            <p className="text-3xl font-bold text-emerald-500">₦{(paidEarnings / 100).toLocaleString()}</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">Your Referral Link</h2>
          <div className="flex gap-4">
            <input 
              type="text" 
              readOnly 
              value={referralLink} 
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-300 outline-none"
            />
            {/* Note: In a real app, you'd make this a client component with a "Copy" button */}
            <button className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-lg font-medium transition-colors">
              Copy Link
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-3">Share this link. When businesses sign up and complete their second renewal, you start earning!</p>
        </div>

        {/* Referred Businesses */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-lg font-bold">Referred Businesses</h2>
          </div>
          
          {referrals && referrals.length > 0 ? (
            <div className="divide-y divide-zinc-800">
              {referrals.map(org => (
                <div key={org.id} className="p-6 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold">{org.name}</h4>
                    <p className="text-xs text-zinc-500 mt-1">Joined {new Date(org.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-zinc-800 rounded-full text-xs font-medium capitalize">
                      {org.subscription_plan}
                    </span>
                    <p className={`text-xs mt-2 font-medium ${org.subscription_status === 'active' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                      {org.subscription_status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-zinc-500">
              You haven't referred any businesses yet. Share your link to get started!
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
