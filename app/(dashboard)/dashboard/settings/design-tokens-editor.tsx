'use client'

import { useState, useEffect } from 'react'
import { ActionForm } from '@/components/ActionForm'
import { SubmitButton } from '@/components/submit-button'
import { saveLocationDesignTokens, savePageDesignTokens, saveLocationTheme } from './actions'
import { Palette, Layout, Scaling, Type, Zap, RefreshCcw, Sparkles, Check } from 'lucide-react'

export interface QuickPreset {
  id: string
  name: string
  tagline: string
  icon: string
  tokens: Record<string, string>
}

export const QUICK_THEME_PRESETS: QuickPreset[] = [
  {
    id: 'midnight_lounge',
    name: 'Midnight Lounge',
    tagline: 'OLED Black · Frosted Glass · Modern Sans',
    icon: '🍸',
    tokens: {
      typography: 'modern',
      layout_mode: 'bento_grid',
      surface_style: 'glassmorphism',
      corner_radius: 'xl',
      animation_style: 'instant',
      density: 'standard',
      color_theme: 'true_dark'
    }
  },
  {
    id: 'classic_bistro',
    name: 'Classic Bistro',
    tagline: 'Warm Dim · Flat Cards · Editorial Serif',
    icon: '🍷',
    tokens: {
      typography: 'elegant',
      layout_mode: 'list',
      surface_style: 'flat',
      corner_radius: 'md',
      animation_style: 'elegant',
      density: 'standard',
      color_theme: 'dim'
    }
  },
  {
    id: 'tokyo_minimal',
    name: 'Tokyo Minimal',
    tagline: 'Studio Light · High Whitespace · Crisp 8px',
    icon: '🍵',
    tokens: {
      typography: 'modern',
      layout_mode: 'bento_grid',
      surface_style: 'flat',
      corner_radius: 'md',
      animation_style: 'elegant',
      density: 'airy',
      color_theme: 'light'
    }
  },
  {
    id: 'playful_street',
    name: 'Playful Street',
    tagline: 'Rounded Pill · Soft 3D · Bouncy Spring',
    icon: '🍔',
    tokens: {
      typography: 'playful',
      layout_mode: 'bento_grid',
      surface_style: 'neumorphism',
      corner_radius: 'full',
      animation_style: 'energetic',
      density: 'cozy',
      color_theme: 'dim'
    }
  },
  {
    id: 'industrial_craft',
    name: 'Industrial Craft',
    tagline: 'Sharp Edges · Monospace · High Density',
    icon: '⚡',
    tokens: {
      typography: 'industrial',
      layout_mode: 'list',
      surface_style: 'flat',
      corner_radius: 'none',
      animation_style: 'instant',
      density: 'cozy',
      color_theme: 'true_dark'
    }
  }
]

export const BRAND_PALETTES = [
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Terracotta Wine', hex: '#991b1b' },
  { name: 'Royal Violet', hex: '#8b5cf6' },
  { name: 'Warm Amber', hex: '#f59e0b' },
  { name: 'Rose Quartz', hex: '#f43f5e' },
  { name: 'Sapphire Blue', hex: '#2563eb' },
  { name: 'Midnight Gold', hex: '#d97706' },
  { name: 'Monochrome Slate', hex: '#64748b' },
]

