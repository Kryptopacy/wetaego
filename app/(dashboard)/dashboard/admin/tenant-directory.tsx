'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
  
import { MoreHorizontal, ShieldAlert, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { overrideTenantPlan } from './actions'


export interface OrgTenant {
  id: string
  name: string
  slug: string
  subscription_plan?: string
  subscription_status?: string
  purchased_credits?: number
  created_at: string
  status?: string
  [key: string]: unknown
}

export function TenantDirectory({ organizations: initialOrgs }: { organizations: OrgTenant[] }) {
  const [organizations, setOrganizations] = useState<OrgTenant[]>(initialOrgs)
  const [editingOrg, setEditingOrg] = useState<OrgTenant | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  const fetchTenants = useCallback(async (searchQuery: string, pageNum: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/tenants?search=${encodeURIComponent(searchQuery)}&page=${pageNum}&pageSize=10`)
      if (res.ok) {
        const data = await res.json()
        setOrganizations(data.data)
        setTotalPages(data.totalPages)
      }
    } catch (err) {
      console.error('Failed to fetch tenants:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTenants(search, page)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, page, fetchTenants])

  const handleOverride = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    await overrideTenantPlan(formData)
    setEditingOrg(null)
    fetchTenants(search, page)
  }

  return (
    <>
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input 
          type="text" 
          placeholder="Search by business name or slug..." 
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="w-full pl-9 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white outline-none focus:border-blue-500"
        />
      </div>
      
      <div className="overflow-x-auto relative">
        {loading && (
          <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="text-xs uppercase bg-zinc-800/50 text-zinc-500">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Organization</th>
              <th className="px-4 py-3">Slug</th>
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
                <td className="px-4 py-3">{org.slug}</td>
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
                  <div className="mt-1">
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      org.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                      org.status === 'in_review' ? 'bg-amber-500/20 text-amber-400' :
                      org.status === 'suspended' ? 'bg-rose-500/20 text-rose-400' :
                      'bg-zinc-500/20 text-zinc-400'
                    }`}>
                      {org.status?.replace('_', ' ') || 'pending kyc'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">{org.purchased_credits || 0}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <a href={`/dashboard/admin/kyc/${org.id}`} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs rounded text-zinc-300 transition-colors">
                      Review KYC
                    </a>
                    <button onClick={() => setEditingOrg(org)} className="p-1 hover:bg-white/10 rounded transition text-zinc-400 hover:text-white">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {organizations.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  No tenants found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-zinc-400">
        <div>
          Page {page} of {Math.max(1, totalPages)}
        </div>
        <div className="flex items-center gap-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="p-1 rounded hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="p-1 rounded hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
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
