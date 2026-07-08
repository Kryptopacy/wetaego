import { createAnonClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { format, isPast } from 'date-fns'
import { revalidatePath } from 'next/cache'
import { QuoteNegotiateClient } from './quote-negotiate-client'

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ slug: string; quoteId: string }>
}) {
  const { slug, quoteId } = await params
  const supabase = createAnonClient()

  const { data: quote } = await supabase
    .from('page_bookings')
    .select(`
      *,
      location_pages!inner(
        id, title, billing_enabled, template_data,
        locations!inner(id, name, slug, theme_color, cover_image_url, currency, organization_id, organizations(logo_url))
      ),
      page_items(title, price_minor)
    `)
    .eq('id', quoteId)
    .single()

  if (!quote) notFound()

  const location = (quote.location_pages as unknown as { locations: unknown }).locations as {
    id: string; name: string; slug: string; theme_color?: string;
    cover_image_url?: string; currency?: string; organization_id: string;
    organizations?: { logo_url?: string } | null
  }

  if (location.slug !== slug) notFound()

  const themeColor = location.theme_color || '#7c3aed'
  const currency = location.currency || 'NGN'
  const logoUrl = location.organizations?.logo_url
  const page = quote.location_pages as unknown as { id: string, title: string, billing_enabled?: boolean, template_data?: { refund_policy?: string } }

  let parsedNotes: {
    lineItems?: { title: string; qty: number; unit_price_minor?: number }[]
    projectName?: string; deadline?: string; budgetRange?: string; brief?: string
    customerName?: string; changeRequests?: { message: string; createdAt: string }[]
    expiresAt?: string; lockedAt?: string; milestones?: unknown[]
  } = {}

  try {
    if (quote.booking_notes) parsedNotes = JSON.parse(quote.booking_notes)
  } catch (_) {}

  const isExpired = parsedNotes.expiresAt ? isPast(new Date(parsedNotes.expiresAt)) : false
  const isLocked = !!parsedNotes.lockedAt || quote.status === 'confirmed' || quote.payment_status === 'fully_paid'

  const lineItems = (parsedNotes.lineItems ?? []).map(item => ({
    title: item.title,
    qty: item.qty,
    unit_price_minor: item.unit_price_minor ?? 0,
  }))

  const hasProposal = lineItems.some(i => i.unit_price_minor > 0)

  async function handleRequestChanges(message: string) {
    'use server'
    const sb = createAnonClient()
    const { data: current } = await sb.from('page_bookings').select('booking_notes').eq('id', quoteId).single()
    let notes: typeof parsedNotes = {}
    try { if (current?.booking_notes) notes = JSON.parse(current.booking_notes) } catch (_) {}
    if (!Array.isArray(notes.changeRequests)) notes.changeRequests = []
    notes.changeRequests!.push({ message, createdAt: new Date().toISOString() })
    await sb.from('page_bookings').update({ booking_notes: JSON.stringify(notes), status: 'pending' }).eq('id', quoteId)
    revalidatePath(`/m/${slug}/q/${quoteId}`)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans pb-16">
      {/* Hero */}
      <div className="relative w-full h-[28vh] min-h-[180px] max-h-[280px] overflow-hidden">
        {location.cover_image_url ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${location.cover_image_url})` }} />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${themeColor}30 0%, #0a0a0f 100%)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-3xl mx-auto">
          {logoUrl && <Image src={logoUrl} alt="Logo" width={100} height={40} className="h-10 w-auto object-contain mb-3 drop-shadow-lg" />}
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-lg">
            Your Proposal from {location.name}
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Meta Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Reference</p>
            <p className="text-white font-mono font-bold">{quoteId.split('-')[0].toUpperCase()}</p>
          </div>
          <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Project</p>
            <p className="text-white font-medium text-sm truncate">{parsedNotes.projectName || '—'}</p>
          </div>
          <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Issued</p>
            <p className="text-white font-medium text-sm">{format(new Date(quote.created_at), 'dd MMM yyyy')}</p>
          </div>
          <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Valid Until</p>
            <p className={`font-medium text-sm ${isExpired ? 'text-red-400' : 'text-white'}`}>
              {parsedNotes.expiresAt ? format(new Date(parsedNotes.expiresAt), 'dd MMM yyyy') : 'No expiry'}
            </p>
          </div>
        </div>

        {/* Change Request History */}
        {(parsedNotes.changeRequests ?? []).length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 space-y-3">
            <h3 className="text-amber-400 font-semibold text-sm">Change Requests Submitted</h3>
            {parsedNotes.changeRequests!.map((cr, i) => (
              <div key={i} className="text-zinc-300 text-sm border-t border-white/5 pt-3 first:border-0 first:pt-0">
                <p className="text-xs text-zinc-500 mb-1">{format(new Date(cr.createdAt), 'dd MMM, h:mm a')}</p>
                <p>&ldquo;{cr.message}&rdquo;</p>
              </div>
            ))}
          </div>
        )}

        {/* Proposal (if priced) vs Awaiting Proposal (if not yet priced) */}
        {hasProposal ? (
          <QuoteNegotiateClient
            quoteId={quoteId}
            pageId={page.id}
            lineItems={lineItems}
            currency={currency}
            themeColor={themeColor}
            businessName={location.name}
            isLocked={isLocked}
            isExpired={isExpired}
            paymentEnabled={!!page.billing_enabled}
            paymentIsLive={!!process.env.PAYSTACK_SECRET_KEY}
            onRequestChanges={handleRequestChanges}
          />
        ) : (
          <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-8 text-center space-y-3">
            <div className="text-4xl">⏳</div>
            <h3 className="text-white font-bold">Proposal Being Prepared</h3>
            <p className="text-zinc-400 text-sm max-w-sm mx-auto">
              {location.name} is currently reviewing your request and preparing a custom proposal. You will be notified once it&apos;s ready.
            </p>
            {parsedNotes.projectName && (
              <p className="text-zinc-600 text-xs">Project: {parsedNotes.projectName}</p>
            )}
          </div>
        )}

        {/* Cancellation Policy */}
        {page.template_data?.refund_policy && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <h4 className="text-xs font-bold text-red-400 mb-1 uppercase tracking-wider">Cancellation Policy</h4>
            <p className="text-sm text-red-200/80 leading-relaxed">{page.template_data.refund_policy}</p>
          </div>
        )}

        <div className="text-center pt-2">
          <Link href={`/m/${slug}`} className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors">
            Powered by OurMenu OS
          </Link>
        </div>
      </div>
    </div>
  )
}
