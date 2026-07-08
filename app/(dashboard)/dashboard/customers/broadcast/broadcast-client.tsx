'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Send, Users, Smartphone, Mail, AlertTriangle } from 'lucide-react'
import { sendBroadcastAction } from './actions'

type BroadcastClientProps = {
  organizationId: string
  optInCount: number
  locations: { id: string; name: string }[]
}

export function BroadcastClient({ organizationId, optInCount, locations }: BroadcastClientProps) {
  const router = useRouter()
  const [isSending, setIsSending] = useState(false)
  const [channels, setChannels] = useState<string[]>(['email'])
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const toggleChannel = (c: string) => {
    setChannels(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (channels.length === 0) {
      toast.error('Please select at least one channel')
      return
    }
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required')
      return
    }

    if (!confirm(`Are you sure you want to broadcast to up to ${optInCount} customers?`)) {
      return
    }

    setIsSending(true)
    try {
      const res = await sendBroadcastAction(organizationId, channels, subject, message)
      if (res.success) {
        toast.success(`Broadcast sent successfully to ${res.sentCount} customers!`)
        router.push('/dashboard/customers')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send broadcast')
    } finally {
      setIsSending(false)
    }
  }

  if (optInCount === 0) {
    return (
      <div className="p-8 border border-zinc-800 rounded-xl bg-zinc-900/50 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
        <div>
          <h2 className="text-xl font-bold text-white">No Opt-in Customers</h2>
          <p className="text-zinc-400 mt-2 max-w-md mx-auto">
            You do not have any customers who have opted in for marketing updates yet. Customers must explicitly opt-in during checkout or booking.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSend} className="space-y-8">
      {/* Target Audience Summary */}
      <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-4">
        <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
          <Users className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h3 className="font-bold text-white">Target Audience</h3>
          <p className="text-sm text-zinc-400 mt-1">
            This message will be sent to <strong className="text-white">{optInCount} customers</strong> who have explicitly opted in for marketing and updates across your locations.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Channels */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-3">Delivery Channels</label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => toggleChannel('email')}
              className={`flex-1 p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                channels.includes('email') 
                  ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              <Mail className={`w-6 h-6 ${channels.includes('email') ? 'text-blue-400' : ''}`} />
              <span className={`font-medium ${channels.includes('email') ? 'text-white' : ''}`}>Email</span>
            </button>
            <button
              type="button"
              onClick={() => toggleChannel('whatsapp')}
              className={`flex-1 p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                channels.includes('whatsapp') 
                  ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              <Smartphone className={`w-6 h-6 ${channels.includes('whatsapp') ? 'text-emerald-400' : ''}`} />
              <span className={`font-medium ${channels.includes('whatsapp') ? 'text-white' : ''}`}>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Subject / Headline</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Special Weekend Discount!"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Message Body</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here. You can use {{name}} to insert the customer's name."
              className="w-full h-40 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors resize-y"
              required
            />
            <p className="text-xs text-zinc-500 mt-2">
              Tip: Keep it short and engaging. For WhatsApp, standard text formatting works (e.g. *bold*).
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-zinc-800">
        <button
          type="submit"
          disabled={isSending || channels.length === 0 || !subject || !message}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          {isSending ? 'Sending Broadcast...' : 'Send Broadcast'}
        </button>
      </div>
    </form>
  )
}
