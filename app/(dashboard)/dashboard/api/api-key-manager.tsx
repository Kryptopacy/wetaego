'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Key, Trash2, Copy, Check, Plus, AlertCircle } from 'lucide-react'
import { createApiKey, revokeApiKey } from './actions'
import { formatDistanceToNow } from 'date-fns'

interface ApiKey {
  id: string
  name: string
  key_hash: string
  created_at: string
  last_used_at: string | null
}

export function ApiKeyManager({ initialKeys, organizationId }: { initialKeys: ApiKey[], organizationId: string }) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys)
  const [isCreating, startCreating] = useTransition()
  const [isRevoking, startRevoking] = useTransition()
  const [newKeyName, setNewKeyName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim()) return

    setError(null)
    startCreating(async () => {
      try {
        const formData = new FormData()
        formData.append('organization_id', organizationId)
        formData.append('name', newKeyName)
        
        const res = await createApiKey(formData)
        if (res?.data?.success) {
          setNewlyCreatedKey(res.data.rawKey)
          setNewKeyName('')
          setShowCreateForm(false)
          // To update the list without a full refresh, we can trigger a hard reload 
          // or rely on next/cache revalidation from the server action.
          // Since it's revalidated, it should update on next navigation, but we might want router.refresh()
          window.location.reload()
        } else if (res?.serverError) {
          setError(res.serverError)
        }
      } catch (err: any) {
        setError(err.message)
      }
    })
  }

  const handleRevoke = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Any integrations using it will immediately stop working.')) {
      return
    }

    startRevoking(async () => {
      try {
        const formData = new FormData()
        formData.append('organization_id', organizationId)
        formData.append('key_id', keyId)
        
        const res = await revokeApiKey(formData)
        if (res?.data?.success) {
          setKeys(keys.filter(k => k.id !== keyId))
        } else if (res?.serverError) {
          alert(res.serverError)
        }
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Success Modal for newly created key */}
      <AnimatePresence>
        {newlyCreatedKey && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={() => setNewlyCreatedKey(null)}
                className="text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-medium"
              >
                Done
              </button>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Key className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-emerald-400 mb-1">API Key Created Successfully</h3>
                <p className="text-sm text-zinc-300 mb-4">
                  Please copy this key and save it somewhere safe. For security reasons, <strong>we will never show it to you again</strong>.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-black/40 border border-emerald-500/30 rounded-lg px-4 py-3 font-mono text-emerald-300 break-all">
                    {newlyCreatedKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newlyCreatedKey)}
                    className="flex shrink-0 items-center gap-2 px-4 py-3 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors"
                  >
                    {copiedKey ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copiedKey ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Active Keys</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Generate New Key
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-zinc-400 mb-2">Key Name (e.g. Square POS Integration)</label>
            <input
              type="text"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              placeholder="My new API key"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              required
              disabled={isCreating}
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => { setShowCreateForm(false); setError(null) }}
              className="px-4 py-2.5 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {isCreating ? 'Generating...' : 'Generate Key'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        {keys.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">
            You don't have any active API keys.
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-800/50 text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Key Prefix</th>
                <th className="px-6 py-4 font-medium">Created</th>
                <th className="px-6 py-4 font-medium">Last Used</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {keys.map((key) => (
                <tr key={key.id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-white">{key.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <code className="bg-zinc-800 px-2 py-1 rounded text-zinc-300 font-mono text-xs">
                      ourmenu_live_...
                    </code>
                  </td>
                  <td className="px-6 py-4 text-zinc-400">
                    {formatDistanceToNow(new Date(key.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 text-zinc-400">
                    {key.last_used_at 
                      ? formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true }) 
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRevoke(key.id)}
                      disabled={isRevoking}
                      className="text-zinc-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-400/10 disabled:opacity-50"
                      title="Revoke Key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
