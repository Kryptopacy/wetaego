'use client'

import React, { useState } from 'react'
import { ActionForm } from '@/components/ActionForm'
import { saveLocationTheme } from './actions'
import { Check } from 'lucide-react'

const THEMES = [
  { name: 'Emerald', hex: '#10b981', ring: 'ring-emerald-500' },
  { name: 'Violet', hex: '#8b5cf6', ring: 'ring-violet-500' },
  { name: 'Rose', hex: '#f43f5e', ring: 'ring-rose-500' },
  { name: 'Amber', hex: '#f59e0b', ring: 'ring-amber-500' },
  { name: 'Blue', hex: '#3b82f6', ring: 'ring-blue-500' },
  { name: 'Zinc', hex: '#52525b', ring: 'ring-zinc-500' },
]

export function ThemeColorPicker({ locationId, initialColor }: { locationId: string, initialColor?: string }) {
  const [selectedColor, setSelectedColor] = useState(initialColor || '#10b981')

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="p-6 border-b border-zinc-800">
        <h2 className="text-xl font-bold text-white mb-1">Brand Theme</h2>
        <p className="text-sm text-zinc-400">
          Choose a primary color for your public pages. This will be used for buttons, links, and accents.
        </p>
      </div>
      <div className="p-6">
        <ActionForm action={saveLocationTheme} className="flex flex-col gap-6" successMessage="Theme color updated">
          <input type="hidden" name="locationId" value={locationId} />
          <input type="hidden" name="themeColor" value={selectedColor} />
          
          <div className="flex flex-wrap gap-4">
            {THEMES.map((theme) => {
              const isSelected = selectedColor.toLowerCase() === theme.hex.toLowerCase()
              return (
                <button
                  key={theme.hex}
                  type="button"
                  onClick={() => setSelectedColor(theme.hex)}
                  className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                    isSelected ? `ring-2 ring-offset-2 ring-offset-zinc-900 ${theme.ring} scale-110` : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: theme.hex }}
                  title={theme.name}
                >
                  {isSelected && <Check className="w-5 h-5 text-white drop-shadow-md" />}
                </button>
              )
            })}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-white text-zinc-900 font-bold text-sm hover:bg-zinc-200 transition-colors shadow-sm"
            >
              Save Theme
            </button>
          </div>
        </ActionForm>
      </div>
    </div>
  )
}
