'use client'

import React from 'react'

interface ItemImagePlaceholderProps {
  title?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ItemImagePlaceholder({
  title = '',
  className = '',
  size = 'md',
}: ItemImagePlaceholderProps) {
  const cleanTitle = title.trim()
  const monogram = cleanTitle ? cleanTitle.slice(0, 2).toUpperCase() : 'OM'

  const textSizes = {
    sm: 'text-xs tracking-wider',
    md: 'text-sm sm:text-base tracking-widest',
    lg: 'text-lg sm:text-xl tracking-widest',
  }

  return (
    <div
      className={`relative w-full h-full select-none flex items-center justify-center bg-gradient-to-br from-zinc-800/90 via-zinc-900 to-zinc-950 overflow-hidden ${className}`}
    >
      {/* Subtle radial ambient vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.04),transparent_70%)] pointer-events-none" />

      {/* Subtle geometric luxury border */}
      <div className="absolute inset-0 border border-white/5 pointer-events-none" />

      {/* Clean, centered luxury monogram */}
      <span
        className={`relative z-10 font-black uppercase text-zinc-400/90 group-hover:text-emerald-400 group-hover:scale-105 transition-all duration-300 ${textSizes[size]}`}
      >
        {monogram}
      </span>
    </div>
  )
}
