import { createClient } from '@/lib/supabase/server'
import { getPricingSettings, getCreditCosts, getPlanLimits, getAiModels } from '@/lib/utils/settings'
import { updateSetting } from './actions'

export default async function AdminPage() {
  const pricing = await getPricingSettings()
  const creditCosts = await getCreditCosts()
  const planLimits = await getPlanLimits()
  const aiModels = await getAiModels()

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Developer Console</h1>
        <p className="text-zinc-400">Configure global pricing, credits, and AI models in real time.</p>
      </div>

      <div className="grid gap-6">
        {/* Pricing Settings */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Pricing Configuration (NGN)</h2>
          <form action={updateSetting} className="space-y-4">
            <input type="hidden" name="key" value="pricing" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Pro Monthly (NGN)</label>
                <input type="number" name="pro_monthly_ngn" defaultValue={(pricing as any).pro_monthly_ngn} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">10 Credits Pack (NGN)</label>
                <input type="number" name="credits_10_ngn" defaultValue={(pricing as any).credits_10_ngn} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">50 Credits Pack (NGN)</label>
                <input type="number" name="credits_50_ngn" defaultValue={(pricing as any).credits_50_ngn} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white" />
              </div>
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition">Save Pricing</button>
          </form>
        </section>

        {/* AI Models */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">AI Models Configuration</h2>
          <form action={updateSetting} className="space-y-4">
            <input type="hidden" name="key" value="ai_models" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Text Generation Model</label>
                <input type="text" name="text_generation" defaultValue={(aiModels as any).text_generation} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Image Generation Model</label>
                <input type="text" name="image_generation" defaultValue={(aiModels as any).image_generation} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white" />
              </div>
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition">Save Models</button>
          </form>
        </section>

        {/* Advanced JSON Sections for Limits & Costs */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Credit Usage Costs (JSON)</h2>
          <form action={updateSetting} className="space-y-4">
            <input type="hidden" name="key" value="credit_costs" />
            <input type="hidden" name="is_json" value="true" />
            <textarea name="json_value" defaultValue={JSON.stringify(creditCosts, null, 2)} rows={6} className="w-full font-mono text-sm rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white" />
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition">Save Credit Costs</button>
          </form>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Plan Limits (JSON)</h2>
          <form action={updateSetting} className="space-y-4">
            <input type="hidden" name="key" value="plan_limits" />
            <input type="hidden" name="is_json" value="true" />
            <textarea name="json_value" defaultValue={JSON.stringify(planLimits, null, 2)} rows={8} className="w-full font-mono text-sm rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white" />
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition">Save Plan Limits</button>
          </form>
        </section>
      </div>
    </div>
  )
}
