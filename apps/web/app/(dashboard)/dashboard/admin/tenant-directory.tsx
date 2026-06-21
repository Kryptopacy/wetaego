'use client'



import { useState } from 'react'
import { motion } from 'framer-motion'
import { MoreHorizontal, ShieldAlert, CreditCard } from 'lucide-react'
import { overrideTenantPlan } from './actions'
import { useRouter } from 'next/navigation'

export function TenantDirectory({ organizations }: { organizations: any[] }) {
  const [editingOrg, setEditingOrg] = useState<any | null>(null)
  const router = useRouter()

  const handleOverride = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    await overrideTenantPlan(formData)
    setEditingOrg(null)
    router.refresh()
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="text-xs uppercase bg-zinc-800/50 text-zinc-500">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Organization</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Credits</th>
              <th className="px-4 py-3 rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org) => (
              <tr key={org.id} className="border-b border-zinc-800/50 hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-medium text-white">{org.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    org.subscription_plan === 'enterprise' ? 'bg-purple-500/20 text-purple-400' :
                    org.subscription_plan === 'pro' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-zinc-500/20 text-zinc-400'
                  }`}>
                    {org.subscription_plan || 'lite'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1.5 ${
                    org.subscription_status === 'active' ? 'text-emerald-400' :
                    org.subscription_status === 'past_due' ? 'text-amber-400' :
                    'text-rose-400'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${org.subscription_status === 'active' ? 'bg-emerald-400' : org.subscription_status === 'past_due' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                    {org.subscription_status || 'active'}
                  </span>
                </td>
                <td className="px-4 py-3">{org.purchased_credits || 0}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setEditingOrg(org)} className="p-1 hover:bg-white/10 rounded transition text-zinc-400 hover:text-white">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Override Tenant</h3>
                <p className="text-xs text-zinc-400">Force modify {editingOrg.name}</p>
              </div>
            </div>

            <form onSubmit={handleOverride} className="space-y-4">
              <input type="hidden" name="org_id" value={editingOrg.id} />
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Subscription Plan</label>
                <select name="subscription_plan" defaultValue={editingOrg.subscription_plan || 'lite'} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white outline-none focus:border-blue-500">
                  <option value="lite">Lite</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Subscription Status</label>
                <select name="subscription_status" defaultValue={editingOrg.subscription_status || 'active'} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white outline-none focus:border-blue-500">
                  <option value="active">Active</option>
                  <option value="trialing">Trialing</option>
                  <option value="past_due">Past Due (Grace Period)</option>
                  <option value="canceled">Canceled (Suspended)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Inject Credits</label>
                <input type="number" name="purchased_credits" defaultValue={editingOrg.purchased_credits || 0} className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white outline-none focus:border-blue-500" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button type="button" onClick={() => setEditingOrg(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-bold transition shadow-lg shadow-rose-900/20">Force Override</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </>
  )
}
