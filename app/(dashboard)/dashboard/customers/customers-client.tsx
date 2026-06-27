'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils/currency'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

type CustomerProfile = Database['public']['Tables']['customer_profiles']['Row']

interface CustomersClientProps {
  organizationId: string
  initialProfiles: CustomerProfile[]
  currencyCode: string
}

export function CustomersClient({ organizationId, initialProfiles, currencyCode }: CustomersClientProps) {
  const [profiles, setProfiles] = useState<CustomerProfile[]>(initialProfiles)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialProfiles.length >= 50)
  const supabase = createClient()

  const loadMore = async () => {
    if (isLoading || !hasMore || profiles.length === 0) return
    setIsLoading(true)

    // Cursor pagination based on last_visit_at
    const lastProfile = profiles[profiles.length - 1]
    const lastVisitAt = lastProfile.last_visit_at

    try {
      let query = supabase
        .from('customer_profiles')
        .select('*')
        .eq('organization_id', organizationId)
        .order('last_visit_at', { ascending: false })
        .limit(50)

      if (lastVisitAt) {
         // Use strictly less than to avoid duplicating the cursor row.
         // (If multiple customers have the exact same millisecond timestamp, 
         // a true cursor approach would use (last_visit_at, id), but this is acceptable for now).
         query = query.lt('last_visit_at', lastVisitAt)
      } else {
         // Fallback offset if somehow last_visit_at is null
         query = query.range(profiles.length, profiles.length + 49)
      }

      const { data, error } = await query

      if (error) throw error

      if (data && data.length > 0) {
        setProfiles(prev => [...prev, ...data])
        if (data.length < 50) {
          setHasMore(false)
        }
      } else {
        setHasMore(false)
      }
    } catch (e) {
      console.error('Failed to load more customers:', e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Customer Directory</h2>
        <span className="text-xs text-zinc-500">Showing {profiles.length} profiles</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-zinc-800/50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-6 py-4 font-medium">Customer Email</th>
              <th className="px-6 py-4 font-medium">Orders</th>
              <th className="px-6 py-4 font-medium">Lifetime Value</th>
              <th className="px-6 py-4 font-medium">Loyalty Points</th>
              <th className="px-6 py-4 font-medium">Last Visit</th>
              <th className="px-6 py-4 font-medium text-right">Marketing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                  No customers found. Shadow profiles are built automatically when customers checkout.
                </td>
              </tr>
            ) : (
              profiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-200">{profile.email}</td>
                  <td className="px-6 py-4">{profile.total_orders}</td>
                  <td className="px-6 py-4 font-medium text-emerald-400">
                    {formatCurrency(profile.total_spend_minor || 0, currencyCode)}
                  </td>
                  <td className="px-6 py-4 font-bold text-blue-400">{profile.loyalty_points || 0}</td>
                  <td className="px-6 py-4">
                    {profile.last_visit_at ? new Date(profile.last_visit_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {profile.marketing_opt_in ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                        Opted In
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-zinc-500/10 px-2 py-1 text-xs font-medium text-zinc-400 ring-1 ring-inset ring-zinc-500/20">
                        Unsubscribed
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {hasMore && (
          <div className="p-4 border-t border-zinc-800 flex justify-center">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-zinc-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                'Load More Customers'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
