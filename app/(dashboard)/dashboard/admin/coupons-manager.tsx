'use client'

import { useState } from 'react'
import { ActionForm } from '@/components/ActionForm'
import { createCoupon } from './actions'
import { format } from 'date-fns'

interface Coupon {
  id: string
  code: string
  discount_type: string
  discount_value: number
  plan_tier?: string | null
  expires_at?: string | null
  max_redemptions?: number | null
  times_redeemed: number
  is_active: boolean
  created_at: string
}

export function CouponsManager({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [discountType, setDiscountType] = useState('free_credits')

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Create New Promo Campaign</h2>
        <ActionForm action={createCoupon} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Coupon Code</label>
              <input type="text" name="code" placeholder="e.g. SUMMER50" required className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white uppercase" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Discount Type</label>
              <select 
                name="discount_type" 
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white"
              >
                <option value="free_credits">Free Credits</option>
                <option value="free_plan">Free Plan</option>
                <option value="plan_extension">Plan Extension</option>
                <option value="trial_extension">Trial Extension</option>
              </select>
            </div>

            {discountType === 'free_plan' && (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Plan Tier</label>
                <select name="plan_tier" className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white">
                  <option value="lite">Lite</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                {discountType === 'free_credits' ? 'Credits Amount' : discountType === 'free_plan' ? 'Duration (Days)' : 'Extra Days'}
              </label>
              <input type="number" name="discount_value" required min="1" className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Expiry Date (Optional)</label>
              <input type="datetime-local" name="expires_at" className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Max Redemptions (Optional)</label>
              <input type="number" name="max_redemptions" placeholder="e.g. 100" min="1" className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white" />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition">
            Create Coupon
          </button>
        </ActionForm>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">Active Campaigns</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-zinc-800/50 text-zinc-300">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Redemptions</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {initialCoupons.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-bold text-white">{c.code}</td>
                  <td className="px-4 py-3 capitalize">{c.discount_type.replace('_', ' ')} {c.plan_tier ? `(${c.plan_tier})` : ''}</td>
                  <td className="px-4 py-3">
                    {c.discount_type === 'free_credits' ? `${c.discount_value} Credits` : `${c.discount_value} Days`}
                  </td>
                  <td className="px-4 py-3">
                    {c.times_redeemed} {c.max_redemptions ? `/ ${c.max_redemptions}` : ' (Unlimited)'}
                  </td>
                  <td className="px-4 py-3">{c.expires_at ? format(new Date(c.expires_at), 'PP') : 'Never'}</td>
                  <td className="px-4 py-3">
                    {c.is_active ? (
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs font-medium">Active</span>
                    ) : (
                      <span className="px-2 py-1 bg-zinc-800 text-zinc-500 rounded text-xs font-medium">Disabled</span>
                    )}
                  </td>
                </tr>
              ))}
              {initialCoupons.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">No campaigns created yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
