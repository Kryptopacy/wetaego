const fs = require('fs')

let pageContent = fs.readFileSync('app/(dashboard)/dashboard/settings/page.tsx', 'utf8')

// 1. Add saveLoyaltySettings to imports
pageContent = pageContent.replace(
  `import { updateOrganization, saveLocationInfoSettings, saveAiSettings } from './actions'`,
  `import { updateOrganization, saveLocationInfoSettings, saveAiSettings, saveLoyaltySettings } from './actions'`
)

// 2. Fetch loyalty settings
// Find `const { data: orgData } = await supabase.from('organizations').select('id').eq('created_by', userId).single()`
pageContent = pageContent.replace(
  `    if (orgData) org = { id: orgData.id }
  }`,
  `    if (orgData) org = { id: orgData.id }
  }
  
  let loyaltySettings: any = null
  if (org) {
    const { data: ls } = await supabase.from('loyalty_settings').select('*').eq('organization_id', org.id).single()
    loyaltySettings = ls
  }`
)

// 3. Add the UI block
const loyaltyBlock = `
        {tab === 'loyalty' && org && location && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              Loyalty Program & CRM
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              Configure how customers earn points and redeem rewards automatically at checkout.
            </p>

            <form action={saveLoyaltySettings} className="flex flex-col gap-6">
              <input type="hidden" name="organizationId" value={org.id} />
              
              <div className="flex items-center gap-3">
                <input
                  type="hidden"
                  name="isEnabled"
                  value="false"
                />
                <input
                  type="checkbox"
                  id="isEnabled"
                  name="isEnabled"
                  value="true"
                  defaultChecked={loyaltySettings?.is_enabled ?? false}
                  className="w-5 h-5 rounded border-zinc-700 bg-zinc-800/50 text-blue-500 focus:ring-blue-500 focus:ring-offset-zinc-900"
                />
                <label htmlFor="isEnabled" className="text-sm font-medium text-white">
                  Enable automatic loyalty points accrual
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 border border-zinc-800 rounded-lg bg-zinc-800/20">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Points Earning Rate</label>
                  <p className="text-xs text-zinc-500 mb-3">How many points do customers earn per 1 {location.currency_code || 'NGN'} spent?</p>
                  <input
                    type="number"
                    name="pointsPerMajorUnit"
                    min="1"
                    defaultValue={loyaltySettings?.points_per_major_unit || 1}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 border border-zinc-800 rounded-lg bg-zinc-800/20">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Reward Threshold (Points)</label>
                  <p className="text-xs text-zinc-500 mb-3">How many points must a customer reach to unlock a reward?</p>
                  <input
                    type="number"
                    name="rewardThreshold"
                    min="1"
                    defaultValue={loyaltySettings?.reward_threshold || 100}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Reward Discount Value</label>
                  <p className="text-xs text-zinc-500 mb-3">Amount of discount given when they redeem ({location.currency_code || 'NGN'}). minor units.</p>
                  <input
                    type="number"
                    name="rewardDiscountMinor"
                    min="0"
                    defaultValue={loyaltySettings?.reward_discount_minor || 0}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">E.g., enter 100000 for a 1000 NGN discount.</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button type="submit" className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
                  Save Loyalty Rules
                </button>
              </div>
            </form>
          </div>
        )}
`

pageContent = pageContent.replace(
  `        {/* Removed AICoverStudio from here as it was moved inside Venue Information */}
      </div>
    </div>
  )
}`,
  `        {/* Removed AICoverStudio from here as it was moved inside Venue Information */}
${loyaltyBlock}
      </div>
    </div>
  )
}`
)

fs.writeFileSync('app/(dashboard)/dashboard/settings/page.tsx', pageContent)
console.log('Injected Loyalty Tab to settings page')
