'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, RefreshCw, Link as LinkIcon, Copy, FileEdit, MessageSquare, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils/currency'

export function QuoteActions({ 
  quoteId, 
  currentStatus,
  locationSlug,
  milestonesEnabled,
  bookingNotes,
  currency = 'NGN'
}: { 
  quoteId: string
  currentStatus: string
  locationSlug: string
  milestonesEnabled?: boolean
  bookingNotes?: string
  currency?: string
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()
  
  // Parse existing data
  let initialMilestones: { id: string, name: string, percentage: number, status: 'unpaid' | 'paid' }[] = []
  let parsedNotes: any = {}
  try {
    if (bookingNotes) {
      parsedNotes = JSON.parse(bookingNotes)
      if (Array.isArray(parsedNotes.milestones)) {
        initialMilestones = parsedNotes.milestones
      }
    }
  } catch (e) {}

  const [milestones, setMilestones] = useState(initialMilestones)

  // Proposal Builder State
  const [showProposalEditor, setShowProposalEditor] = useState(false)
  const [expiryDate, setExpiryDate] = useState<string>(parsedNotes.expiresAt ? parsedNotes.expiresAt.substring(0, 10) : '')
  const [pricedItems, setPricedItems] = useState<{ title: string; qty: number; unit_price_minor: number }[]>(
    (parsedNotes.lineItems || []).map((item: any) => ({
      title: item.title,
      qty: item.qty || 1,
      unit_price_minor: item.unit_price_minor || 0,
    }))
  )
  const changeRequests: { message: string; createdAt: string }[] = parsedNotes.changeRequests || []
  
  const paymentLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ourmenuos.online'}/m/${locationSlug}/q/${quoteId}`

  const updateStatus = async (status: string) => {
    startTransition(async () => {
      const { error } = await supabase
        .from('page_bookings')
        .update({ status })
        .eq('id', quoteId)

      if (error) {
        toast.error('Failed to update status')
      } else {
        toast.success(`Quote marked as ${status}`)
        router.refresh()
      }
    })
  }

  const saveMilestones = async () => {
    if (milestones.length === 0) return

    const total = milestones.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0)
    if (total !== 100) {
      toast.error(`Milestones must total exactly 100% (currently ${total}%)`)
      return
    }

    startTransition(async () => {
      parsedNotes.milestones = milestones
      const { error } = await supabase
        .from('page_bookings')
        .update({ booking_notes: JSON.stringify(parsedNotes) })
        .eq('id', quoteId)

      if (error) {
        toast.error('Failed to save milestones')
      } else {
        toast.success('Milestones saved successfully')
        router.refresh()
      }
    })
  }

  const saveProposal = async () => {
    startTransition(async () => {
      const updatedNotes = {
        ...parsedNotes,
        lineItems: pricedItems,
        expiresAt: expiryDate ? new Date(expiryDate).toISOString() : undefined,
      }
      const totalMinor = pricedItems.reduce((sum, i) => sum + i.unit_price_minor * i.qty, 0)
      const { error } = await supabase
        .from('page_bookings')
        .update({
          booking_notes: JSON.stringify(updatedNotes),
          total_amount_minor: totalMinor,
          status: 'confirmed', // marks the quote as ready for the client
        })
        .eq('id', quoteId)

      if (error) {
        toast.error('Failed to save proposal')
      } else {
        toast.success('Proposal saved! The client can now view and accept it.')
        setShowProposalEditor(false)
        router.refresh()
      }
    })
  }

  const addMilestone = () => {
    setMilestones([...milestones, { id: Math.random().toString(36).substring(7), name: `Milestone ${milestones.length + 1}`, percentage: 0, status: 'unpaid' }])
  }

  const copyLink = () => {
    navigator.clipboard.writeText(paymentLink)
    toast.success('Payment link copied to clipboard')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Current Status:</span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full font-bold ${
            currentStatus === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
            currentStatus === 'cancelled' ? 'bg-zinc-500/20 text-zinc-400' :
            'bg-amber-500/20 text-amber-400'
          }`}>
            {currentStatus === 'pending' ? 'Awaiting Your Proposal' : currentStatus === 'confirmed' ? 'Proposal Sent' : 'Archived'}
          </span>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setShowProposalEditor(v => !v)}
            className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            <FileEdit className="w-4 h-4" /> Build Proposal
          </button>
          
          <button
            onClick={() => updateStatus('cancelled')}
            disabled={isPending || currentStatus === 'cancelled'}
            className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" /> Archive
          </button>
          
          {currentStatus !== 'pending' && (
            <button
              onClick={() => updateStatus('pending')}
              disabled={isPending}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors disabled:opacity-50"
              title="Mark as pending"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Proposal Builder */}
      {showProposalEditor && (
        <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-emerald-300">Build Proposal</h3>
          
          {pricedItems.length === 0 ? (
            <p className="text-xs text-zinc-500">No services were requested in this quote.</p>
          ) : (
            <div className="space-y-3">
              {pricedItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="flex-1 text-sm text-zinc-300 truncate">{item.title} <span className="text-zinc-600">(×{item.qty})</span></span>
                  <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2">
                    <span className="text-zinc-500 text-xs">₦</span>
                    <input
                      type="number"
                      value={item.unit_price_minor > 0 ? item.unit_price_minor / 100 : ''}
                      onChange={e => {
                        const newItems = [...pricedItems]
                        newItems[idx].unit_price_minor = Math.round(Number(e.target.value) * 100)
                        setPricedItems(newItems)
                      }}
                      className="w-24 bg-transparent text-sm text-white outline-none text-right"
                      placeholder="Unit price"
                      min="0"
                    />
                  </div>
                </div>
              ))}
              <div className="flex justify-end text-sm border-t border-white/5 pt-3">
                <span className="text-zinc-400 mr-2">Total:</span>
                <span className="text-white font-bold">
                  {formatCurrency(pricedItems.reduce((s, i) => s + i.unit_price_minor * i.qty, 0), currency)}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-zinc-500 font-medium block mb-1">Proposal Expiry Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-white text-sm rounded-xl px-4 py-2.5 focus:border-emerald-500 outline-none w-full"
            />
          </div>

          <button
            onClick={saveProposal}
            disabled={isPending || pricedItems.length === 0}
            className="w-full py-3 rounded-xl font-bold text-white text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Saving…' : 'Save & Send Proposal to Client'}
          </button>
        </div>
      )}

      {/* Change Requests from Client */}
      {changeRequests.length > 0 && (
        <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <MessageSquare className="w-4 h-4" />
            <h3 className="text-sm font-bold">Client Change Requests</h3>
          </div>
          {changeRequests.map((cr, i) => (
            <div key={i} className="text-zinc-300 text-sm border-t border-white/5 pt-3 first:border-0 first:pt-0">
              <p className="text-xs text-zinc-500 mb-1">{new Date(cr.createdAt).toLocaleString()}</p>
              <p>&ldquo;{cr.message}&rdquo;</p>
            </div>
          ))}
        </div>
      )}

      {milestonesEnabled && (
        <div className="pt-6 border-t border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Milestone Billing</h3>
              <p className="text-xs text-zinc-400">Split this quote into multiple payments.</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {milestones.map((milestone, idx) => (
              <div key={milestone.id} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2 rounded-lg">
                <input 
                  type="text" 
                  value={milestone.name}
                  onChange={(e) => {
                    const newMilestones = [...milestones]
                    newMilestones[idx].name = e.target.value
                    setMilestones(newMilestones)
                  }}
                  className="flex-1 bg-transparent text-sm text-white px-2 py-1 outline-none min-w-0"
                  placeholder="Milestone Name"
                />
                <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded">
                  <input 
                    type="number" 
                    value={milestone.percentage}
                    onChange={(e) => {
                      const newMilestones = [...milestones]
                      newMilestones[idx].percentage = Number(e.target.value) || 0
                      setMilestones(newMilestones)
                    }}
                    className="w-12 bg-transparent text-sm text-white text-right outline-none appearance-none"
                    placeholder="0"
                    min="1"
                    max="100"
                  />
                  <span className="text-zinc-500 text-sm">%</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMilestones(milestones.filter(m => m.id !== milestone.id))
                  }}
                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={addMilestone}
              type="button"
              className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium text-sm transition-colors"
            >
              + Add Milestone
            </button>
            <button
              onClick={saveMilestones}
              disabled={isPending || milestones.length === 0}
              type="button"
              className="flex-1 py-2 bg-emerald-500 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
            >
              Save Milestones
            </button>
          </div>
        </div>
      )}

      <div className="pt-6 border-t border-white/5 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-white mb-1">Public Quote Link</h3>
          <p className="text-xs text-zinc-400">Share this link with the customer so they can view the finalized quote and make payment.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-zinc-500 truncate flex items-center gap-2">
            <LinkIcon className="w-3 h-3 shrink-0" />
            {paymentLink}
          </div>
          <button 
            onClick={copyLink}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-300 transition-colors shrink-0"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
