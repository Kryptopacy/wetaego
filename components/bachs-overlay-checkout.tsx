'use client'

import { useEffect, useState, useCallback } from 'react'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Bachs?: any
  }
}

export interface BachsCheckoutEvent {
  type:
    | 'checkout.opened'
    | 'checkout.loaded'
    | 'checkout.ready'
    | 'checkout.completed'
    | 'checkout.failed'
    | 'checkout.expired'
    | 'checkout.closed'
    | 'checkout.error'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
}

export function useBachsOverlay(onEvent?: (event: BachsCheckoutEvent) => void) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (window.Bachs) {
      window.Bachs.Initialize({
        onEvent: (evt: BachsCheckoutEvent) => {
          onEvent?.(evt)
        },
      })
      setIsReady(true)
      return
    }

    const scriptId = 'bachs-checkout-sdk-js'
    if (document.getElementById(scriptId)) {
      setIsReady(true)
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://checkout.bachs.io/bachs.js'
    script.async = true
    script.onload = () => {
      if (window.Bachs) {
        window.Bachs.Initialize({
          onEvent: (evt: BachsCheckoutEvent) => {
            onEvent?.(evt)
          },
        })
        setIsReady(true)
      }
    }
    document.body.appendChild(script)
  }, [onEvent])

  const openCheckout = useCallback(
    ({
      checkoutUrl,
      options,
    }: {
      checkoutUrl: string
      options?: { showCloseButton?: boolean; autoCloseOnComplete?: boolean }
    }) => {
      if (!window.Bachs || !window.Bachs.Checkout) {
        // Fallback to full page navigation if SDK script is blocked or unavailable
        window.location.href = checkoutUrl
        return
      }
      window.Bachs.Checkout.open({
        checkoutUrl,
        options: {
          showCloseButton: true,
          autoCloseOnComplete: true,
          ...options,
        },
      })
    },
    []
  )

  const closeCheckout = useCallback(() => {
    if (window.Bachs?.Checkout?.close) {
      window.Bachs.Checkout.close()
    }
  }, [])

  return {
    isReady,
    openCheckout,
    closeCheckout,
  }
}

export function preloadBachsSdk() {
  if (typeof window === 'undefined') return
  if (window.Bachs || document.getElementById('bachs-checkout-sdk-js')) return

  const script = document.createElement('script')
  script.id = 'bachs-checkout-sdk-js'
  script.src = 'https://checkout.bachs.io/bachs.js'
  script.async = true
  document.body.appendChild(script)
}

export function openSeamlessCheckout(checkoutUrl: string) {
  if (typeof window === 'undefined') return
  if (window.Bachs && window.Bachs.Checkout) {
    try {
      window.Bachs.Checkout.open({
        checkoutUrl,
        options: {
          showCloseButton: true,
          autoCloseOnComplete: true,
        },
      })
      return
    } catch {
      // Fallback if overlay open fails
    }
  }
  window.location.assign(checkoutUrl)
}

