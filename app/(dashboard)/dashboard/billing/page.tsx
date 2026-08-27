import { createClient } from '@/lib/supabase/server'
import { subscribeToLite, subscribeToPro, buyCredits, cancelSubscription } from './actions'
import { getUsdToNgnRate } from '@/lib/payments/exchange'
import { formatCurrency } from '@/lib/utils/currency'
import Link from 'next/link'
import { CancelButton } from './cancel-button'
import { ActionForm } from '@/components/ActionForm'
import { redeemCoupon } from './actions'
import { PageHeader } from '@/components/ui/page-header'

export default async function BillingPage(props: { searchParams: Promise<{ currency?: string; cycle?: string }> }) {
  const searchParams = await props.searchParams
  const currency = searchParams?.currency === 'USD' ? 'USD' : 'NGN'
  const cycle = searchParams?.cycle === 'annual' ? 'annual' : 'monthly'
  const isAnnual = cycle === 'annual'
  
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id

  if (!userId) {
    return <div className="p-8 text-zinc-500">Please log in to manage billing.</div>
  }

  // Fetch the user's organization — check membership first, then creator fallback
  // This allows invited managers to access billing (not just the account creator)
  
  let org: import('@/lib/supabase/types').Database['public']['Tables']['organizations']['Row'] | null = null

  const { data: memberOrg } = await supabase
    .from('organization_members')
    .select('organizations(*)')
    .eq('user_id', userId)
    .in('role', ['owner', 'manager'])
    .limit(1)
    .single()

  if (memberOrg?.organizations) {
    org = memberOrg.organizations
  } else {
    const { data: creatorOrg } = await supabase
      .from('organizations')
      .select('*')
      .eq('created_by', userId).limit(1).maybeSingle()
    org = creatorOrg
  }

  if (!org) {
    return <div className="p-8 text-zinc-500">Please create an organization first.</div>
  }

  const rate = await getUsdToNgnRate()

  const trialEnds = new Date((org.trial_ends_at as string) || new Date())
  const isTrialActive = trialEnds > new Date()
  const trialDaysLeft = Math.ceil((trialEnds.getTime() - new Date().getTime()) / (1000 * 3600 * 24))

  const planLimitsObj: Record<string, number> = { lite: 10, pro: 50, enterprise: 200 }
  const availableFree = (planLimitsObj[org.subscription_tier || 'lite'] || 0) - (org.monthly_free_credits_used || 0)
  const creditsRemaining = Math.max(0, availableFree) + (org.purchased_credits || 0)

  const { getPricingSettings } = await import('@/lib/utils/settings')
  const pricing = await getPricingSettings()
  
  const liteBase = pricing.lite_monthly_ngn || 19999
  const proBase = pricing.pro_monthly_ngn || 69000
  const liteAnnualBase = (pricing as Record<string, number>).lite_annual_ngn || 191990
  const proAnnualBase = (pricing as Record<string, number>).pro_annual_ngn || 662400
  const c10Base = pricing.credits_10_ngn || 6000
  const c25Base = pricing.credits_25_ngn || 12000
  const c50Base = pricing.credits_50_ngn || 20000
  
  const convertPrice = (base: number) => currency === 'USD' ? Math.round(base / rate) : base
  const formatPrice = (amount: number) => formatCurrency(amount * 100, currency)

  // Monthly prices shown for both cycles; annual shows per-month equivalent
  const liteMonthlyPrice = convertPrice(liteBase)
  const proMonthlyPrice = convertPrice(proBase)
  const liteAnnualPerMonth = convertPrice(Math.round(liteAnnualBase / 12))
  const proAnnualPerMonth = convertPrice(Math.round(proAnnualBase / 12))
  const liteAnnualTotal = convertPrice(liteAnnualBase)
  const proAnnualTotal = convertPrice(proAnnualBase)

  const liteDisplayPrice = isAnnual ? liteAnnualPerMonth : liteMonthlyPrice
  const proDisplayPrice = isAnnual ? proAnnualPerMonth : proMonthlyPrice
  const credits10Price = convertPrice(c10Base)
  const credits25Price = convertPrice(c25Base)
  const credits50Price = convertPrice(c50Base)

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="Billing & Subscription"
        description="Manage your WETAEGO subscription tier, buy top-up credits, and view plan limits."
        action={
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
            {/* Billing Cycle Toggle */}
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              <Link href={`/dashboard/billing?currency=${currency}&cycle=monthly`} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${!isAnnual ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Monthly</Link>
              <Link href={`/dashboard/billing?currency=${currency}&cycle=annual`} className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${isAnnual ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
                Annual
                <span className="ml-1 text-[10px] font-bold text-emerald-400">−20%</span>
              </Link>
            </div>
            {/* Currency Toggle */}
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              <Link href={`/dashboard/billing?currency=NGN&cycle=${cycle}`} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${currency === 'NGN' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>NGN</Link>
              <Link href={`/dashboard/billing?currency=USD&cycle=${cycle}`} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${currency === 'USD' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>USD</Link>
            </div>
          </div>
        }
      />

      {/* Current Status */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-8">
        <h2 className="text-lg font-bold text-white mb-4">Current Status</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex justify-between items-center py-3 border-b border-zinc-800">
            <span className="text-zinc-400">Plan</span>
            <span className="text-white font-medium capitalize px-3 py-1 bg-zinc-800 rounded-full text-sm">
              {org.subscription_status === 'active' ? (org.subscription_plan || 'Pro') : 'Trial'}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-3 border-b border-zinc-800">
            <span className="text-zinc-400">Status</span>
            <span className={`font-medium ${org.subscription_status === 'active' ? 'text-green-500' : isTrialActive ? 'text-yellow-500' : 'text-red-500'}`}>
              {org.subscription_status === 'active' ? 'Active' : isTrialActive ? `${trialDaysLeft} days left` : 'Expired'}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-zinc-800">
            <span className="text-zinc-400">Credits</span>
            <span className="text-emerald-400 font-bold">
              {creditsRemaining}
            </span>
          </div>
        </div>

        {org.subscription_status === 'active' && (
          <div className="mt-6 flex justify-end pt-4 border-t border-zinc-800">
            <ActionForm action={cancelSubscription}>
              <input type="hidden" name="organization_id" value={org.id} />
              <CancelButton />
            </ActionForm>
          </div>
        )}
      </div>

      {/* Redeem Promo Code */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mt-8">
        <h2 className="text-lg font-bold text-white mb-2">Redeem Promo Code</h2>
        <p className="text-sm text-zinc-400 mb-4">Have a promo code for free credits or extra days? Enter it below.</p>
        <ActionForm action={redeemCoupon} className="flex gap-4">
          <input type="hidden" name="organization_id" value={org.id} />
          <input type="text" name="code" placeholder="Enter code (e.g. SUMMER50)" required className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-white uppercase" />
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition whitespace-nowrap">
            Redeem Code
          </button>
        </ActionForm>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-8">

        {/* Lite Upgrade Card */}
        <div className="bg-linear-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
          <h2 className="text-2xl font-bold text-white mb-2 relative z-10">WETAEGO Lite</h2>
          <div className="flex items-baseline gap-2 mb-1 relative z-10">
            <span className="text-4xl font-extrabold text-white">{formatPrice(liteDisplayPrice)}</span>
            <span className="text-zinc-500">/mo</span>
          </div>
          {isAnnual && (
            <p className="text-xs text-emerald-400 font-medium mb-3 relative z-10">
              Billed {formatPrice(liteAnnualTotal)} annually · saves {formatPrice(convertPrice(liteBase * 12) - liteAnnualTotal)}
            </p>
          )}
          
          <p className="text-sm text-zinc-400 mb-6 relative z-10">
            Billed via Paystack securely.
          </p>

          <ul className="space-y-3 mb-8 relative z-10">
            {['Customizable AI Assistant', 'Edge Translator', 'Up to 2 QR codes', '1 active location'].map(feature => (
              <li key={feature} className="flex items-center gap-3 text-zinc-300 text-sm">
                <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {feature}
              </li>
            ))}
          </ul>

          <ActionForm action={subscribeToLite} className="relative z-10">
            <input type="hidden" name="organization_id" value={org.id} />
            <input type="hidden" name="currency" value={currency} />
            <input type="hidden" name="billing_cycle" value={isAnnual ? 'annually' : 'monthly'} />
            <button 
              type="submit" 
              disabled={org.subscription_status === 'active' && org.subscription_plan === 'lite'}
              className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800/50 disabled:text-zinc-500 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {(org.subscription_status === 'active' && org.subscription_plan === 'lite') ? 'Current Plan' : 'Subscribe via Paystack'}
            </button>
          </ActionForm>
        </div>

        {/* Pro Upgrade Card */}
        <div className="bg-linear-to-br from-emerald-900/20 to-zinc-950 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-24 h-24 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13.5h-13L12 6.5z"/></svg>
          </div>
          
          {isAnnual && (
            <div className="absolute top-4 right-4 z-10 px-2 py-1 rounded-full bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              20% off
            </div>
          )}

          <h2 className="text-2xl font-bold text-white mb-2 relative z-10">WETAEGO Pro</h2>
          <div className="flex items-baseline gap-2 mb-1 relative z-10">
            <span className="text-4xl font-extrabold text-white">{formatPrice(proDisplayPrice)}</span>
            <span className="text-zinc-500">/mo</span>
          </div>
          {isAnnual && (
            <p className="text-xs text-emerald-400 font-medium mb-3 relative z-10">
              Billed {formatPrice(proAnnualTotal)} annually · saves {formatPrice(convertPrice(proBase * 12) - proAnnualTotal)}
            </p>
          )}
          
          <p className="text-sm text-zinc-400 mb-6 relative z-10">
            Includes 50 Credits/mo.
          </p>

          <ul className="space-y-3 mb-8 relative z-10">
            {['Everything in Lite', 'Live Kitchen Display System', 'Demand Forecasting', 'Smart Triaging'].map(feature => (
              <li key={feature} className="flex items-center gap-3 text-zinc-300 text-sm">
                <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {feature}
              </li>
            ))}
          </ul>

          <ActionForm action={subscribeToPro} className="relative z-10">
            <input type="hidden" name="organization_id" value={org.id} />
            <input type="hidden" name="currency" value={currency} />
            <input type="hidden" name="billing_cycle" value={isAnnual ? 'annually' : 'monthly'} />
            <button 
              type="submit" 
              disabled={org.subscription_status === 'active' && org.subscription_plan === 'pro'}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {(org.subscription_status === 'active' && org.subscription_plan === 'pro') ? 'Current Plan' : 'Subscribe via Paystack'}
            </button>
          </ActionForm>
        </div>

        {/* Enterprise Upgrade Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden flex flex-col">
          <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Enterprise</h2>
          <div className="flex items-baseline gap-2 mb-4 relative z-10">
            <span className="text-4xl font-extrabold text-white">Custom</span>
          </div>
          
          <p className="text-sm text-zinc-400 mb-6 relative z-10">
            For multi-location brands.
          </p>

          <ul className="space-y-3 mb-8 relative z-10 flex-1">
            {['Everything in Pro', 'Multi-location dashboard', 'API access for PMS integration', 'Dedicated account manager'].map(feature => (
              <li key={feature} className="flex items-center gap-3 text-zinc-300 text-sm">
                <svg className="w-5 h-5 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {feature}
              </li>
            ))}
          </ul>

          <a href="mailto:support@ourmenuos.online" className="block text-center w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-colors relative z-10 mt-auto">
            Contact Sales
          </a>
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
              <div className="text-xs text-zinc-500">{formatPrice(credits10Price)}</div>
            </div>
            <ActionForm action={buyCredits} className="relative z-10">
              <input type="hidden" name="organization_id" value={org.id} />
              <input type="hidden" name="credits" value="10" />
              <button type="submit" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors">
                Buy 10
              </button>
            </ActionForm>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-zinc-800">
            <div>
              <div className="font-semibold text-white">25 Credits</div>
              <div className="text-xs text-emerald-400 font-medium">Most Popular — {formatPrice(credits25Price)}</div>
            </div>
            <ActionForm action={buyCredits} className="relative z-10">
              <input type="hidden" name="organization_id" value={org.id} />
              <input type="hidden" name="credits" value="25" />
              <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-colors">
                Buy 25
              </button>
            </ActionForm>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-zinc-800">
            <div>
              <div className="font-semibold text-white">50 Credits</div>
              <div className="text-xs text-zinc-500">{formatPrice(credits50Price)}</div>
            </div>
            <ActionForm action={buyCredits} className="relative z-10">
              <input type="hidden" name="organization_id" value={org.id} />
              <input type="hidden" name="credits" value="50" />
              <button type="submit" className="px-4 py-2 bg-linear-to-r from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg">
                Buy 50
              </button>
            </ActionForm>
          </div>

          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-800/50 rounded-xl">
            <p className="text-xs text-blue-200">
              💡 <strong className="font-bold text-blue-400">Pro Tip:</strong> Upgrading to Pro gives you 50 Credits included every month for only {formatPrice(proDisplayPrice)}—a massive saving over buying standalone credits!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
