'use client'

import { useState } from 'react'
import { BUSINESS_TYPE_GROUPS, getPresetsByGroup } from '@/lib/templates/presets'
const classNames = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ')
export function BusinessTypePicker({ defaultValue }: { defaultValue?: string }) {
  // Find which group the default value belongs to
  let defaultGroupId = BUSINESS_TYPE_GROUPS[0].id
  if (defaultValue) {
    for (const group of BUSINESS_TYPE_GROUPS) {
      if (getPresetsByGroup(group.id).some(p => p.key === defaultValue)) {
        defaultGroupId = group.id
        break
      }
    }
  }

  const [activeGroup, setActiveGroup] = useState<string>(defaultGroupId)
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue || 'restaurant')

  return (
    <div className="flex flex-col space-y-4">
      {/* Hidden input to pass data to the form action */}
      <input type="hidden" name="business_type" value={selectedValue} />
      
      {/* Category Tabs */}
      <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2 border-b border-zinc-800">
        {BUSINESS_TYPE_GROUPS.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => setActiveGroup(group.id)}
            className={classNames(
              "px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors border",
              activeGroup === group.id 
                ? "bg-blue-600/10 border-blue-500/50 text-blue-400" 
                : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            )}
          >
            {group.label.replace(/[^a-zA-Z\s&]/g, '').trim()} {/* Strip emoji for tabs if desired, or keep it. Let's keep it clean */}
          </button>
        ))}
      </div>

      {/* Grid of Options for Active Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
        {getPresetsByGroup(activeGroup).map(({ key, preset }) => (
          <div
            key={key}
            onClick={() => setSelectedValue(key)}
            className={classNames(
              "relative flex flex-col p-4 rounded-xl cursor-pointer border transition-all duration-200",
              selectedValue === key
                ? "bg-blue-500/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500"
                : "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{preset.icon}</span>
              <div className={classNames(
                "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                selectedValue === key ? "border-blue-500 bg-blue-500" : "border-zinc-600"
              )}>
                {selectedValue === key && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <h4 className="text-sm font-semibold text-zinc-100">{preset.label}</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{preset.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
