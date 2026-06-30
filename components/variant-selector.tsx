'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'

export interface VariantGroup {
  name: string        // e.g. "Size", "Color", "Storage"
  options: string[]   // e.g. ["S", "M", "L", "XL"]
  required: boolean
}

interface VariantSelectorProps {
  item: {
    id: string
    name: string
    price_minor: number
    variants: VariantGroup[]
  }
  currency: string
  themeColor: string
  onConfirm: (selections: Record<string, string>, cartKey: string, label: string) => void
  onCancel: () => void
}

export function VariantSelector({ item, currency, themeColor, onConfirm, onCancel }: VariantSelectorProps) {
  const [selections, setSelections] = useState<Record<string, string>>({})

  const allRequiredSelected = item.variants
    .filter(g => g.required)
    .every(g => selections[g.name])

  function handleSelect(groupName: string, option: string) {
    setSelections(prev => ({ ...prev, [groupName]: option }))
  }

  function handleConfirm() {
    if (!allRequiredSelected) return
    const label = item.variants
      .map(g => selections[g.name])
      .filter(Boolean)
      .join(' / ')
    const cartKey = `${item.id}__${Object.values(selections).join('-')}`
    onConfirm(selections, cartKey, label)
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />

        {/* Sheet */}
        <motion.div
          className="relative w-full sm:max-w-md bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-zinc-800">
            <div>
              <h2 className="text-lg font-bold text-white">{item.name}</h2>
              <p className="text-sm text-zinc-400 mt-0.5">{formatCurrency(item.price_minor, currency)}</p>
            </div>
            <button onClick={onCancel} className="p-2 rounded-xl hover:bg-white/5 text-zinc-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Variant Groups */}
          <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
            {item.variants.map(group => (
              <div key={group.name}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-bold text-white">{group.name}</h3>
                  {group.required ? (
                    <span className="text-xs text-zinc-500">(Required)</span>
                  ) : (
                    <span className="text-xs text-zinc-600">(Optional)</span>
                  )}
                  {selections[group.name] && (
                    <span className="ml-auto text-xs font-medium" style={{ color: themeColor }}>
                      {selections[group.name]}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.options.map(option => {
                    const selected = selections[group.name] === option
                    return (
                      <button
                        key={option}
                        onClick={() => handleSelect(group.name, option)}
                        className={`relative px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                          selected
                            ? 'text-white border-transparent'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                        }`}
                        style={selected ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                      >
                        {selected && <Check className="w-3 h-3 inline-block mr-1.5 opacity-90" />}
                        {option}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-zinc-800">
            <button
              onClick={handleConfirm}
              disabled={!allRequiredSelected}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
              style={{ background: allRequiredSelected ? `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` : undefined, backgroundColor: !allRequiredSelected ? '#27272a' : undefined }}
            >
              {allRequiredSelected
                ? `Add to Cart${Object.keys(selections).length > 0 ? ` — ${item.variants.map(g => selections[g.name]).filter(Boolean).join(' / ')}` : ''}`
                : `Select ${item.variants.find(g => g.required && !selections[g.name])?.name}`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
