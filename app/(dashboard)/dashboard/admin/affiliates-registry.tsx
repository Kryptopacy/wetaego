'use client'

import { format } from 'date-fns'
import { useAction } from 'next-safe-action/hooks'
import { payAffiliateEarnings } from './actions'
import { toast } from 'sonner'
import { useState } from 'react'

interface Affiliate {
  id: string
  referral_code: string
  status: string
  created_at: string
  paystack_recipient_code: string | null
  affiliate_earnings?: { amount_minor: number; status: string }[]
}

export function AffiliatesRegistry({ affiliates }: { affiliates: Affiliate[] }) {
  return (
    <div className="space-y-6">
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Affiliates Registry</h2>
          <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white">{affiliates?.length || 0} Affiliates</span>
        </div>
        <p className="text-sm text-zinc-400 mb-6">List of all registered affiliates.</p>
        
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-400 uppercase bg-zinc-800/50">
              <tr>
                <th className="px-6 py-4 font-medium">Referral Code</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium">Recipient Code</th>
                <th className="px-6 py-4 font-medium text-right">Pending Payout</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {affiliates && affiliates.length > 0 ? affiliates.map((a) => (
                <tr key={a.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-white">{a.referral_code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400">
                    {format(new Date(a.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-zinc-400">
                    {a.paystack_recipient_code || 'Pending Setup'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-medium text-white">
                      {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(
                        (a.affiliate_earnings?.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount_minor, 0) || 0) / 100
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <PayoutButton affiliateId={a.id} disabled={!a.paystack_recipient_code || (a.affiliate_earnings?.filter(e => e.status === 'pending').length || 0) === 0} />
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                    No affiliates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function PayoutButton({ affiliateId, disabled }: { affiliateId: string, disabled: boolean }) {
  const { execute, isExecuting } = useAction(payAffiliateEarnings, {
    onSuccess: (res) => {
      if (res.data?.success) toast.success(res.data.message)
    },
    onError: (err) => {
      toast.error(err.error.serverError || 'Failed to process payout')
    }
  })

  return (
    <button
      onClick={() => execute({ affiliate_id: affiliateId })}
      disabled={disabled || isExecuting}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${disabled ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-emerald-600/20 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
    >
      {isExecuting ? 'Processing...' : 'Pay Out'}
    </button>
  )
}