export function DesignTokensEditor({ 
  locationId, 
  initialTokens = {},
  themeColor = '#10b981',
  onTokensChange,
  onThemeColorChange,
  isLiveBuilder = false,
  pageId,
}: { 
  locationId: string 
  initialTokens: any 
  themeColor?: string
  onTokensChange?: (tokens: any) => void
  onThemeColorChange?: (color: string) => void
  isLiveBuilder?: boolean
  pageId?: string
}) {
  const [tokens, setTokens] = useState<Record<string, string>>(initialTokens || {})
  const [activeColor, setActiveColor] = useState(themeColor || '#10b981')

  // Keep internal state in sync if prop changes
  useEffect(() => {
    setTokens(initialTokens || {})
  }, [initialTokens])

  useEffect(() => {
    if (themeColor) setActiveColor(themeColor)
  }, [themeColor])

  const handleSelect = (key: string, value: string) => {
    const newTokens = { ...tokens, [key]: value }
    setTokens(newTokens)
    if (onTokensChange) {
      onTokensChange(newTokens)
    }
  }

  const handleApplyPreset = (preset: QuickPreset) => {
    setTokens(preset.tokens)
    if (onTokensChange) {
      onTokensChange(preset.tokens)
    }
  }

  const handleColorSelect = (hex: string) => {
    setActiveColor(hex)
    if (onThemeColorChange) {
      onThemeColorChange(hex)
    }
  }

  const sections = [
    {
      title: 'Typography & Font Stack',
      key: 'typography',
      icon: <Type className="w-4 h-4" />,
      options: [
        { value: 'modern', label: 'Modern', desc: 'Clean Sans-Serif (Inter / Plus Jakarta)' },
        { value: 'elegant', label: 'Editorial Serif', desc: 'Refined Serif (Cormorant / Playfair)' },
        { value: 'playful', label: 'Playful', desc: 'Rounded (Outfit / Quicksand)' },
        { value: 'industrial', label: 'Industrial', desc: 'Monospace (Space Grotesk)' },
      ]
    },
    {
      title: 'Structural Layout',
      key: 'layout_mode',
      icon: <Layout className="w-4 h-4" />,
      options: [
        { value: 'bento_grid', label: 'Bento Grid', desc: 'Modern adaptive tiles' },
        { value: 'masonry', label: 'Masonry', desc: 'Dynamic flowing columns' },
        { value: 'list', label: 'List View', desc: 'Classic stacked rows' },
      ]
    },
    {
      title: 'Surface Aesthetics',
      key: 'surface_style',
      icon: <Palette className="w-4 h-4" />,
      options: [
        { value: 'flat', label: 'Flat Solid', desc: 'Clean, high-contrast surfaces' },
        { value: 'glassmorphism', label: 'Frosted Glass', desc: 'Acrylic blur with luminous border' },
        { value: 'neumorphism', label: 'Soft 3D', desc: 'Subtle embossed depth' },
      ]
    },
    {
      title: 'Corner Sharpness',
      key: 'corner_radius',
      icon: <Scaling className="w-4 h-4" />,
      options: [
        { value: 'none', label: 'Sharp', desc: '0px (Architectural)' },
        { value: 'md', label: 'Slight', desc: '8px (Classic)' },
        { value: 'xl', label: 'Rounded', desc: '16px (Modern Luxe)' },
        { value: 'full', label: 'Pill', desc: 'Fully circular capsules' },
      ]
    },
    {
      title: 'Animation Vibe',
      key: 'animation_style',
      icon: <Zap className="w-4 h-4" />,
      options: [
        { value: 'instant', label: 'Instant', desc: 'Snappy, zero delay' },
        { value: 'elegant', label: 'Smooth Ease', desc: 'Subtle fades & easing' },
        { value: 'energetic', label: 'Energetic Spring', desc: 'Bouncy physics on hover' },
      ]
    },
    {
      title: 'Density & Spacing',
      key: 'density',
      icon: <Scaling className="w-4 h-4" />,
      options: [
        { value: 'cozy', label: 'Cozy', desc: 'Compact, fits more items above fold' },
        { value: 'standard', label: 'Standard', desc: 'Balanced padding & breathing room' },
        { value: 'airy', label: 'Airy', desc: 'Luxurious spacious whitespace' },
      ]
    },
    {
      title: 'Color Vibe',
      key: 'color_theme',
      icon: <Palette className="w-4 h-4" />,
      options: [
        { value: 'true_dark', label: 'OLED Black', desc: 'Deep true black (#000000)' },
        { value: 'dim', label: 'Dim Charcoal', desc: 'Soft dark grey (#121214)' },
        { value: 'tinted', label: 'Brand Tinted', desc: 'Subtle wash of brand color' },
        { value: 'light', label: 'Clean Light', desc: 'Studio white (#fbfbfb)' },
      ]
    }
  ]

  return (
    <div className={`space-y-6 ${!isLiveBuilder ? 'rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 mt-8' : ''}`}>
      {/* ── 1-Click Curated Theme Presets ── */}
      <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            1-Click Theme Presets
          </label>
          <span className="text-[10px] text-zinc-500 font-medium">1-Tap Coordinated Styles</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {QUICK_THEME_PRESETS.map((preset) => {
            const isMatch = Object.entries(preset.tokens).every(
              ([k, v]) => tokens[k] === v
            )
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`text-left p-3 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                  isMatch
                    ? 'border-emerald-500/80 bg-emerald-500/10 shadow-sm'
                    : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">{preset.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      {preset.name}
                      {isMatch && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold">Active</span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{preset.tagline}</div>
                  </div>
                </div>
                {isMatch && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Inline Brand Accent Color Studio ── */}
      <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
            <Palette className="w-3.5 h-3.5 text-emerald-400" />
            Brand Accent Palette
          </label>
          <span className="text-[10px] font-mono text-zinc-400">{activeColor.toUpperCase()}</span>
        </div>

        {/* Color Swatches Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {BRAND_PALETTES.map((color) => {
            const isSelected = activeColor.toLowerCase() === color.hex.toLowerCase()
            return (
              <button
                key={color.hex}
                type="button"
                onClick={() => handleColorSelect(color.hex)}
                className={`relative h-9 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                  isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-105 shadow-md' : 'opacity-80 hover:opacity-100 hover:scale-105'
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />}
              </button>
            )
          })}
        </div>

        {/* Custom Hex Input */}
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
          <span className="text-xs text-zinc-500 font-medium">Custom HEX:</span>
          <div className="relative flex-1">
            <input
              type="text"
              value={activeColor}
              onChange={(e) => handleColorSelect(e.target.value)}
              placeholder="#10b981"
              maxLength={7}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:border-emerald-500 outline-none"
            />
          </div>
          <input
            type="color"
            value={activeColor.startsWith('#') && activeColor.length === 7 ? activeColor : '#10b981'}
            onChange={(e) => handleColorSelect(e.target.value)}
            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
            title="Open color wheel"
          />
        </div>
      </div>

      {/* ── Granular 7-Section Design Tokens Form ── */}
      <ActionForm id="design-tokens-form" action={pageId ? savePageDesignTokens : saveLocationDesignTokens} className="flex flex-col gap-6">
        <input type="hidden" name={pageId ? "pageId" : "locationId"} value={pageId ? pageId : locationId} />
        
        {sections.map(section => (
          <div key={section.key} className="space-y-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <div className="text-emerald-400">
                {section.icon}
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                {section.title}
              </h3>
            </div>
            <input type="hidden" name={section.key} value={tokens[section.key] || ''} />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {section.options.map(option => {
                const isSelected = tokens[section.key] === option.value || (!tokens[section.key] && option.value === section.options[0].value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(section.key, option.value)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-sm' 
                        : 'border-zinc-800/90 bg-zinc-950/70 hover:border-zinc-700'
                    }`}
                  >
                    <div className={`text-xs font-bold mb-0.5 ${isSelected ? 'text-emerald-400' : 'text-zinc-200'}`}>
                      {option.label}
                    </div>
                    <div className={`text-[10px] leading-relaxed ${isSelected ? 'text-emerald-400/80' : 'text-zinc-500'}`}>
                      {option.desc}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-zinc-800 flex flex-col gap-3">
          <SubmitButton className="w-full h-11 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/20">
            {pageId ? 'Save Custom Page Design' : 'Save Global Brand Aesthetic'}
          </SubmitButton>
          
          {pageId && Object.keys(tokens).length > 0 && (
            <button 
              type="button"
              onClick={() => {
                setTokens({})
                if (onTokensChange) onTokensChange({})
                const form = document.getElementById('design-tokens-form') as HTMLFormElement
                if (form) {
                  form.querySelectorAll('input[type="hidden"]').forEach(el => {
                    if (el.getAttribute('name') !== 'pageId') (el as HTMLInputElement).value = ''
                  })
                  form.requestSubmit()
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors cursor-pointer"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Revert Page to Global Settings
            </button>
          )}
        </div>
      </ActionForm>
    </div>
  )
}
