import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeft, Mail, Phone, Building, ExternalLink, Receipt, Check, Copy } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { QuoteActions } from './quote-actions'

export default async function QuoteDetailsPage({
  params,
}: {
  params: Promise<{ quoteId: string }>
}) {
  const { quoteId } = await params
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData?.user) {
    redirect('/login')
  }

  // Get user's org
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userData.user.id)
    .single()

  if (!member) redirect('/dashboard')

  // Fetch the quote
  const { data: quote } = await supabase
    .from('page_bookings')
    .select(`
      *,
      location_pages!inner(id, title, template_type, template_data, slug, locations!inner(slug, organization_id)),
      page_items(title, price_minor)
    `)
    .eq('id', quoteId)
    .single()

  if (!quote || quote.location_pages.locations.organization_id !== member.organization_id) {
    notFound()
  }

  const isQuoteTemplate = quote.location_pages.template_type === 'quote'
  
  let parsedQuoteData = null
  if (isQuoteTemplate && quote.booking_notes) {
    try {
      parsedQuoteData = JSON.parse(quote.booking_notes)
    } catch (e) {
      // Not JSON, ignore
    }
  }

  const locationSlug = quote.location_pages.locations.slug

  return (
    <div className="max-w-4xl space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/quotes" className="p-2 hover:bg-white/5 rounded-full text-zinc-400 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Quote Request</h1>
          <p className="text-sm text-zinc-400 mt-1">Ref: {quote.id.split('-')[0].toUpperCase()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Project Details Panel */}
          {parsedQuoteData ? (
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-4">Project Details</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-zinc-500 mb-1">Project Name</h3>
                  <p className="text-white text-lg">{parsedQuoteData.projectName}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 mb-1">Target Deadline</h3>
                    <p className="text-white">{parsedQuoteData.deadline ? format(new Date(parsedQuoteData.deadline), 'MMM d, yyyy') : 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 mb-1">Budget Range</h3>
                    <p className="text-white capitalize">{parsedQuoteData.budgetRange?.replace(/_/g, ' ') || 'Not specified'}</p>
                  </div>
                </div>

                {parsedQuoteData.brief && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 mb-1">Brief & Notes</h3>
                    <div className="bg-white/5 rounded-xl p-4 text-zinc-300 text-sm whitespace-pre-wrap">
                      {parsedQuoteData.brief}
                    </div>
                  </div>
                )}
                
                {parsedQuoteData.lineItems && parsedQuoteData.lineItems.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 mb-3 mt-6">Requested Services</h3>
                    <div className="border border-white/5 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-4 py-2 font-medium text-zinc-400">Service</th>
                            <th className="px-4 py-2 font-medium text-zinc-400 text-right">Qty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {parsedQuoteData.lineItems.map((item: { title: string; qty: number }, idx: number) => (
                            <tr key={idx}>
                              <td className="px-4 py-3 text-white">{item.title}</td>
                              <td className="px-4 py-3 text-white text-right">{item.qty}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-4">Inquiry Message</h2>
              <div className="bg-white/5 rounded-xl p-4 text-zinc-300 text-sm whitespace-pre-wrap">
                {quote.booking_notes || 'No message provided.'}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Customer & Actions */}
        <div className="space-y-6">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4">Customer Info</h2>
            <div className="space-y-4">
              <div>
                <p className="text-white font-medium">{quote.customer_name}</p>
                {parsedQuoteData?.companyName && (
                  <p className="text-sm text-zinc-400 flex items-center gap-2 mt-1">
                    <Building className="w-4 h-4" /> {parsedQuoteData.companyName}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {quote.customer_email && (
                  <a href={`mailto:${quote.customer_email}`} className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors">
                    <Mail className="w-4 h-4" /> {quote.customer_email}
                  </a>
                )}
                {quote.customer_phone && (
                  <a href={`https://wa.me/${quote.customer_phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors">
                    <Phone className="w-4 h-4" /> {quote.customer_phone}
                  </a>
                )}
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-xs text-zinc-500">Received: {format(new Date(quote.created_at), 'MMM d, yyyy h:mm a')}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4">Status & Actions</h2>
            <QuoteActions 
              quoteId={quote.id} 
              currentStatus={quote.status} 
              locationSlug={locationSlug} 
              // @ts-expect-error JSONB
              milestonesEnabled={quote.location_pages.template_data?.milestones_enabled}
              bookingNotes={quote.booking_notes || ''}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
