'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X } from 'lucide-react'

interface CustomMilestonesSettingsProps {
  locationId: string
  initialMilestones: any
}

export function CustomMilestonesSettings({ locationId, initialMilestones }: CustomMilestonesSettingsProps) {
  const [milestones, setMilestones] = useState<Record<string, string[]>>(
    initialMilestones || { delivery: [], pickup: [] }
  )
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'delivery' | 'pickup'>('delivery')
  const [newTitle, setNewTitle] = useState('')

  const supabase = createClient()

  const handleAdd = () => {
    if (!newTitle.trim()) return
    setMilestones(prev => ({
      ...prev,
      [activeTab]: [...(prev[activeTab] || []), newTitle.trim()]
    }))
    setNewTitle('')
  }

  const handleRemove = (idx: number) => {
    setMilestones(prev => {
      const updated = [...(prev[activeTab] || [])]
      updated.splice(idx, 1)
      return { ...prev, [activeTab]: updated }
    })
  }

  const handleSave = async () => {
    setLoading(true)
    setSuccess(false)
    const { error } = await supabase
      .from('locations')
      .update({ custom_milestones: milestones } as any)
      .eq('id', locationId)

    setLoading(false)
    if (!error) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      alert('Failed to save custom milestones.')
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 mt-8">
      <h2 className="text-lg font-semibold text-white mb-2">Custom Fulfillment Milestones</h2>
      <p className="text-sm text-zinc-400 mb-6">
        Define custom progress steps for your delivery and pickup orders. These milestones will be displayed beautifully on the customer-facing Order Tracker.
      </p>

      <div className="flex gap-4 mb-6 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('delivery')}
          className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'delivery' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Delivery Milestones
        </button>
        <button
          onClick={() => setActiveTab('pickup')}
          className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'pickup' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Pickup Milestones
        </button>
      </div>

      <div className="space-y-3 mb-6">
        {(milestones[activeTab] || []).length === 0 ? (
          <p className="text-zinc-500 text-sm italic">No custom milestones set. Default system milestones will be used.</p>
        ) : (
          (milestones[activeTab] || []).map((title, idx) => (
            <div key={idx} className="flex items-center justify-between bg-zinc-800/50 px-4 py-3 rounded-lg border border-zinc-700">
              <span className="text-white text-sm font-medium">
                <span className="text-zinc-500 mr-2">{idx + 1}.</span>
                {title}
              </span>
              <button onClick={() => handleRemove(idx)} className="text-zinc-500 hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-3 mb-8">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="e.g. Driver is at your gate"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors flex items-center gap-2 border border-zinc-700"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors flex items-center gap-2"
        >
          {loading ? 'Saving...' : 'Save Milestones'}
        </button>
        {success && <span className="text-emerald-400 text-sm font-medium animate-pulse">Saved successfully!</span>}
      </div>
    </div>
  )
}
