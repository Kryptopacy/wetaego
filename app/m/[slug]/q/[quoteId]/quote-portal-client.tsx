'use client'

import { useState } from 'react'
import { verifyQuotePin, getQuoteDetails } from './actions'
import { Lock, ArrowRight, Loader2 } from 'lucide-react'
import { QuoteNegotiateClient } from './quote-negotiate-client'

export function QuotePortalClient({ slug, quoteId }: { slug: string; quoteId: string }) {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [quoteData, setQuoteData] = useState<any>(null)

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!pin || pin.length < 4) return
    setLoading(true)
    setError('')
    
    try {
      // Because quoteId from the URL could be either a UUID or a reference number,
      // we just use getQuoteDetails (if UUID) or verifyQuotePin (if Ref).
      // Assuming quoteId in the URL is the Reference Number (e.g. QTE-XXX) based on our Track link.
      const verifyRes = await verifyQuotePin(quoteId, pin)
      if (!verifyRes.success || !verifyRes.quoteId) {
        setError(verifyRes.error || 'Invalid PIN or Quote')
        return
      }
      
      const res = await getQuoteDetails(verifyRes.quoteId, pin)
      if (res.success && res.data) {
        setQuoteData(res.data)
      } else {
        setError(res.error || 'Failed to fetch quote details')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (quoteData) {
    // Parse notes safely
    let parsedNotes: any = {}
    try {
      parsedNotes = JSON.parse(quoteData.booking_notes || '{}')
    } catch {}

    const lineItems = (parsedNotes.lineItems ?? []).map((item: any) => ({
      title: item.title,
      qty: item.qty,
      unit_price_minor: item.unit_price_minor ?? 0,
    }))

    return (
      <div className="w-full">
         <h1 className="text-2xl font-black text-white mb-6">Quote Negotiation Portal</h1>
         
         <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
            <h2 className="text-sm text-zinc-400 uppercase tracking-widest font-bold mb-4">Project Brief</h2>
            <p className="text-white whitespace-pre-wrap">{parsedNotes.brief || 'No brief provided.'}</p>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <p className="text-sm text-zinc-500">Budget Range</p>
                <p className="text-white font-medium">{parsedNotes.budgetRange || 'Unspecified'}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Deadline</p>
                <p className="text-white font-medium">{parsedNotes.deadline || 'Flexible'}</p>
              </div>
            </div>
         </div>

         {/* Render the negotiation UI */}
         <QuoteNegotiateClient
            quoteId={quoteData.id}
            pageId={quoteData.page_id}
            lineItems={lineItems}
            currency={quoteData.location_pages?.locations?.currency || 'NGN'}
            themeColor={quoteData.location_pages?.locations?.theme_color || '#3b82f6'}
            businessName={quoteData.location_pages?.locations?.name || 'Business'}
            isLocked={quoteData.status === 'confirmed'}
            isExpired={false}
            paymentEnabled={quoteData.location_pages?.billing_enabled}
            paymentIsLive={true}
            onRequestChanges={async (msg) => {
              // Stub for actual Request Changes API
              console.log("Requested changes:", msg)
            }}
         />
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto mt-20">
      <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <Lock className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-black text-white text-center mb-2">Secure Access</h1>
      <p className="text-zinc-400 text-center mb-8">
        Enter the 4-digit PIN sent to your email and WhatsApp to access quote {quoteId}.
      </p>

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <input
            type="text"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="• • • •"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-center text-3xl tracking-[1em] text-white focus:outline-none focus:border-emerald-500 transition-colors"
            required
          />
        </div>
        
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading || pin.length < 4}
          className="w-full bg-white text-zinc-950 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              Unlock Portal
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
