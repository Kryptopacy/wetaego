'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createDealAction, toggleDealAction, deleteDealAction, addDealItemAction, removeDealItemAction } from './actions'
import { formatCurrency } from '@/lib/utils/currency'
import { useAction } from 'next-safe-action/hooks'
import { Database } from '@/lib/supabase/types'

type DealType = Database['public']['Enums']['deal_type']
type MenuItem = { id: string; name: string; price_minor: number }
type DealItem = {
  id: string
  deal_id: string
  menu_item_id: string
  deal_price_minor: number
  quantity_limit: number | null
  quantity_sold: number
  menu_items: { id: string; name: string; price_minor: number; image_url: string | null } | null
}
type Deal = {
  id: string
  name: string
  description: string | null
  type: DealType
  is_active: boolean
  start_time: string | null
  end_time: string | null
  created_at: string
  deal_items: DealItem[]
}

export default function DealsManager({ deals, menuItems, orgId, locationId }: {
  deals: Deal[]
  menuItems: MenuItem[]
  orgId: string
  locationId: string
}) {
  const [newDealType, setNewDealType] = useState<DealType>('manual')
  const { executeAsync: createDeal, isExecuting: isCreating } = useAction(createDealAction)
  const { executeAsync: toggleDeal } = useAction(toggleDealAction)
  const { executeAsync: deleteDeal } = useAction(deleteDealAction)
  const { executeAsync: addDealItem } = useAction(addDealItemAction)
  const { executeAsync: removeDealItem } = useAction(removeDealItemAction)

  const handleCreateDeal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    const res = await createDeal({
      organization_id: orgId,
      location_id: locationId,
      name: fd.get('name') as string,
      description: (fd.get('description') as string) || undefined,
      type: newDealType,
      is_active: false,
      start_time: (fd.get('start_time') as string) || null,
      end_time: (fd.get('end_time') as string) || null,
    })
    if (res?.serverError) toast.error(res.serverError)
    else {
      toast.success('Deal created!')
      form.reset()
    }
  }

  return (
    <div className="space-y-8">
      {/* Create Deal Form */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Create New Deal</h2>
        <p className="text-sm text-zinc-500 mb-6">Start a new campaign or flash sale for this location.</p>

        <form onSubmit={handleCreateDeal} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Deal Name</label>
              <input
                name="name"
                required
                placeholder="e.g., Happy Hour, Weekend Clearance"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Deal Type</label>
              <select
                value={newDealType}
                onChange={(e) => setNewDealType(e.target.value as DealType)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="manual">Manual (On/Off Toggle)</option>
                <option value="time_based">Time Based (Auto-expires)</option>
                <option value="quantity_based">Quantity Based (Disappears when sold out)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Tagline (Optional)</label>
            <input
              name="description"
              placeholder="A short catchphrase for this deal..."
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {newDealType === 'time_based' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Start Time</label>
                <input
                  type="datetime-local"
                  name="start_time"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">End Time</label>
                <input
                  type="datetime-local"
                  name="end_time"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isCreating}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {isCreating ? 'Creating...' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>

      {/* Deals List */}
      {deals.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <div className="text-4xl mb-3">🏷️</div>
          <p className="font-medium">No deals yet</p>
          <p className="text-sm mt-1">Create your first deal above to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {deals.map(deal => {
            const isFullySoldOut = deal.type === 'quantity_based' && 
              deal.deal_items.length > 0 &&
              deal.deal_items.every(di => di.quantity_limit !== null && di.quantity_sold >= (di.quantity_limit ?? 0))

            return (
              <div key={deal.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                {/* Deal Header */}
                <div className="flex items-start justify-between p-5 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{deal.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                        {deal.type.replace('_', ' ')}
                      </span>
                      {isFullySoldOut && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                          Sold Out
                        </span>
                      )}
                    </div>
                    {deal.description && (
                      <p className="text-sm text-zinc-500 mt-1">{deal.description}</p>
                    )}
                    {deal.type === 'time_based' && deal.start_time && deal.end_time && (
                      <p className="text-xs text-zinc-400 mt-1">
                        {new Date(deal.start_time).toLocaleString()} → {new Date(deal.end_time).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">{deal.is_active ? 'Active' : 'Inactive'}</span>
                      <button
                        role="switch"
                        aria-checked={deal.is_active}
                        onClick={async () => {
                          await toggleDeal({ deal_id: deal.id, is_active: !deal.is_active })
                          toast.success(`Deal ${deal.is_active ? 'deactivated' : 'activated'}`)
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${deal.is_active ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${deal.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm(`Delete deal "${deal.name}"? This cannot be undone.`)) {
                          await deleteDeal({ deal_id: deal.id })
                          toast.success('Deal deleted')
                        }
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Deal Items */}
                <div className="p-5">
                  <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">Items in this Deal</h4>
                  
                  {deal.deal_items.length === 0 ? (
                    <p className="text-sm text-zinc-400 mb-4">No items added yet. Add items below.</p>
                  ) : (
                    <ul className="space-y-3 mb-6">
                      {deal.deal_items.map((item) => {
                        const soldOut = item.quantity_limit !== null && item.quantity_sold >= item.quantity_limit
                        return (
                          <li key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                            <div className="flex items-center gap-3">
                              {item.menu_items?.image_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={item.menu_items.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                              )}
                              <div>
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.menu_items?.name}</p>
                                <p className="text-xs text-zinc-500">
                                  <span className="line-through mr-2">{formatCurrency(item.menu_items?.price_minor || 0)}</span>
                                  <span className={`font-semibold ${soldOut ? 'text-red-500' : 'text-emerald-600'}`}>
                                    {formatCurrency(item.deal_price_minor)}
                                    {soldOut && ' · Sold Out'}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {deal.type === 'quantity_based' && (
                                <div className="text-xs text-zinc-400 text-right">
                                  <div>Limit: {item.quantity_limit ?? '∞'}</div>
                                  <div>Sold: {item.quantity_sold}</div>
                                </div>
                              )}
                              <button
                                onClick={async () => {
                                  await removeDealItem({ deal_item_id: item.id })
                                  toast.success('Item removed')
                                }}
                                className="text-xs text-red-500 hover:text-red-700 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}

                  {/* Add Item Form */}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      const fd = new FormData(e.currentTarget)
                      const priceStr = fd.get('deal_price') as string
                      const priceMinor = Math.round(parseFloat(priceStr) * 100)
                      const limitStr = fd.get('quantity_limit') as string
                      const limit = limitStr ? parseInt(limitStr, 10) : undefined

                      const res = await addDealItem({
                        deal_id: deal.id,
                        menu_item_id: fd.get('menu_item_id') as string,
                        deal_price_minor: priceMinor,
                        quantity_limit: limit ?? null,
                      })
                      if (res?.serverError) toast.error(res.serverError)
                      else {
                        ;(e.target as HTMLFormElement).reset()
                        toast.success('Item added to deal')
                      }
                    }}
                    className="flex flex-wrap items-end gap-3 p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700"
                  >
                    <div className="flex-1 min-w-40 space-y-1.5">
                      <label className="text-xs font-medium text-zinc-500">Add Menu Item</label>
                      <select
                        name="menu_item_id"
                        required
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select item...</option>
                        {menuItems.map(mi => (
                          <option key={mi.id} value={mi.id}>
                            {mi.name} ({formatCurrency(mi.price_minor)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32 space-y-1.5">
                      <label className="text-xs font-medium text-zinc-500">Deal Price (₦)</label>
                      <input
                        name="deal_price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        required
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    {deal.type === 'quantity_based' && (
                      <div className="w-28 space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500">Qty Limit</label>
                        <input
                          name="quantity_limit"
                          type="number"
                          min="1"
                          placeholder="Max"
                          required
                          className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    )}
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-700 dark:hover:bg-zinc-600 text-white text-sm font-medium transition-colors"
                    >
                      + Add Item
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
