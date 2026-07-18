'use client'

import { useState } from 'react'
import { Plus, Trash2, RefreshCw, AlertTriangle } from 'lucide-react'
import { CreateWebhookModal } from './create-webhook-modal'
import { toggleWebhookStatus, deleteWebhook, rotateWebhookSecret } from '@/app/(dashboard)/dashboard/webhooks/actions'
import { toast } from 'sonner'

interface Webhook {
  id: string
  url: string
  secret: string | null
  events_subscribed: string[]
  is_active: boolean
  created_at: string
}

export function WebhooksManager({ locationId, initialWebhooks }: { locationId: string, initialWebhooks: Webhook[] }) {
  const [webhooks, setWebhooks] = useState<Webhook[]>(initialWebhooks)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  
  // States for our custom confirmation modal
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    isDestructive: boolean;
    onConfirm: () => void;
  } | null>(null)

  const handleToggle = async (webhookId: string, currentStatus: boolean) => {
    setIsLoading(webhookId)
    try {
      await toggleWebhookStatus(webhookId, !currentStatus)
      setWebhooks(webhooks.map(w => w.id === webhookId ? { ...w, is_active: !currentStatus } : w))
      toast.success('Webhook status updated.')
    } catch (e) {
      toast.error('Failed to update webhook.')
    } finally {
      setIsLoading(null)
    }
  }

  const handleDelete = async (webhookId: string) => {
    setIsLoading(webhookId)
    try {
      await deleteWebhook(webhookId)
      setWebhooks(webhooks.filter(w => w.id !== webhookId))
      toast.success('Webhook deleted successfully.')
    } catch (e) {
      toast.error('Failed to delete webhook.')
    } finally {
      setIsLoading(null)
      setConfirmState(null)
    }
  }

  const handleRotate = async (webhookId: string) => {
    setIsLoading(webhookId)
    try {
      await rotateWebhookSecret(webhookId)
      toast.success('Webhook secret rotated. Please refresh to see the new secret.')
      window.location.reload()
    } catch (e) {
      toast.error('Failed to rotate secret.')
    } finally {
      setIsLoading(null)
      setConfirmState(null)
    }
  }

  const promptRotate = (webhookId: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Rotate Webhook Secret?',
      description: 'This will instantly invalidate the old signing secret. Any systems verifying payloads with the old secret will fail.',
      actionLabel: 'Rotate Secret',
      isDestructive: false,
      onConfirm: () => handleRotate(webhookId)
    })
  }

  const promptDelete = (webhookId: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Webhook?',
      description: 'This action cannot be undone. This endpoint will stop receiving all event payloads immediately.',
      actionLabel: 'Delete Webhook',
      isDestructive: true,
      onConfirm: () => handleDelete(webhookId)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 h-10 px-4"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Endpoint
        </button>
      </div>

      {webhooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/30">
          <div className="rounded-full bg-emerald-500/10 p-4 mb-4">
            <RefreshCw className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-100">No Webhooks Configured</h3>
          <p className="text-center mt-2 max-w-sm text-sm text-zinc-400">
            Add a webhook endpoint to receive real-time notifications about orders, bookings, and inventory changes.
          </p>
          <button 
            className="mt-6 inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors border border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 h-10 px-4"
            onClick={() => setIsModalOpen(true)}
          >
            Add Your First Endpoint
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {webhooks.map(webhook => (
            <div key={webhook.id} className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/50 flex flex-col shadow-sm">
              <div className={`absolute top-0 left-0 w-1 h-full ${webhook.is_active ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
              
              <div className="p-5 pb-4 border-b border-zinc-800/60">
                <div className="flex justify-between items-start gap-4">
                  <div className="truncate min-w-0">
                    <h3 className="text-base font-semibold text-zinc-100 truncate" title={webhook.url}>
                      {new URL(webhook.url).hostname}
                    </h3>
                    <p className="truncate text-xs mt-1 text-zinc-500" title={webhook.url}>
                      {webhook.url}
                    </p>
                  </div>
                  
                  {/* Custom Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={webhook.is_active}
                    disabled={isLoading === webhook.id}
                    onClick={() => handleToggle(webhook.id, webhook.is_active)}
                    className={`shrink-0 relative inline-flex h-5 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 ${webhook.is_active ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                  >
                    <span
                      data-state={webhook.is_active ? 'checked' : 'unchecked'}
                      className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${webhook.is_active ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col gap-4">
                <div>
                  <span className="text-xs font-medium text-zinc-400">Events Subscribed</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {webhook.events_subscribed.map(event => (
                      <span key={event} className="inline-flex items-center rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                        {event}
                      </span>
                    ))}
                    {webhook.events_subscribed.length === 0 && (
                      <span className="text-xs text-zinc-500 italic">None (Wildcard)</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <span className="text-xs font-medium text-zinc-400">Signing Secret</span>
                  <div className="mt-2 font-mono text-xs bg-zinc-900 text-zinc-300 p-2.5 rounded-lg border border-zinc-800 truncate select-all">
                    {webhook.secret || 'No secret generated'}
                  </div>
                </div>
              </div>
              
              <div className="bg-zinc-900/30 border-t border-zinc-800/60 p-3 flex justify-between">
                <button 
                  onClick={() => promptRotate(webhook.id)}
                  className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 h-8 px-3"
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Rotate Secret
                </button>

                <button 
                  onClick={() => promptDelete(webhook.id)}
                  className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8 px-3"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmState?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setConfirmState(null)}
          />
          <div className="relative z-50 w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6">
            <div className="flex gap-4">
              <div className={`shrink-0 rounded-full p-2 h-10 w-10 flex items-center justify-center ${confirmState.isDestructive ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                <AlertTriangle className={`h-5 w-5 ${confirmState.isDestructive ? 'text-red-500' : 'text-blue-500'}`} />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-zinc-100">{confirmState.title}</h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {confirmState.description}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmState(null)}
                className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 bg-transparent hover:bg-zinc-800 rounded-lg transition-colors border border-transparent"
              >
                Cancel
              </button>
              <button
                onClick={confirmState.onConfirm}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors ${
                  confirmState.isDestructive 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
              >
                {confirmState.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateWebhookModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        locationId={locationId} 
      />
    </div>
  )
}
