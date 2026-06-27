import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils/currency'
import { Lock, FileSignature } from 'lucide-react'
import { QuotePayment } from './quote-payment'

export default async function PublicQuotePage({
  params
}: {
  params: Promise<{ slug: string; quoteId: string }>
}) {
  const { slug, quoteId } = await params
  const supabase = await createClient()

  // Fetch location & quote
  const { data: quote } = await supabase
    .from('page_bookings')
    .select(`
      *,
      location_pages!inner(id, title, template_type, template_data, locations!inner(id, name, slug, theme_color, cover_image_url, currency_code, organization_id, organizations(logo_url))),
      page_items(title, price_minor)
    `)
    .eq('id', quoteId)
    .eq('location_pages.locations.slug', slug)
    .single()

  if (!quote) notFound()

  const location = quote.location_pages.locations
  const themeColor = location.theme_color || '#0f7b55'
  
  let parsedQuoteData = null
  if (quote.booking_notes) {
    try {
      parsedQuoteData = JSON.parse(quote.booking_notes)
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans pb-32">
      <div className="relative w-full h-[35vh] min-h-[260px] max-h-[380px] overflow-hidden">
        {location.cover_image_url ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${location.cover_image_url})` }} />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${themeColor}40 0%, #0a0a0f 100%)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-2xl mx-auto">
          {location.organizations?.logo_url && (
            <Image src={location.organizations.logo_url} alt="Logo" width={100} height={48} className="h-12 w-auto object-contain mb-3 drop-shadow-lg" />
          )}
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-lg">Your Quote Details</h1>
          <p className="text-white/70 text-sm mt-2 max-w-md leading-relaxed">{location.name}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-6 relative z-10 space-y-6">
        
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-zinc-500 font-medium uppercase tracking-wider mb-1">Reference</p>
              <p className="text-xl font-mono text-white">{quote.id.split('-')[0].toUpperCase()}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              quote.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
              quote.status === 'cancelled' ? 'bg-zinc-500/20 text-zinc-400' :
              'bg-amber-500/20 text-amber-400'
            }`}>
              {quote.status === 'pending' ? 'Processing' : quote.status === 'confirmed' ? 'Ready for Payment' : 'Archived'}
            </div>
          </div>

          {parsedQuoteData && (
            <div className="space-y-6">
              <div className="border-t border-zinc-800 pt-6">
                <h3 className="text-sm font-medium text-zinc-500 mb-2">Project Name</h3>
                <p className="text-lg text-white font-medium">{parsedQuoteData.projectName}</p>
              </div>

              {parsedQuoteData.lineItems && parsedQuoteData.lineItems.length > 0 && (
                <div className="border-t border-zinc-800 pt-6">
                  <h3 className="text-sm font-medium text-zinc-500 mb-3">Requested Services</h3>
                  <div className="bg-zinc-950/50 rounded-xl overflow-hidden border border-zinc-800">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-900/50">
                        <tr>
                          <th className="px-4 py-3 font-medium text-zinc-400">Service</th>
                          <th className="px-4 py-3 font-medium text-zinc-400 text-right">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {parsedQuoteData.lineItems.map((item: { title: string; qty: number }, idx: number) => (
                          <tr key={idx}>
                            <td className="px-4 py-4 text-white">{item.title}</td>
                            <td className="px-4 py-4 text-white text-right">{item.qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {parsedQuoteData.brief && (
                <div className="border-t border-zinc-800 pt-6">
                  <h3 className="text-sm font-medium text-zinc-500 mb-2">Your Brief</h3>
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{parsedQuoteData.brief}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {quote.status === 'confirmed' && (
          <QuotePayment 
            quoteId={quote.id}
            organizationId={location.organization_id}
            locationId={location.id}
            milestones={parsedQuoteData?.milestones || []}
            totalAmountMinor={quote.total_amount_minor || 0}
            customerName={quote.customer_name}
            customerEmail={quote.customer_email || undefined}
            customerPhone={quote.customer_phone || undefined}
            themeColor={themeColor}
            paymentStatus={quote.payment_status}
          />
        )}

        {/* @ts-expect-error JSONB typing */}
        {quote.location_pages.template_data?.refund_policy && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 mt-6">
            <h4 className="text-[12px] font-bold text-red-800 dark:text-red-400 mb-1 uppercase tracking-wider">Cancellation Policy</h4>
            {/* @ts-expect-error JSONB typing */}
            <p className="text-[13px] text-red-900/80 dark:text-red-200/80 leading-relaxed">{quote.location_pages.template_data.refund_policy}</p>
          </div>
        )}

      </div>
    </div>
  )
}
