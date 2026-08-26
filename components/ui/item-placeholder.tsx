'use client'

import React from 'react'
import { UtensilsCrossed, Wine, Coffee, Sparkles, Package, ShoppingBag, Flame } from 'lucide-react'

interface ItemImagePlaceholderProps {
  title?: string
  category?: string
  className?: string
  iconSize?: 'sm' | 'md' | 'lg'
}

export function ItemImagePlaceholder({
  title = '',
  category = '',
  className = '',
  iconSize = 'md',
}: ItemImagePlaceholderProps) {
  const cleanTitle = title.trim()
  const monogram = cleanTitle ? cleanTitle.slice(0, 2).toUpperCase() : 'OM'

  // Pick a contextually relevant luxury icon based on keywords
  const lower = `${cleanTitle} ${category}`.toLowerCase()
  let Icon = Sparkles

  if (lower.includes('drink') || lower.includes('wine') || lower.includes('cocktail') || lower.includes('beer') || lower.includes('juice') || lower.includes('beverage')) {
    Icon = Wine
  } else if (lower.includes('coffee') || lower.includes('latte') || lower.includes('tea') || lower.includes('espresso') || lower.includes('cappuccino')) {
    Icon = Coffee
  } else if (lower.includes('burger') || lower.includes('pizza') || lower.includes('steak') || lower.includes('chicken') || lower.includes('rice') || lower.includes('soup') || lower.includes('pasta') || lower.includes('food') || lower.includes('dish') || lower.includes('grill')) {
    Icon = lower.includes('grill') || lower.includes('hot') ? Flame : UtensilsCrossed
  } else if (lower.includes('shirt') || lower.includes('dress') || lower.includes('wear') || lower.includes('shoes') || lower.includes('apparel')) {
    Icon = ShoppingBag
  } else if (lower.includes('box') || lower.includes('pack') || lower.includes('set')) {
    Icon = Package
  }

  const iconDimensions = iconSize === 'sm' ? 'w-3.5 h-3.5' : iconSize === 'lg' ? 'w-6 h-6' : 'w-4 h-4'

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none flex items-center justify-center bg-gradient-to-br from-zinc-800/90 via-zinc-900 to-zinc-950 border border-white/5 ${className}`}
    >
      {/* Subtle radial ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.08),transparent_60%)]" />

      {/* Stylized background typographic watermark */}
      <span className="absolute -bottom-2 -right-1 text-3xl sm:text-4xl font-black text-zinc-800/30 tracking-tighter pointer-events-none uppercase">
        {monogram}
      </span>

      {/* Floating frosted glass icon emblem */}
      <div className="relative z-10 p-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-700/60 shadow-lg shadow-black/40 backdrop-blur-md text-zinc-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30 group-hover:scale-105 transition-all duration-300">
        <Icon className={iconDimensions} />
      </div>
    </div>
  )
}
