
import { getPricingSettings, getCreditCosts, getPlanLimits, getAiModels, getPlatformFees, getTrialSettings, getGlobalManualPayment, getKycSettings } from '@/lib/utils/settings'
import { updateSetting } from './actions'
import { ActionForm } from '@/components/ActionForm'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TenantDirectory } from './tenant-directory'
import { CouponsManager } from './coupons-manager'
import { isAdminEmail } from '@/lib/utils/admin'
import { AdminTabs } from './admin-tabs'
import { AffiliatesRegistry } from './affiliates-registry'

export default async function AdminPage() {
  const pricing = await getPricingSettings()
  const creditCosts = await getCreditCosts()
  const planLimits = await getPlanLimits()
  const aiModels = await getAiModels()
  const platformFees = await getPlatformFees()
  const trialSettings = await getTrialSettings()
  const globalPayment = await getGlobalManualPayment()
  const kycSettings = await getKycSettings() as { require_kyc_to_publish?: boolean }

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!isAdminEmail(userData?.user?.email)) {
    redirect('/dashboard')
  }

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, slug, subscription_plan, subscription_status, purchased_credits, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: affiliates } = await supabase
    .from('affiliates')
    .select(`
      id,
      referral_code,
      status,
      created_at,
      paystack_subaccount_code
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Developer Console</h1>
          <p className="text-zinc-400">Configure global pricing, credits, and AI models in real time.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3 flex-wrap">
          <a 
            href="/dashboard/admin/tester" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600/10 text-teal-500 hover:bg-teal-600/20 border border-teal-600/20 rounded-lg text-sm font-medium transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Payment Tester
          </a>
          <a 
            href="/api/admin/hackathon-export" 
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/20 border border-emerald-600/20 rounded-lg text-sm font-medium transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Hackathon Metrics
          </a>
        </div>
      </div>

      {/* Grouped Tab Layout */}
      <AdminTabs tabs={['Tenants & Coupons', 'Pricing & Fees', 'AI & Limits', 'Danger Zone', 'Affiliates']}>
        {/* Tab 0: Tenants & Coupons */}
        <div className="space-y-8 min-w-0">
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Tenants</h2>
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white">{orgs?.length || 0} Orgs</span>
            </div>
            <p className="text-sm text-zinc-400 mb-6">Server-side paginated tenant directory (scaled to handle millions of rows via Supabase).</p>
            <TenantDirectory organizations={orgs || []} />
          </section>
          
          <CouponsManager initialCoupons={coupons || []} />
        </div>

        {/* Tab 1: Pricing & Fees */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
          <div className="space-y-6">
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl w-full">
              <h2 className="text-lg font-bold text-white mb-4">Pricing Config (NGN)</h2>
              <ActionForm action={updateSetting} className="space-y-4">
                <input type="hidden" name="key" value="pricing" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Lite (Monthly)</label>
                    <input type="number" name="lite_monthly_ngn" defaultValue={(pricing as Record<string, number>).lite_monthly_ngn || 19999} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Pro (Monthly)</label>
                    <input type="number" name="pro_monthly_ngn" defaultValue={(pricing as Record<string, number>).pro_monthly_ngn || 69000} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Enterprise (Monthly)</label>
                    <input type="number" name="enterprise_monthly_ngn" defaultValue={(pricing as Record<string, number>).enterprise_monthly_ngn || 150000} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500" />
                  </div>
                  <div className="col-span-1 sm:col-span-2 pt-2 border-t border-zinc-800">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3">Credit Packs</h3>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">10 Credits</label>
                    <input type="number" name="credits_10_ngn" defaultValue={(pricing as Record<string, number>).credits_10_ngn || 6000} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">25 Credits</label>
                    <input type="number" name="credits_25_ngn" defaultValue={(pricing as Record<string, number>).credits_25_ngn || 12000} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">50 Credits</label>
                    <input type="number" name="credits_50_ngn" defaultValue={(pricing as Record<string, number>).credits_50_ngn || 60000} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500" />
                  </div>
                </div>
                <button type="submit" className="w-full px-4 py-2 bg-emerald-600/20 text-emerald-500 border border-emerald-500/50 rounded-lg text-sm font-medium hover:bg-emerald-500 hover:text-white transition">Save Pricing</button>
              </ActionForm>
            </section>
          </div>
          <div className="space-y-6">
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl w-full">
              <h2 className="text-lg font-bold text-white mb-4">Trial Config</h2>
              <ActionForm action={updateSetting} className="space-y-4">
                <input type="hidden" name="key" value="trial_settings" />
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Default Trial Days (0 = No Free Trial)</label>
                  <input type="number" name="default_trial_days" defaultValue={(trialSettings as Record<string, number>).default_trial_days ?? 15} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500" />
                </div>
                <button type="submit" className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition border border-zinc-700">Save Trial</button>
              </ActionForm>
            </section>
            
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl w-full">
              <h2 className="text-lg font-bold text-white mb-4">Platform Fees (%)</h2>
              <ActionForm action={updateSetting} className="space-y-4">
                <input type="hidden" name="key" value="platform_fees" />
                <input type="hidden" name="is_json" value="true" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Business Payouts</label>
                    <input type="number" name="business_subaccount" defaultValue={(platformFees as Record<string, number>).business_subaccount ?? 5} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Affiliate Payouts</label>
                    <input type="number" name="affiliate_subaccount" defaultValue={(platformFees as Record<string, number>).affiliate_subaccount ?? 5} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Staff Tips</label>
                    <input type="number" name="staff_tip_subaccount" defaultValue={(platformFees as Record<string, number>).staff_tip_subaccount ?? 0} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500" />
                  </div>
                </div>
                <button type="submit" className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition border border-zinc-700">Save Fees</button>
              </ActionForm>
            </section>
          </div>
        </div>

        {/* Tab 2: AI & Limits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
          <div className="space-y-6">
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl w-full">
              <h2 className="text-lg font-bold text-white mb-4">Credit Costs</h2>
              <ActionForm action={updateSetting} className="space-y-4">
                <input type="hidden" name="key" value="credit_costs" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Forecast</label>
                    <input type="number" name="forecast" defaultValue={(creditCosts as Record<string, number>).forecast ?? 3} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Menu Auto-Fill</label>
                    <input type="number" name="auto_fill" defaultValue={(creditCosts as Record<string, number>).auto_fill ?? 2} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Copywriter</label>
                    <input type="number" name="text_generation" defaultValue={(creditCosts as Record<string, number>).text_generation ?? 1} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Image Gen</label>
                    <input type="number" name="image_generation" defaultValue={(creditCosts as Record<string, number>).image_generation ?? 2} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Admin AI Co-Pilot</label>
                    <input type="number" name="copilot" defaultValue={(creditCosts as Record<string, number>).copilot ?? 1} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500" />
                  </div>
                </div>
                <button type="submit" className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition border border-zinc-700">Save Credit Costs</button>
              </ActionForm>
            </section>

            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl w-full">
              <h2 className="text-lg font-bold text-white mb-4">AI Models</h2>
              <ActionForm action={updateSetting} className="space-y-4">
                <input type="hidden" name="key" value="ai_models" />
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Text Generation Model</label>
                    <input type="text" name="text_generation" defaultValue={(aiModels as Record<string, string>).text_generation} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Image Generation Model</label>
                    <input type="text" name="image_generation" defaultValue={(aiModels as Record<string, string>).image_generation} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm outline-none focus:border-emerald-500" />
                  </div>
                </div>
                <button type="submit" className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition border border-zinc-700">Save Models</button>
              </ActionForm>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl w-full">
              <h2 className="text-lg font-bold text-white mb-4">Plan Limits (JSON)</h2>
              <ActionForm action={updateSetting} className="space-y-4">
                <input type="hidden" name="key" value="plan_limits" />
                <input type="hidden" name="is_json" value="true" />
                <textarea name="json_value" defaultValue={JSON.stringify(planLimits, null, 2)} rows={20} className="w-full font-mono text-xs rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white outline-none focus:border-emerald-500 whitespace-pre" />
                <button type="submit" className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition border border-zinc-700">Save Plan Limits</button>
              </ActionForm>
            </section>
          </div>
        </div>

        {/* Tab 3: Danger Zone */}
        <div className="space-y-6 max-w-2xl min-w-0">
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 border-t-4 border-t-red-500 shadow-xl overflow-hidden w-full">
            <h2 className="text-lg font-bold text-white mb-2">Danger Zone</h2>
            <p className="text-zinc-400 text-sm mb-4">Global platform overrides.</p>
            <ActionForm action={updateSetting} className="space-y-4 mb-8">
              <input type="hidden" name="key" value="require_kyc_to_publish" />
              <input type="hidden" name="is_json" value="true" />
              
              <div className="flex items-start gap-3 bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 w-full">
                <input 
                  type="checkbox" 
                  id="require_kyc_to_publish"
                  name="require_kyc_to_publish" 
                  value="true"
                  defaultChecked={kycSettings?.require_kyc_to_publish === true} 
                  className="mt-1 w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-blue-500 focus:ring-blue-500 shrink-0" 
                />
                <label htmlFor="require_kyc_to_publish" className="text-sm font-medium text-white leading-tight cursor-pointer">
                  Require KYC to Publish
                  <span className="block text-xs text-zinc-400 font-normal mt-1">If enabled, businesses cannot publish their portals until their KYC is manually approved by you.</span>
                </label>
              </div>
              <button type="submit" className="w-full px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/50 rounded-lg text-sm font-medium hover:bg-blue-600 hover:text-white transition">Save Compliance Settings</button>
            </ActionForm>

            <ActionForm action={updateSetting} className="space-y-4">
              <input type="hidden" name="key" value="global_payment" />
              <input type="hidden" name="is_json" value="true" />
              
              <div className="flex items-start gap-3 bg-red-500/10 p-4 rounded-xl border border-red-500/20 w-full">
                <input 
                  type="checkbox" 
                  id="global_manual_payment_override"
                  name="global_manual_payment_override" 
                  value="true"
                  defaultChecked={(globalPayment as any).global_manual_payment_override === true} 
                  className="mt-1 w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-red-500 focus:ring-red-500 shrink-0" 
                />
                <label htmlFor="global_manual_payment_override" className="text-xs font-bold text-red-400 leading-tight">
                  FORCE MANUAL PAYMENT FALLBACK (Bypasses Paystack globally)
                </label>
              </div>
              <button type="submit" className="w-full px-4 py-2 bg-red-600/20 text-red-500 border border-red-500/50 rounded-lg text-sm font-medium hover:bg-red-500 hover:text-white transition">Apply Global Override</button>
            </ActionForm>
          </section>
        </div>

        {/* Tab 4: Affiliates */}
        <div className="space-y-8 min-w-0">
          <AffiliatesRegistry affiliates={affiliates || []} />
        </div>
      </AdminTabs>
    </div>
  )
}
