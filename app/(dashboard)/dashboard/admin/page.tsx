
import { getPricingSettings, getCreditCosts, getPlanLimits, getAiModels, getPlatformFees } from '@/lib/utils/settings'
import { updateSetting } from './actions'
import { ActionForm } from '@/components/ActionForm'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TenantDirectory } from './tenant-directory'

export default async function AdminPage() {
  const pricing = await getPricingSettings()
  const creditCosts = await getCreditCosts()
  const planLimits = await getPlanLimits()
  const aiModels = await getAiModels()
  const platformFees = await getPlatformFees()

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (userData?.user?.email !== (process.env.ADMIN_EMAIL || 'kryptopacy@gmail.com')) {
    redirect('/dashboard')
  }

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, subscription_plan, subscription_status, purchased_credits, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Developer Console</h1>
          <p className="text-zinc-400">Configure global pricing, credits, and AI models in real time.</p>
        </div>
        <div className="mt-4 sm:mt-0">
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

      <div className="grid gap-6">
        {/* Pricing Settings */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Pricing Configuration (NGN)</h2>
          <ActionForm action={updateSetting} className="space-y-4">
            <input type="hidden" name="key" value="pricing" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Lite Monthly (NGN)</label>
                <input type="number" name="lite_monthly_ngn" defaultValue={(pricing as Record<string, number>).lite_monthly_ngn || 14999} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Pro Plan (Monthly)</label>
                <input type="number" name="pro_monthly_ngn" defaultValue={(pricing as Record<string, number>).pro_monthly_ngn || 49999} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Enterprise Plan (Monthly)</label>
                <input type="number" name="enterprise_monthly_ngn" defaultValue={(pricing as Record<string, number>).enterprise_monthly_ngn || 150000} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">10 Credits Pack</label>
                <input type="number" name="credits_10_ngn" defaultValue={(pricing as Record<string, number>).credits_10_ngn || 6000} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">25 Credits Pack</label>
                <input type="number" name="credits_25_ngn" defaultValue={(pricing as Record<string, number>).credits_25_ngn || 12000} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">50 Credits Pack (NGN)</label>
                <input type="number" name="credits_50_ngn" defaultValue={(pricing as Record<string, number>).credits_50_ngn || 60000} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white" />
              </div>
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition">Save Pricing</button>
          </ActionForm>
        </section>

        {/* Tenant Directory */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Tenant Directory</h2>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white">{orgs?.length || 0} Businesses</span>
          </div>
          <TenantDirectory organizations={orgs || []} />
        </section>

        {/* Platform Fees */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Platform Fee Percentages (%)</h2>
          <ActionForm action={updateSetting} className="space-y-4">
            <input type="hidden" name="key" value="platform_fees" />
            <input type="hidden" name="is_json" value="true" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Business Payouts</label>
                <input type="number" name="business_subaccount" defaultValue={(platformFees as Record<string, number>).business_subaccount ?? 5} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Affiliate Payouts</label>
                <input type="number" name="affiliate_subaccount" defaultValue={(platformFees as Record<string, number>).affiliate_subaccount ?? 5} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Staff Tips</label>
                <input type="number" name="staff_tip_subaccount" defaultValue={(platformFees as Record<string, number>).staff_tip_subaccount ?? 0} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white" />
              </div>
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition">Save Fees</button>
          </ActionForm>
        </section>

        {/* AI Models */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">AI Models Configuration</h2>
          <ActionForm action={updateSetting} className="space-y-4">
            <input type="hidden" name="key" value="ai_models" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Text Generation Model</label>
                <input type="text" name="text_generation" defaultValue={(aiModels as Record<string, string>).text_generation} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Image Generation Model</label>
                <input type="text" name="image_generation" defaultValue={(aiModels as Record<string, string>).image_generation} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white" />
              </div>
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition">Save Models</button>
          </ActionForm>
        </section>

        {/* Advanced JSON Sections for Limits & Costs */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Credit Usage Costs (JSON)</h2>
          <ActionForm action={updateSetting} className="space-y-4">
            <input type="hidden" name="key" value="credit_costs" />
            <input type="hidden" name="is_json" value="true" />
            <textarea name="json_value" defaultValue={JSON.stringify(creditCosts, null, 2)} rows={6} className="w-full font-mono text-sm rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white" />
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition">Save Credit Costs</button>
          </ActionForm>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Plan Limits (JSON)</h2>
          <ActionForm action={updateSetting} className="space-y-4">
            <input type="hidden" name="key" value="plan_limits" />
            <input type="hidden" name="is_json" value="true" />
            <textarea name="json_value" defaultValue={JSON.stringify(planLimits, null, 2)} rows={8} className="w-full font-mono text-sm rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white" />
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition">Save Plan Limits</button>
          </ActionForm>
        </section>
      </div>
    </div>
  )
}
