'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { saveLoyaltySettings } from './actions'
import { useAction } from 'next-safe-action/hooks'

export default function LoyaltySettingsForm({
  orgId,
  initialSettings
}: {
  orgId: string
  initialSettings: any
}) {
  const { executeAsync, isExecuting } = useAction(saveLoyaltySettings)
  const [isEnabled, setIsEnabled] = useState(initialSettings?.is_enabled ?? false)
  const [preset, setPreset] = useState<string>(() => {
    const rules = initialSettings?.advanced_rules
    if (rules && Array.isArray(rules) && rules.length > 0) {
      if (rules[0].condition === 'weekend') return 'weekend'
      if (rules[0].condition === 'high_margin') return 'high_margin'
    }
    return 'standard'
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    
    // Checkbox boolean value handling
    fd.set('isEnabled', isEnabled ? 'on' : '')

    // Convert reward discount to minor units
    const rewardDiscountStr = fd.get('rewardDiscountMinor') as string
    if (rewardDiscountStr) {
      fd.set('rewardDiscountMinor', Math.round(parseFloat(rewardDiscountStr) * 100).toString())
    }

    // Set advanced rules JSON based on preset
    let advancedRules: any[] = []
    if (preset === 'weekend') {
      advancedRules = [{ type: 'multiplier', condition: 'weekend', value: 2 }]
    } else if (preset === 'high_margin') {
      advancedRules = [{ type: 'multiplier', condition: 'high_margin', value: 3 }]
    }
    fd.set('advancedRules', JSON.stringify(advancedRules))

    const res = await executeAsync(fd)
    if (res?.serverError) {
      toast.error(res.serverError)
    } else {
      toast.success('Loyalty settings saved')
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Customer Loyalty Program</h2>
          <p className="text-sm text-zinc-500 max-w-xl">
            Reward your customers with points for every purchase. Points can be redeemed for discounts at checkout.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          onClick={() => setIsEnabled(!isEnabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isEnabled ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className={!isEnabled ? 'opacity-50 pointer-events-none' : ''}>
        <input type="hidden" name="organizationId" value={orgId} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Points per ₦100 spent</label>
            <input
              type="number"
              name="pointsPerMajorUnit"
              defaultValue={initialSettings?.points_per_major_unit ?? 1}
              min="1"
              required
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-zinc-400">How many points a customer earns for every major currency unit spent.</p>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Redemption Threshold (Points)</label>
            <input
              type="number"
              name="rewardThreshold"
              defaultValue={initialSettings?.reward_threshold ?? 100}
              min="1"
              required
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-zinc-400">Points required before a customer can redeem their reward.</p>
          </div>
          
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Reward Discount (₦)</label>
            <input
              type="number"
              name="rewardDiscountMinor"
              defaultValue={(initialSettings?.reward_discount_minor ?? 0) / 100}
              min="0"
              step="0.01"
              required
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-zinc-400">The flat amount deducted from the checkout total when points are redeemed. Enter value in major units (e.g. 500 for ₦500).</p>
          </div>
        </div>

        <div className="mb-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4">Advanced Presets</h3>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Loyalty Rule Preset</label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="standard">Standard (Flat points on all orders)</option>
              <option value="weekend">Double Points on Weekends</option>
              <option value="high_margin">Triple Points on Upsell Items</option>
            </select>
            <p className="text-[11px] text-zinc-400">Select a predefined rule to boost points based on specific conditions.</p>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="submit"
            disabled={isExecuting}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {isExecuting ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
