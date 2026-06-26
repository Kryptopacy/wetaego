'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, RefreshCw, Link as LinkIcon, Copy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function QuoteActions({ 
  quoteId, 
  currentStatus,
  locationSlug,
  milestonesEnabled,
  bookingNotes
}: { 
  quoteId: string
  currentStatus: string
  locationSlug: string
  milestonesEnabled?: boolean
  bookingNotes?: string
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()
  
  // Parse existing milestones
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
            {currentStatus === 'pending' ? 'Needs Reply' : currentStatus === 'confirmed' ? 'Replied / Active' : 'Archived'}
          </span>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={() => updateStatus('confirmed')}
            disabled={isPending || currentStatus === 'confirmed'}
            className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> Reply Sent
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
              title="Mark as unread / pending"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

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
