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
}

const ThemeContext = createContext<{ tokens: ThemeTokens; themeColor?: string }>({ tokens: {} })

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeInjector({ 
  initialTokens, 
  themeColor,
  children
}: { 
  initialTokens: ThemeTokens
  themeColor?: string
  children?: ReactNode
}) {
  const [tokens, setTokens] = useState<ThemeTokens>(initialTokens)

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'LIVE_PREVIEW_TOKENS') {
        const { tokens: newTokens } = e.data
        // We accept updates regardless of isGlobal, because in preview mode, 
        // the builder broadcasts the merged state that should be displayed.
        setTokens(prev => ({ ...prev, ...newTokens }))
      }
    }
    window.addEventListener('message', handleMessage)
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
    root.style.setProperty('--storefront-radius', radiusMap[r])
    root.style.setProperty('--storefront-radius-inner', radiusMap[r === 'full' ? 'full' : r === 'none' ? 'none' : 'md'])

    // Apply Density (Gap & Padding)
    const gapMap: Record<string, string> = { airy: '2rem', standard: '1rem', cozy: '0.5rem' }
    const padMap: Record<string, string> = { airy: '2rem', standard: '1rem', cozy: '0.5rem' }
    const d = tokens.density || 'standard'
    root.style.setProperty('--storefront-gap', gapMap[d])
    root.style.setProperty('--storefront-padding', padMap[d])

    // Apply Surface Style Background
    const surface = tokens.surface_style || 'flat'
    root.style.setProperty('--storefront-surface-mode', surface)
    
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
