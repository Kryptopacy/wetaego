'use client'

import { useEffect } from 'react'
import type { ThemeTokens } from '../../theme-injector'

export function PageThemeOverride({ pageTokens }: { pageTokens?: ThemeTokens }) {
  useEffect(() => {
    // If pageTokens has keys, broadcast them so ThemeInjector picks them up and merges them
    if (pageTokens && Object.keys(pageTokens).length > 0) {
      window.postMessage({
        type: 'LIVE_PREVIEW_TOKENS',
        tokens: pageTokens,
        isGlobal: false
      }, '*')
    }
  }, [pageTokens])

  return null
}
