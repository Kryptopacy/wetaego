'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createPromoCodeAction, togglePromoCodeAction, deletePromoCodeAction } from './actions'
import { formatCurrency } from '@/lib/utils/currency'
import { useAction } from 'next-safe-action/hooks'

export type PromoCode = {
  id: string
  location_id: string
  code: string
  discount_type: 'percentage' | 'flat'
  discount_value: number
  max_uses: number | null
  current_uses: number
  valid_until: string | null
  is_active: boolean
  created_at: string
}

export default function PromoCodesManager({
  promoCodes,
  orgId,
  locationId
}: {
  promoCodes: PromoCode[]
  orgId: string
  locationId: string
}) {
  const { executeAsync: createPromoCode, isExecuting: isCreating } = useAction(createPromoCodeAction)
  const { executeAsync: togglePromoCode } = useAction(togglePromoCodeAction)
  const { executeAsync: deletePromoCode } = useAction(deletePromoCodeAction)

  const handleCreatePromoCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    const code = fd.get('code') as string
    const discount_type = fd.get('discount_type') as 'percentage' | 'flat'
    const discount_valueStr = fd.get('discount_value') as string
    const max_usesStr = fd.get('max_uses') as string
    const valid_until = fd.get('valid_until') as string || null

    let discount_value = parseFloat(discount_valueStr)
    if (discount_type === 'flat') {
      discount_value = Math.round(discount_value * 100) // Convert to minor
    }

    const res = await createPromoCode({
      organization_id: orgId,
      location_id: locationId,
      code,
      discount_type,
      discount_value,
      max_uses: max_usesStr ? parseInt(max_usesStr, 10) : null,
      valid_until,
    })

    if (res?.serverError) toast.error(res.serverError)
    else {
      toast.success('Promo code created!')
      form.reset()
    }
  }

  return (
    <div className="space-y-8">
      {/* Create Promo Code Form */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Create New Promo Code</h2>
        <p className="text-sm text-zinc-500 mb-6">Create discount codes for your customers to use at checkout.</p>

        <form onSubmit={handleCreatePromoCode} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Promo Code</label>
              <input
                name="code"
                required
                placeholder="e.g., SUMMER20"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Valid Until (Optional)</label>
              <input
                type="datetime-local"
                name="valid_until"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Discount Type</label>
              <select
                name="discount_type"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₦)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Discount Value</label>
              <input
                name="discount_value"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="20"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Max Uses (Optional)</label>
              <input
                name="max_uses"
                type="number"
                min="1"
                placeholder="e.g. 100"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isCreating}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {isCreating ? 'Creating...' : 'Create Promo Code'}
            </button>
          </div>
        </form>
      </div>

      {/* Promo Codes List */}
      {promoCodes.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <div className="text-4xl mb-3">🎟️</div>
          <p className="font-medium">No promo codes yet</p>
          <p className="text-sm mt-1">Create your first discount code above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promoCodes.map(promo => {
            const isExpired = promo.valid_until && new Date(promo.valid_until) < new Date()
            const isMaxedOut = promo.max_uses !== null && promo.current_uses >= promo.max_uses
            const isInactive = !promo.is_active || isExpired || isMaxedOut

            return (
              <div key={promo.id} className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden ${isInactive ? 'opacity-70' : ''}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 tracking-tight">{promo.code}</h3>
                        {!promo.is_active ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold uppercase tracking-wider">Disabled</span>
                        ) : isExpired ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">Expired</span>
                        ) : isMaxedOut ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Fully Used</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">Active</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {promo.discount_type === 'percentage' 
                          ? `${promo.discount_value}% OFF` 
                          : `${formatCurrency(promo.discount_value)} OFF`}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <button
                        role="switch"
                        aria-checked={promo.is_active}
                        onClick={async () => {
                          await togglePromoCode({ promo_code_id: promo.id, is_active: !promo.is_active })
                          toast.success(`Promo code ${promo.is_active ? 'disabled' : 'enabled'}`)
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${promo.is_active ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${promo.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                    <div>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{promo.current_uses}</span>
                      {promo.max_uses !== null ? ` / ${promo.max_uses} uses` : ' uses'}
                    </div>
                    {promo.valid_until && (
                      <div>
                        Valid till: {new Date(promo.valid_until).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={async () => {
                        if (confirm(`Delete promo code "${promo.code}"?`)) {
                          await deletePromoCode({ promo_code_id: promo.id })
                          toast.success('Promo code deleted')
                        }
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
