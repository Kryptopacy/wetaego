'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils/currency'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'
import { Skeleton } from '@/components/ui/skeleton'
import { StaggeredList } from '@/components/StaggeredList'
import { CustomerIouDialog } from './customer-iou-dialog'
import { CustomerImportWizard } from './customer-import-wizard'
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
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null)
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
      <div className="p-6 border-b border-zinc-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-lg font-semibold text-white">Customer Directory</h2>
        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-500">Showing {profiles.length} profiles</span>
          <CustomerImportWizard organizationId={organizationId} />
        </div>
      </div>
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-zinc-800/50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-6 py-4 font-medium">Customer Email</th>
              <th className="px-6 py-4 font-medium">Phone Number</th>
              <th className="px-6 py-4 font-medium">Orders</th>
              <th className="px-6 py-4 font-medium">LTV</th>
              <th className="px-6 py-4 font-medium">IOU Balance</th>
              <th className="px-6 py-4 font-medium">IOU Limit</th>
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
                <tr 
                  key={profile.id} 
                  className="hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedCustomer(profile)}
                >
                  <td className="px-6 py-4 font-medium text-zinc-200">{profile.email}</td>
                  <td className="px-6 py-4 text-zinc-400">{profile.phone_number || '—'}</td>
                  <td className="px-6 py-4">{profile.total_orders}</td>
                  <td className="px-6 py-4 font-medium text-emerald-400">
                    {formatCurrency(profile.total_spend_minor || 0, currencyCode)}
                  </td>
                  <td className={`px-6 py-4 font-bold ${(profile.credit_balance_minor || 0) > 0 ? 'text-rose-500' : 'text-zinc-500'}`}>
                    {formatCurrency(profile.credit_balance_minor || 0, currencyCode)}
                  </td>
                  <td className="px-6 py-4 text-zinc-300">
                    {profile.is_iou_approved ? formatCurrency(profile.credit_limit_minor || 0, currencyCode) : 'Not Approved'}
                  </td>
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
      </div>

      {/* Mobile Cards View */}
      <StaggeredList className="sm:hidden divide-y divide-zinc-800">
        {profiles.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">
            No customers found. Shadow profiles are built automatically when customers checkout.
          </div>
        ) : (
          profiles.map((profile) => (
            <div 
              key={profile.id} 
              className="p-4 flex flex-col gap-3 hover:bg-zinc-800/50 transition-colors cursor-pointer"
              onClick={() => setSelectedCustomer(profile)}
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-medium text-zinc-200">{profile.email}</span>
                  {profile.phone_number && <span className="text-xs text-zinc-500">{profile.phone_number}</span>}
                </div>
                {profile.marketing_opt_in ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                    Opted In
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-zinc-500/10 px-2 py-1 text-[10px] font-medium text-zinc-400 ring-1 ring-inset ring-zinc-500/20">
                    Unsubscribed
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Orders</div>
                  <div className="text-zinc-300">{profile.total_orders}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Lifetime Value</div>
                  <div className="font-medium text-emerald-400">
                    {formatCurrency(profile.total_spend_minor || 0, currencyCode)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">IOU Balance</div>
                  <div className={`font-bold ${(profile.credit_balance_minor || 0) > 0 ? 'text-rose-500' : 'text-zinc-400'}`}>
                    {formatCurrency(profile.credit_balance_minor || 0, currencyCode)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Last Visit</div>
                  <div className="text-zinc-300">
                    {profile.last_visit_at ? new Date(profile.last_visit_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </StaggeredList>
      
      {hasMore && (
        <div className="p-4 border-t border-zinc-800 flex justify-center">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                Loading more...
              </div>
            ) : (
              'Load More Customers'
            )}
          </button>
        </div>
      )}

      {/* Skeletons to show while loading more */}
      {isLoading && (
        <div className="divide-y divide-zinc-800 border-t border-zinc-800">
          {[...Array(3)].map((_, i) => (
            <div key={`skeleton-${i}`} className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                <div>
                  <Skeleton className="h-3 w-12 mb-2" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <div>
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div>
                  <Skeleton className="h-3 w-24 mb-2" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div>
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <CustomerIouDialog
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
        organizationId={organizationId}
        currencyCode={currencyCode}
        onUpdate={(updated) => {
          setProfiles(prev => prev.map(p => p.id === updated.id ? updated : p))
          setSelectedCustomer(updated)
        }}
      />
    </div>
  )
}
