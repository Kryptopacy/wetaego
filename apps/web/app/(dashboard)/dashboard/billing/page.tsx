import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { subscribeToPro, buyCredits } from './actions'
import { getUsdToNgnRate } from '@/lib/payments/exchange'

export default async function BillingPage() {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id

  // Fetch the user's organization
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('created_by', userId)
    .single()

  if (!org) {
    return <div className="p-8 text-zinc-500">Please create an organization first.</div>
  }

  const rate = await getUsdToNgnRate()
  const currentNgnPrice = Math.round(39 * rate)

  // Determine trial status
  const trialEnds = new Date(org.trial_ends_at)
  const isTrialActive = trialEnds > new Date()
  const trialDaysLeft = Math.ceil((trialEnds.getTime() - new Date().getTime()) / (1000 * 3600 * 24))

  const { getPricingSettings } = await import('@/lib/utils/settings')
  const pricing = await getPricingSettings() as any
  const proPrice = pricing.pro_monthly_ngn || 49000
  const credits10Price = pricing.credits_10_ngn || 15000
  const credits50Price = pricing.credits_50_ngn || 60000

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-white mb-2">Billing & Subscription</h1>
      <p className="text-zinc-400">Manage your OurMenu OS subscription and payment methods.</p>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {/* Current Status */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Current Status</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-zinc-800">
              <span className="text-zinc-400">Plan</span>
              <span className="text-white font-medium capitalize px-3 py-1 bg-zinc-800 rounded-full text-sm">
                {org.subscription_status === 'active' ? 'Pro' : 'Trial'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-zinc-800">
              <span className="text-zinc-400">Status</span>
              <span className={`font-medium ${org.subscription_status === 'active' ? 'text-green-500' : isTrialActive ? 'text-yellow-500' : 'text-red-500'}`}>
                {org.subscription_status === 'active' ? 'Active' : isTrialActive ? `${trialDaysLeft} days left` : 'Expired'}
              </span>
            </div>
          </div>
        </div>

        {/* Upgrade Card */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-24 h-24 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13.5h-13L12 6.5z"/></svg>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2 relative z-10">OurMenu OS Pro</h2>
          <div className="flex items-baseline gap-2 mb-4 relative z-10">
            <span className="text-4xl font-extrabold text-white">₦{proPrice.toLocaleString()}</span>
            <span className="text-zinc-500">/mo</span>
          </div>
          
          <p className="text-sm text-zinc-400 mb-6 relative z-10">
            Billed via Paystack securely.
          </p>

          <ul className="space-y-3 mb-8 relative z-10">
            {['Unlimited Menus & Items', 'Live Kitchen Display System', 'Dynamic QR Provisioning', 'Staff Role Management'].map(feature => (
              <li key={feature} className="flex items-center gap-3 text-zinc-300 text-sm">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {feature}
              </li>
            ))}
          </ul>

          <form action={subscribeToPro} className="relative z-10">
            <input type="hidden" name="organization_id" value={org.id} />
            <button 
              type="submit" 
              disabled={org.subscription_status === 'active'}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {org.subscription_status === 'active' ? 'Already Subscribed' : 'Subscribe via Paystack'}
            </button>
          </form>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-2">Buy Credits (Pay As You Go)</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Credits are used for premium AI generation tools (cover art, menu copywriting, translations) and creating extra custom pages. Pro users get 50 free credits every month.
          </p>

          <div className="flex items-center justify-between py-4 border-b border-zinc-800">
            <div>
              <div className="font-semibold text-white">10 Credits</div>
              <div className="text-xs text-zinc-500">₦{credits10Price.toLocaleString()}</div>
            </div>
            <form action={buyCredits as any} className="relative z-10">
              <input type="hidden" name="organization_id" value={org.id} />
              <input type="hidden" name="credits" value="10" />
              <button type="submit" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors">
                Buy 10
              </button>
            </form>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-zinc-800">
            <div>
              <div className="font-semibold text-white">50 Credits</div>
              <div className="text-xs text-zinc-500">₦{credits50Price.toLocaleString()}</div>
            </div>
            <form action={buyCredits as any} className="relative z-10">
              <input type="hidden" name="organization_id" value={org.id} />
              <input type="hidden" name="credits" value="50" />
              <button type="submit" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg">
                Buy 50
              </button>
            </form>
          </div>

          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-800/50 rounded-xl">
            <p className="text-xs text-blue-200">
              💡 <strong className="font-bold text-blue-400">Pro Tip:</strong> Upgrading to Pro gives you 50 Credits included every month for only ₦{proPrice.toLocaleString()}—a massive saving over buying standalone credits!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
