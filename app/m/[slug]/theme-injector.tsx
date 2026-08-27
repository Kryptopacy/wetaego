'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface ThemeTokens {
  layout_mode?: 'bento_grid' | 'masonry' | 'list'
  corner_radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  surface_style?: 'flat' | 'glassmorphism' | 'neumorphism'
  typography?: 'modern' | 'elegant' | 'playful' | 'industrial'
  animation_style?: 'energetic' | 'elegant' | 'instant'
  density?: 'airy' | 'standard' | 'cozy'
  color_theme?: 'true_dark' | 'dim' | 'light' | 'tinted'
  aspect_ratio?: 'portrait_3_4' | 'square_1_1' | 'wide_16_9' | 'compact_row'
}

const ThemeContext = createContext<{ tokens: ThemeTokens; themeColor?: string }>({ tokens: {} })

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeInjector({ 
  initialTokens, 
  themeColor: initialThemeColor,
  children
}: { 
  initialTokens: ThemeTokens
  themeColor?: string
  children?: ReactNode
}) {
  const [tokens, setTokens] = useState<ThemeTokens>(initialTokens)
  const [themeColor, setThemeColor] = useState<string | undefined>(initialThemeColor)

  // Listen for real-time postMessages from builder
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'LIVE_PREVIEW_TOKENS') {
        const { tokens: newTokens, themeColor: newThemeColor } = e.data
        if (newTokens && typeof newTokens === 'object') {
          setTokens(prev => ({ ...prev, ...newTokens }))
        }
        if (newThemeColor) {
          setThemeColor(newThemeColor)
        }
      }
    }
    window.addEventListener('message', handleMessage)

    // Notify parent builder that iframe is mounted and ready for initial tokens
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'LIVE_PREVIEW_READY' }, '*')
    }

    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    
    // Apply Corner Radius
    const radiusMap: Record<string, string> = {
      none: '0px',
      sm: '4px',
      md: '8px',
      lg: '16px',
      xl: '24px',
      full: '9999px'
    }
    const r = tokens.corner_radius || 'lg'
    root.style.setProperty('--storefront-radius', radiusMap[r] || '16px')
    root.style.setProperty('--storefront-radius-inner', radiusMap[r === 'full' ? 'full' : r === 'none' ? 'none' : 'md'] || '8px')

    // Apply Density (Gap & Padding)
    const gapMap: Record<string, string> = { airy: '2rem', standard: '1rem', cozy: '0.5rem' }
    const padMap: Record<string, string> = { airy: '2rem', standard: '1rem', cozy: '0.5rem' }
    const d = tokens.density || 'standard'
    root.style.setProperty('--storefront-gap', gapMap[d] || '1rem')
    root.style.setProperty('--storefront-padding', padMap[d] || '1rem')

    // Apply Typography
    const fontMap: Record<string, string> = {
      elegant: 'var(--font-elegant), serif',
      playful: 'var(--font-playful), sans-serif',
      industrial: 'var(--font-industrial), monospace',
      modern: 'var(--font-modern), sans-serif',
    }
    const typo = tokens.typography || 'modern'
    root.style.setProperty('--storefront-font', fontMap[typo] || fontMap.modern)
    root.classList.remove('font-serif', 'font-mono')
    if (typo === 'elegant') {
      root.classList.add('font-serif')
    } else if (typo === 'industrial') {
      root.classList.add('font-mono')
    }

    // Apply Surface Style Background
    const surface = tokens.surface_style || 'flat'
    root.style.setProperty('--storefront-surface-mode', surface)
    
    // Apply Card Aspect Ratio
    const aspectMap: Record<string, string> = {
      portrait_3_4: '3/4',
      square_1_1: '1/1',
      wide_16_9: '16/9',
      compact_row: '16/9'
    }
    const asp = tokens.aspect_ratio || 'square_1_1'
    root.style.setProperty('--storefront-card-aspect', aspectMap[asp] || '1/1')

    // Apply Theme Color
    if (themeColor) {
      root.style.setProperty('--theme-color', themeColor)
    }

  }, [tokens, themeColor])

  // Also apply color_theme classes to HTML
  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('dark', 'light', 'theme-dim', 'theme-tinted', 'theme-true-dark')
    
    const theme = tokens.color_theme || 'light'
    if (theme === 'light') {
      html.classList.add('light')
    } else {
      html.classList.add('dark')
      if (theme === 'dim') html.classList.add('theme-dim')
      if (theme === 'tinted') html.classList.add('theme-tinted')
      if (theme === 'true_dark') html.classList.add('theme-true-dark')
    }
  }, [tokens.color_theme])

  return (
    <ThemeContext.Provider value={{ tokens, themeColor }}>
      {children}
    </ThemeContext.Provider>
  )
}
