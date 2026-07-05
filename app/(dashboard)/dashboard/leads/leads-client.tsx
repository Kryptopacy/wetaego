'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { Phone, Mail, MessageCircle, ExternalLink, Building2, Tag } from 'lucide-react'

type Inquiry = {
  id: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  message: string | null
  status: string
  created_at: string
  page_items: { title: string } | null
  location_pages: { title: string }
}

const PIPELINE_STAGES = [
  { key: 'new', label: 'New Inquiry', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { key: 'contacted', label: 'Contacted', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { key: 'viewing', label: 'Viewing / Test Drive', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { key: 'offer', label: 'Offer Made', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { key: 'won', label: 'Won / Closed', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { key: 'lost', label: 'Lost', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
]

export function LeadsClient({ initialInquiries }: { initialInquiries: Inquiry[] }) {
  const [inquiries, setInquiries] = useState(initialInquiries)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  const filtered = filterStatus === 'all'
    ? inquiries
    : inquiries.filter(i => i.status === filterStatus)

  function handleStatusChange(inquiryId: string, newStatus: string) {
    startTransition(async () => {
      const { error } = await supabase
        .from('page_inquiries')
        .update({ status: newStatus })
        .eq('id', inquiryId)

      if (error) {
        toast.error('Failed to update lead status')
        return
      }

      setInquiries(prev => prev.map(i =>
        i.id === inquiryId ? { ...i, status: newStatus } : i
      ))
      toast.success(`Lead moved to "${PIPELINE_STAGES.find(s => s.key === newStatus)?.label}"`)
    })
  }

  const stageInfo = (status: string) => PIPELINE_STAGES.find(s => s.key === status) ?? PIPELINE_STAGES[0]

  return (
    <div className="space-y-6">
      {/* Pipeline Filter Bar */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            filterStatus === 'all'
              ? 'bg-white/10 text-white border-white/20'
              : 'text-zinc-500 border-white/5 hover:border-white/15 hover:text-zinc-300'
          }`}
        >
          All ({inquiries.length})
        </button>
        {PIPELINE_STAGES.map(stage => {
          const count = inquiries.filter(i => i.status === stage.key).length
          return (
            <button
              key={stage.key}
              onClick={() => setFilterStatus(stage.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                filterStatus === stage.key
                  ? stage.color
                  : 'text-zinc-500 border-white/5 hover:border-white/15 hover:text-zinc-300'
              }`}
            >
              {stage.label} {count > 0 && `(${count})`}
            </button>
          )
        })}
      </div>

      {/* Leads Table */}
      {filtered.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">🏡</div>
          <h3 className="text-white font-bold text-lg mb-1">No leads yet</h3>
          <p className="text-zinc-500 text-sm">
            {filterStatus === 'all'
              ? 'When customers enquire about your listings, they will appear here.'
              : `No leads in the "${stageInfo(filterStatus).label}" stage.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => {
            const stage = stageInfo(lead.status)
            const waMessage = `Hi ${lead.customer_name}, following up on your enquiry${lead.page_items?.title ? ` about "${lead.page_items.title}"` : ''}.`
            return (
              <div
                key={lead.id}
                className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Lead Identity */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-white font-semibold text-base">{lead.customer_name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${stage.color}`}>
                        {stage.label}
                      </span>
                    </div>

                    {lead.page_items?.title && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                        <Tag className="w-3 h-3" />
                        <span>{lead.page_items.title}</span>
                        <span className="text-zinc-700">·</span>
                        <span className="text-zinc-600">{lead.location_pages.title}</span>
                      </div>
                    )}

                    {lead.message && (
                      <p className="text-sm text-zinc-400 mt-2 line-clamp-2 max-w-xl">
                        &ldquo;{lead.message}&rdquo;
                      </p>
                    )}

                    <p className="text-xs text-zinc-600 mt-2">
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Contact Quick Actions */}
                    {lead.customer_phone && (
                      <a
                        href={`https://wa.me/${lead.customer_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMessage)}`}
                        target="_blank"
                        rel="noreferrer"
                        title="WhatsApp"
                        className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                    {lead.customer_phone && (
                      <a
                        href={`tel:${lead.customer_phone}`}
                        title="Call"
                        className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 hover:bg-zinc-700 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    {lead.customer_email && (
                      <a
                        href={`mailto:${lead.customer_email}`}
                        title="Email"
                        className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 hover:bg-zinc-700 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}

                    {/* Status Dropdown */}
                    <select
                      value={lead.status}
                      onChange={e => handleStatusChange(lead.id, e.target.value)}
                      disabled={isPending}
                      className="bg-zinc-900 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {PIPELINE_STAGES.map(s => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
