import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import PayClient from './pay-client'

interface Organization {
  name: string
  slug: string
}

interface Order {
  id: string
  status: string
  total_amount_minor: number
  amount_paid_minor: number | null
  table_identifier: string | null
  created_at: string
  organization_id: string
  location_id: string
  organizations: Organization | Organization[] | null
}

export default async function SharedPaymentPage({
  params,
  searchParams
}: {
  params: { order_id: string }
  searchParams: { split?: string }
}) {
  const supabase = await createClient()

  // Fetch the order
  const { data: orderRaw } = await supabase
    .from('orders')
    .select(`
      id, 
      status, 
      total_amount_minor, 
      amount_paid_minor, 
      table_identifier,
      created_at,
      organization_id,
      location_id,
      organizations(name, slug)
    `)
    .eq('id', params.order_id)
    .single()

  const order = orderRaw as unknown as Order

  if (!order) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="text-zinc-500">Order not found.</div>
      </div>
    )
  }

  const splitCount = parseInt(searchParams.split || '1')
  
  // handle array or single object for organizations
  const org = Array.isArray(order.organizations) ? order.organizations[0] : order.organizations
  const orgName = org?.name || 'Restaurant'
  const orgSlug = org?.slug || ''

  if (order.status === 'paid' || order.status === 'completed') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Fully Paid!</h1>
        <p className="text-zinc-400 max-w-sm mb-8">This bill has been completely settled. Thank you for dining with us!</p>
        <Link href={`/m/${orgSlug}`} className="px-6 py-3 bg-zinc-800 text-white rounded-xl font-medium hover:bg-zinc-700">
          Return to Menu
        </Link>
      </div>
    )
  }

  // Fetch order items for display
  const { data: items } = await supabase
    .from('order_items')
    .select('item_name, quantity, price_minor')
    .eq('order_id', order.id)

  return (
    <div className="min-h-screen bg-black font-sans pb-24">
      <div className="bg-zinc-900 border-b border-zinc-800 p-6 pt-12">
        <div className="max-w-md mx-auto">
          <p className="text-zinc-400 text-sm font-medium uppercase tracking-widest mb-1">Paying at</p>
          <h1 className="text-2xl font-black text-white truncate">{orgName}</h1>
          <div className="mt-4 flex items-center gap-2">
            <span className="px-2 py-1 bg-zinc-800 rounded text-xs font-mono text-zinc-300">Order #{order.id.split('-')[0]}</span>
            {order.table_identifier && (
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-bold">Table {order.table_identifier}</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
          <h2 className="text-zinc-400 text-sm font-bold uppercase tracking-wider mb-4">Order Summary</h2>
          <div className="space-y-3 mb-4 max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide">
            {items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div className="flex gap-3">
                  <span className="text-zinc-500 font-medium">{item.quantity}x</span>
                  <span className="text-white text-sm">{item.item_name}</span>
                </div>
                <span className="text-zinc-400 text-sm">₦{(item.price_minor / 100).toLocaleString()}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-zinc-800 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-zinc-400">
              <span>Total Bill</span>
              <span>₦{(order.total_amount_minor / 100).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-green-400 font-medium">
              <span>Amount Paid</span>
              <span>- ₦{((order.amount_paid_minor || 0) / 100).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg text-white font-black pt-2 border-t border-zinc-800">
              <span>Remaining</span>
              <span>₦{((order.total_amount_minor - (order.amount_paid_minor || 0)) / 100).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <PayClient 
          order={order}
          splitCount={splitCount}
        />
      </div>
    </div>
  )
}
