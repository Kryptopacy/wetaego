'use client'

import React, { useState } from 'react'

export function PageThemePickers({ initialThemeColor, initialBgColor }: { initialThemeColor?: string | null, initialBgColor?: string | null }) {
  const [themeColor, setThemeColor] = useState(initialThemeColor || '')
  const [bgColor, setBgColor] = useState(initialBgColor || '')

  return (
    <div className="space-y-6">
      {/* Hidden inputs to attach values to the parent form */}
      <input type="hidden" name="theme_color" value={themeColor} />
      <input type="hidden" name="background_color" value={bgColor} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
          <div>
            <p className="text-sm font-bold text-white">Accent Color Override</p>
            <p className="text-xs text-zinc-400 mt-0.5">Overrides your brand color for this specific page. Leave empty to use default.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <input 
              type="color" 
              value={themeColor || '#10b981'} 
              onChange={(e) => setThemeColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer bg-zinc-800 border-0 p-0"
              disabled={!themeColor}
            />
            <button 
              type="button"
              onClick={() => setThemeColor(themeColor ? '' : '#10b981')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${themeColor ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
            >
              {themeColor ? 'Clear Override' : 'Set Override'}
            </button>
          </div>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
          <div>
            <p className="text-sm font-bold text-white">Background Color Override</p>
            <p className="text-xs text-zinc-400 mt-0.5">Changes the default dark background for this page. Leave empty to use default.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <input 
              type="color" 
              value={bgColor || '#0a0a0f'} 
              onChange={(e) => setBgColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer bg-zinc-800 border-0 p-0"
              disabled={!bgColor}
            />
            <button 
              type="button"
              onClick={() => setBgColor(bgColor ? '' : '#0a0a0f')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${bgColor ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
            >
              {bgColor ? 'Clear Override' : 'Set Override'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
