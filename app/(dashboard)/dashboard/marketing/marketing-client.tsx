'use client'

import { useState } from 'react'
import { sendBroadcastAction } from './actions'
import { useFormStatus } from 'react-dom'
import { Mail, Send, Users, Megaphone } from 'lucide-react'
import { toast } from 'sonner'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white px-6 py-3 rounded-xl font-bold transition-all"
    >
      <Send className="w-4 h-4" />
      {pending ? 'Sending Broadcast...' : 'Send to All Customers'}
    </button>
  )
}

export function MarketingClient({
  orgId,
  optInCount,
}: {
  orgId: string
  optInCount: number
}) {
  const [result, setResult] = useState<{ success?: boolean; error?: string; count?: number } | null>(null)

  async function clientAction(formData: FormData) {
    const res = await sendBroadcastAction(formData)
    
    if (res?.serverError || res?.validationErrors) {
      toast.error(res?.serverError || 'Failed to send broadcast.')
      return
    }

    toast.success(`Broadcast queued for ${res?.data?.count || 0} customers!`)
    setResult({ success: true, count: res?.data?.count })
  }

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-violet-400" />
            Broadcast Marketing
          </h1>
          <p className="text-zinc-400 mt-1">
            Send promotional emails to all customers who have opted in to marketing.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Opt-in Recipients</div>
            <div className="text-white font-bold text-lg">{optInCount.toLocaleString()}</div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Delivery</div>
            <div className="text-white font-bold text-lg">via Resend</div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Send className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wide">GDPR</div>
            <div className="text-white font-bold text-lg">Compliant</div>
          </div>
        </div>
      </div>

      {/* Result banners */}
      {result?.success && (
        <div className="rounded-xl border border-emerald-800/40 bg-emerald-900/10 p-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <p className="text-emerald-300 font-medium">
            Successfully queued broadcast to <strong>{result.count}</strong> unique customers!
          </p>
        </div>
      )}

      {result?.error && (
        <div className="rounded-xl border border-red-800/40 bg-red-900/10 p-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
          <p className="text-red-300 font-medium">{result.error}</p>
        </div>
      )}

      {optInCount === 0 && (
        <div className="rounded-xl border border-amber-800/40 bg-amber-900/10 p-5">
          <p className="text-amber-300 text-sm font-medium">
            No customers have opted in yet. Opt-ins are collected at checkout when customers provide their email.
          </p>
        </div>
      )}

      {/* Compose Form */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 md:p-8">
        <h2 className="text-lg font-bold text-white mb-6">Compose Broadcast</h2>
        <form action={clientAction} className="space-y-6">
          <input type="hidden" name="organization_id" value={orgId} />

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Email Subject</label>
            <input
              type="text"
              name="subject"
              required
              maxLength={200}
              className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-zinc-500 transition-colors"
              placeholder="e.g. 50% off all Pasta this Friday!"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Message Body</label>
            <textarea
              name="message"
              required
              rows={8}
              maxLength={2000}
              className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-zinc-500 font-sans resize-none transition-colors"
              placeholder="Write your message here..."
            />
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-900/10 border border-blue-800/30 rounded-xl">
            <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-sm text-blue-300">
              <strong className="font-bold text-blue-200">GDPR Safe:</strong> Only customers who explicitly opted in at checkout will receive this broadcast. Unsubscribers are automatically excluded.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  )
}
