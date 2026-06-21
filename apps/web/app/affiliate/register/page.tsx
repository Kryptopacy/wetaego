import { createClient } from '@/lib/supabase/server'
import { registerAffiliate } from '../actions'
import { redirect } from 'next/navigation'

export default async function AffiliateRegisterPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData?.user) {
    redirect('/login?next=/affiliate/register')
  }

  // Check if they are already an affiliate
  const { data: existing } = await supabase
    .from('affiliates')
    .select('id')
    .eq('user_id', userData.user.id)
    .single()

  if (existing) {
    redirect('/affiliate/dashboard')
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-zinc-900 border border-zinc-800 p-8 rounded-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Become an Affiliate</h1>
          <p className="text-zinc-400 mt-2">Earn 10% lifetime recurring commissions on every business you refer.</p>
        </div>

        <form action={registerAffiliate} className="space-y-6">
          <div>
            <label htmlFor="referral_code" className="block text-sm font-medium text-zinc-300">Choose your Referral Code</label>
            <input 
              type="text" 
              name="referral_code" 
              id="referral_code" 
              required 
              placeholder="e.g. YOURNAME2026"
              className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <p className="text-xs text-zinc-500 mt-1">This will be used in your unique affiliate link.</p>
          </div>

          <hr className="border-zinc-800" />
          <p className="text-sm text-zinc-400 font-medium">Payout Bank Details (Nigeria)</p>

          <div>
            <label htmlFor="bank_code" className="block text-sm font-medium text-zinc-300">Bank Code</label>
            <input 
              type="text" 
              name="bank_code" 
              id="bank_code" 
              required 
              placeholder="e.g. 058 (GTBank)"
              className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label htmlFor="account_number" className="block text-sm font-medium text-zinc-300">Account Number</label>
            <input 
              type="text" 
              name="account_number" 
              id="account_number" 
              required 
              placeholder="0123456789"
              className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label htmlFor="account_name" className="block text-sm font-medium text-zinc-300">Account Name</label>
            <input 
              type="text" 
              name="account_name" 
              id="account_name" 
              required 
              placeholder="John Doe"
              className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <button 
            type="submit" 
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors"
          >
            Register as Affiliate
          </button>
        </form>
      </div>
    </div>
  )
}
