'use client'

import { useState } from 'react'
import { Plus, X, ChevronDown } from 'lucide-react'

export interface VariantGroup {
  name: string
  options: string[]
  required: boolean
}

const PRESETS: Record<string, VariantGroup[]> = {
  clothing: [
    { name: 'Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], required: true },
    { name: 'Color', options: ['Black', 'White', 'Navy', 'Grey', 'Red', 'Green', 'Blue'], required: false },
  ],
  footwear: [
    { name: 'Size (EU)', options: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'], required: true },
    { name: 'Color', options: ['Black', 'White', 'Brown', 'Grey', 'Tan'], required: false },
  ],
  phones: [
    { name: 'Storage', options: ['64GB', '128GB', '256GB', '512GB', '1TB'], required: true },
    { name: 'Color', options: ['Black', 'White', 'Blue', 'Gold', 'Silver', 'Purple', 'Red'], required: false },
    { name: 'Condition', options: ['Brand New', 'UK Used', 'Grade A', 'Refurbished'], required: true },
  ],
  electronics: [
    { name: 'Variant', options: ['Standard', 'Pro', 'Max', 'Ultra'], required: true },
    { name: 'Color', options: ['Black', 'White', 'Silver', 'Blue', 'Gold'], required: false },
  ],
  vehicles: [
    { name: 'Color', options: ['Black', 'White', 'Silver', 'Red', 'Blue', 'Grey', 'Champagne'], required: false },
    { name: 'Condition', options: ['Brand New', 'Foreign Used', 'Local Used'], required: true },
    { name: 'Transmission', options: ['Manual', 'Automatic'], required: false },
  ],
  food: [
    { name: 'Size', options: ['Small', 'Medium', 'Large'], required: true },
    { name: 'Spice Level', options: ['Mild', 'Medium', 'Hot', 'Extra Hot'], required: false },
  ],
  custom: [],
}

const PRESET_LABELS: Record<string, string> = {
  none: 'No Variants',
  clothing: '👕 Clothing (Size, Color)',
  footwear: '👟 Footwear (Shoe Size, Color)',
  phones: '📱 Phones (Storage, Color, Condition)',
  electronics: '💻 Electronics (Variant, Color)',
  vehicles: '🚗 Vehicles (Color, Condition, Transmission)',
  food: '🍔 Food (Size, Spice Level)',
  custom: '⚙️ Custom (Build Your Own)',
}

interface VariantBuilderFieldProps {
  initialVariants?: VariantGroup[]
  onChange: (variants: VariantGroup[]) => void
}

export function VariantBuilderField({ initialVariants, onChange }: VariantBuilderFieldProps) {
  const detectPreset = (): string => {
    if (!initialVariants || initialVariants.length === 0) return 'none'
    return 'custom'
  }

  const [preset, setPreset] = useState<string>(detectPreset)
  const [groups, setGroups] = useState<VariantGroup[]>(initialVariants || [])
  const [newOptionInputs, setNewOptionInputs] = useState<Record<number, string>>({})

  function applyPreset(key: string) {
    setPreset(key)
    if (key === 'none') {
      setGroups([])
      onChange([])
    } else if (key === 'custom') {
      // Don't reset — keep existing groups
    } else {
      const newGroups = PRESETS[key].map(g => ({ ...g, options: [...g.options] }))
      setGroups(newGroups)
      onChange(newGroups)
    }
  }

  function updateGroup(idx: number, updates: Partial<VariantGroup>) {
    const updated = groups.map((g, i) => i === idx ? { ...g, ...updates } : g)
    setGroups(updated)
    onChange(updated)
  }

  function removeGroup(idx: number) {
    const updated = groups.filter((_, i) => i !== idx)
    setGroups(updated)
    onChange(updated)
  }

  function addGroup() {
    const updated = [...groups, { name: '', options: [], required: true }]
    setGroups(updated)
    onChange(updated)
  }

  function addOption(groupIdx: number) {
    const val = (newOptionInputs[groupIdx] || '').trim()
    if (!val) return
    const updated = groups.map((g, i) =>
      i === groupIdx ? { ...g, options: [...g.options, val] } : g
    )
    setGroups(updated)
    onChange(updated)
    setNewOptionInputs(prev => ({ ...prev, [groupIdx]: '' }))
  }

  function removeOption(groupIdx: number, optIdx: number) {
    const updated = groups.map((g, i) =>
      i === groupIdx ? { ...g, options: g.options.filter((_, oi) => oi !== optIdx) } : g
    )
    setGroups(updated)
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {/* Preset Selector */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Product Variants</label>
        <div className="relative">
          <select
            value={preset}
            onChange={e => applyPreset(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none appearance-none pr-8"
          >
            {Object.entries(PRESET_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {/* Variant Groups */}
      {(preset !== 'none') && (
        <div className="space-y-4 border border-zinc-800 bg-zinc-950/50 rounded-xl p-4">
          {groups.length === 0 && (
            <p className="text-xs text-zinc-600 text-center py-2">No variant groups yet. Add one below.</p>
          )}

          {groups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2 border border-zinc-800 rounded-xl p-3 bg-zinc-900">
              {/* Group Header */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={group.name}
                  onChange={e => updateGroup(gIdx, { name: e.target.value })}
                  placeholder="Group name (e.g. Size, Color)"
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-emerald-500 placeholder:text-zinc-600"
                />
                <label className="flex items-center gap-1.5 text-xs text-zinc-400 whitespace-nowrap cursor-pointer">
                  <input
                    type="checkbox"
                    checked={group.required}
                    onChange={e => updateGroup(gIdx, { required: e.target.checked })}
                    className="rounded accent-emerald-500"
                  />
                  Required
                </label>
                <button
                  type="button"
                  onClick={() => removeGroup(gIdx)}
                  className="p-1 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Options */}
              <div className="flex flex-wrap gap-1.5">
                {group.options.map((opt, oIdx) => (
                  <span
                    key={oIdx}
                    className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-300"
                  >
                    {opt}
                    <button
                      type="button"
                      onClick={() => removeOption(gIdx, oIdx)}
                      className="ml-0.5 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add option input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOptionInputs[gIdx] || ''}
                  onChange={e => setNewOptionInputs(prev => ({ ...prev, [gIdx]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(gIdx) } }}
                  placeholder="Add option & press Enter"
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500 placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => addOption(gIdx)}
                  className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addGroup}
            className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Variant Group
          </button>
        </div>
      )}
    </div>
  )
}
