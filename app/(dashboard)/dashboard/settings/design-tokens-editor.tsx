'use client'

import { useState, useEffect } from 'react'
import { ActionForm } from '@/components/ActionForm'
import { SubmitButton } from '@/components/submit-button'
import { saveLocationDesignTokens, savePageDesignTokens } from './actions'
import { Palette, Layout, Scaling, Type, Zap, RefreshCcw } from 'lucide-react'

export function DesignTokensEditor({ 
  locationId, 
  initialTokens = {},
  onTokensChange,
  isLiveBuilder = false,
  pageId,
}: { 
  locationId: string 
  initialTokens: any 
  onTokensChange?: (tokens: any) => void
  isLiveBuilder?: boolean
  pageId?: string
}) {
  const [tokens, setTokens] = useState(initialTokens || {})

  // Keep internal state in sync if prop changes (like when switching scope in LiveBuilder)
  useEffect(() => {
    setTokens(initialTokens || {})
  }, [initialTokens])

  const handleSelect = (key: string, value: string) => {
    const newTokens = { ...tokens, [key]: value }
    setTokens(newTokens)
    if (onTokensChange) {
      onTokensChange(newTokens)
    }
  }

  const sections = [
    {
      title: 'Typography & Font Stack',
      key: 'typography',
      icon: <Type className="w-4 h-4" />,
      options: [
        { value: 'modern', label: 'Modern', desc: 'Clean Sans-Serif (Inter)' },
        { value: 'elegant', label: 'Elegant', desc: 'Refined Serif (Playfair)' },
        { value: 'playful', label: 'Playful', desc: 'Rounded (Quicksand)' },
        { value: 'industrial', label: 'Industrial', desc: 'Monospace (Space Grotesk)' },
      ]
    },
    {
      title: 'Structural Layout',
      key: 'layout_mode',
      icon: <Layout className="w-4 h-4" />,
      options: [
        { value: 'bento_grid', label: 'Bento Grid', desc: 'Modern block tiles' },
        { value: 'masonry', label: 'Masonry', desc: 'Dynamic flowing columns' },
        { value: 'list', label: 'List View', desc: 'Classic stacked rows' },
      ]
    },
    {
      title: 'Surface Aesthetics',
      key: 'surface_style',
      icon: <Palette className="w-4 h-4" />,
      options: [
        { value: 'flat', label: 'Flat', desc: 'Solid, vibrant backgrounds' },
        { value: 'glassmorphism', label: 'Glass', desc: 'Frosted blur overlays' },
        { value: 'neumorphism', label: 'Soft 3D', desc: 'Subtle embossed depth' },
      ]
    },
    {
      title: 'Corner Sharpness',
      key: 'corner_radius',
      icon: <Scaling className="w-4 h-4" />,
      options: [
        { value: 'none', label: 'Sharp', desc: '0px (Edgy)' },
        { value: 'md', label: 'Slight', desc: '8px (Classic)' },
        { value: 'xl', label: 'Rounded', desc: '16px (Modern)' },
        { value: 'full', label: 'Pill', desc: 'Fully circular' },
      ]
    },
    {
      title: 'Animation Vibe',
      key: 'animation_style',
      icon: <Zap className="w-4 h-4" />,
      options: [
        { value: 'instant', label: 'Instant', desc: 'Snappy, no delay' },
        { value: 'elegant', label: 'Elegant', desc: 'Smooth fades & eases' },
        { value: 'energetic', label: 'Energetic', desc: 'Bouncy spring physics' },
      ]
    },
    {
      title: 'Density & Spacing',
      key: 'density',
      icon: <Scaling className="w-4 h-4" />,
      options: [
        { value: 'cozy', label: 'Cozy', desc: 'Tight, fits more content' },
        { value: 'standard', label: 'Standard', desc: 'Balanced padding' },
        { value: 'airy', label: 'Airy', desc: 'Luxurious whitespace' },
      ]
    },
    {
      title: 'Color Vibe',
      key: 'color_theme',
      icon: <Palette className="w-4 h-4" />,
      options: [
        { value: 'true_dark', label: 'OLED Black', desc: 'Deep true black' },
        { value: 'dim', label: 'Dim', desc: 'Soft dark grey' },
        { value: 'tinted', label: 'Tinted', desc: 'Faint brand color' },
        { value: 'light', label: 'Light', desc: 'Clean white' },
      ]
    }
  ]

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 mt-8">
      <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
        <Palette className="w-5 h-5 text-indigo-400" />
        Brand Aesthetic Settings
      </h2>
      {!isLiveBuilder && (
        <p className="text-sm text-zinc-400 mb-8">
          Customize the soul of your brand. These semantic tokens automatically compile down to complex CSS to ensure a perfectly responsive, highly accessible storefront.
        </p>
      )}

      <ActionForm id="design-tokens-form" action={pageId ? savePageDesignTokens : saveLocationDesignTokens} className="flex flex-col gap-8">
        <input type="hidden" name={pageId ? "pageId" : "locationId"} value={pageId ? pageId : locationId} />
        
        {sections.map(section => (
          <div key={section.key} className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={`${isLiveBuilder ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {section.icon}
              </div>
              <h3 className={`text-sm font-semibold uppercase tracking-wider ${isLiveBuilder ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {section.title}
              </h3>
            </div>
            <input type="hidden" name={section.key} value={tokens[section.key] || ''} />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {section.options.map(option => {
                const isSelected = tokens[section.key] === option.value || (!tokens[section.key] && option.value === section.options[0].value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(section.key, option.value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected 
                        ? 'border-emerald-500 bg-emerald-500/10' 
                        : isLiveBuilder
                          ? 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className={`font-semibold mb-1 ${isSelected ? 'text-emerald-500' : (isLiveBuilder ? 'text-zinc-200' : 'text-zinc-900 dark:text-zinc-100')}`}>
                      {option.label}
                    </div>
                    <div className={`text-xs ${isSelected ? 'text-emerald-600/80 dark:text-emerald-400/80' : 'text-zinc-500'}`}>
                      {option.desc}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        <div className="pt-6 border-t border-zinc-800 flex flex-col gap-3">
          <SubmitButton className="w-full">
            {pageId ? 'Save Custom Page Design' : 'Save Global Design Options'}
          </SubmitButton>
          
          {pageId && Object.keys(tokens).length > 0 && (
            <button 
              type="button"
              onClick={() => {
                setTokens({})
                if (onTokensChange) onTokensChange({})
                // We also submit a blank form to revert on server
                const form = document.getElementById('design-tokens-form') as HTMLFormElement
                if (form) {
                  // Temporarily clear hidden inputs to submit nulls
                  form.querySelectorAll('input[type="hidden"]').forEach(el => {
                    if (el.getAttribute('name') !== 'pageId') (el as HTMLInputElement).value = ''
                  })
                  form.requestSubmit()
                }
              }}
              className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Revert to Global Settings
            </button>
          )}
        </div>
      </ActionForm>
    </div>
  )
}
