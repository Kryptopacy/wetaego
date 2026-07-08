import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatCurrency } from '@/lib/utils/currency'
import { MapPin, Phone, CheckCircle2, Navigation } from 'lucide-react'

export const metadata = {
  title: 'Dispatch Details | OurMenu OS',
  robots: { index: false, follow: false }
}

export default async function DispatchViewPage({
  params
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const supabase = await createClient()

  // We use the admin/service role client since the dispatch rider may not be authenticated
  // and we don't have RLS set up for anonymous order access by ID. 
  // However, this page is obscured by the long UUID, acting as a token.
  // We should actually just use the anon client and ensure we have an RPC or allow select by ID if they have the ID.
  // Wait, RLS on 'orders' might block anonymous selects. Let's use service_role client or a secure RPC.
  // For security, an order ID is a UUID v4 so it's unguessable.
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id, item_name, quantity, metadata
      ),
      locations(name, phone_number, address)
    `)
    .eq('id', orderId)
    .single()

  if (error || !order || order.fulfillment_type !== 'delivery') {
    return notFound()
  }

  const isDelivered = order.status === 'completed'
  const isCancelled = order.status === 'cancelled' || order.status === 'voided'
  const isPaid = order.status !== 'pending' && order.status !== 'cancelled' && order.status !== 'voided'

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* Header */}
      <div className="bg-emerald-600 text-white p-6 rounded-b-3xl shadow-md">
        <h1 className="text-xl font-black tracking-tight mb-1">Dispatch Details</h1>
        <p className="text-emerald-100 text-sm">Order #{order.id.split('-')[0].toUpperCase()}</p>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {isDelivered && (
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm">
              <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
            </span>
          )}
          {isCancelled && (
            <span className="bg-red-500/80 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm">
              Cancelled
            </span>
          )}
          {!isPaid && !isCancelled && !isDelivered && (
            <span className="bg-amber-500/80 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm">
              Collect Cash on Delivery: {formatCurrency(order.total_amount_minor)}
            </span>
          )}
          {isPaid && !isDelivered && (
            <span className="bg-emerald-800/50 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm">
              Paid Online - Handover Only
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto mt-2">
        {/* Customer Details */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Customer Info</h2>
          <div className="font-bold text-lg text-zinc-900 mb-1">{order.customer_name}</div>
          
          <div className="flex gap-3 mt-4">
            <a 
              href={`tel:${order.customer_phone}`}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-3 rounded-xl font-bold transition-colors active:bg-emerald-100"
            >
              <Phone className="w-4 h-4" />
              Call Customer
            </a>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Delivery Location</h2>
          <div className="flex items-start gap-3">
            <div className="mt-1 bg-zinc-100 p-2 rounded-full text-zinc-600">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-zinc-900 font-medium whitespace-pre-wrap leading-relaxed">
                {order.table_identifier}
              </p>
              {order.delivery_instructions && (
                <p className="text-sm text-amber-600 mt-2 bg-amber-50 px-3 py-2 rounded-lg font-medium border border-amber-100">
                  <span className="font-bold uppercase text-[10px] tracking-wider block mb-0.5">Instructions</span>
                  {order.delivery_instructions}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 mt-4">
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.table_identifier || '')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-3 rounded-xl font-bold transition-colors active:bg-blue-100"
            >
              <Navigation className="w-4 h-4" />
              Get Directions
            </a>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Order Items</h2>
          <div className="space-y-3">
            {order.order_items?.map((item: { id: string; quantity: number; item_name: string; metadata?: unknown }) => (
              <div key={item.id} className="flex justify-between items-start gap-3 border-b border-zinc-50 pb-3 last:border-0 last:pb-0">
                <div className="flex gap-3">
                  <span className="bg-zinc-100 text-zinc-600 font-black h-7 w-7 rounded-lg flex items-center justify-center text-sm shrink-0">
                    {item.quantity}
                  </span>
                  <div>
                    <span className="font-bold text-zinc-900">{item.item_name}</span>
                    {typeof item.metadata === 'object' && item.metadata !== null && Object.keys(item.metadata).length > 0 && (
                      <div className="text-xs text-zinc-500 mt-1 space-y-0.5">
                        {Object.entries(item.metadata as Record<string, unknown>).map(([k, v]) => (
                          <div key={k} className="capitalize">{k.replace(/_/g, ' ')}: {String(v)}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Restaurant Contact */}
        <div className="text-center pt-4">
          <p className="text-sm text-zinc-500 mb-2">Need help? Contact the restaurant</p>
          <a href={`tel:${(order.locations as { phone_number?: string; name?: string } | null)?.phone_number}`} className="text-emerald-600 font-bold">
            Call {(order.locations as { phone_number?: string; name?: string } | null)?.name}
          </a>
        </div>
      </div>
    </div>
  )
}
