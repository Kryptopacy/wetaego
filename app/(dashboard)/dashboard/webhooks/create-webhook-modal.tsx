'use client'

import { useState } from 'react'
import { createWebhook } from '@/app/(dashboard)/dashboard/webhooks/actions'
import { toast } from 'sonner'
import { X } from 'lucide-react'

interface CreateWebhookModalProps {
  isOpen: boolean
  onClose: () => void
  locationId: string
}

const AVAILABLE_EVENTS = [
  { id: 'order.created', label: 'Order Created' },
  { id: 'order.updated', label: 'Order Updated' },
  { id: 'booking.created', label: 'Booking Created' },
  { id: 'booking.updated', label: 'Booking Updated' },
  { id: 'inventory.updated', label: 'Inventory Updated' },
]

export function CreateWebhookModal({ isOpen, onClose, locationId }: CreateWebhookModalProps) {
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleEventToggle = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      toast.error('Webhook URL must start with http:// or https://')
      return
    }

    setIsSubmitting(true)
    try {
      await createWebhook(locationId, url, selectedEvents)
      toast.success('Webhook endpoint created successfully.')
      setUrl('')
      setSelectedEvents([])
      onClose()
      window.location.reload()
    } catch (error) {
      toast.error('Failed to create webhook.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/60">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-100">Add Webhook Endpoint</h2>
            <p className="text-sm text-zinc-400">Enter the destination URL and select events.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 transition-colors p-1 rounded-md hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium text-zinc-200">
              Payload URL
            </label>
            <input
              id="url"
              type="text"
              placeholder="https://api.yourdomain.com/webhooks"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-colors"
            />
          </div>
          
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-200">Events to send</label>
            <div className="border border-zinc-800/80 bg-zinc-900/30 rounded-lg p-4 space-y-4">
              <div className="flex items-start space-x-3 border-b border-zinc-800/60 pb-4">
                <input
                  type="checkbox"
                  id="all"
                  checked={selectedEvents.length === 0}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedEvents([])
                  }}
                  className="mt-1 w-4 h-4 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500/20 bg-zinc-900"
                />
                <div className="grid gap-1">
                  <label htmlFor="all" className="text-sm font-medium text-zinc-200 cursor-pointer">
                    Send me everything (Wildcard)
                  </label>
                  <p className="text-xs text-zinc-500">
                    Events will be sent for all supported triggers.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {AVAILABLE_EVENTS.map((event) => (
                  <div key={event.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={event.id}
                      checked={selectedEvents.includes(event.id)}
                      onChange={() => handleEventToggle(event.id)}
                      className="w-4 h-4 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500/20 bg-zinc-900"
                    />
                    <label htmlFor={event.id} className="text-sm font-medium text-zinc-300 cursor-pointer">
                      {event.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 bg-transparent hover:bg-zinc-800 rounded-lg transition-colors border border-transparent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !url}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
            >
              {isSubmitting ? 'Adding...' : 'Add Endpoint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
