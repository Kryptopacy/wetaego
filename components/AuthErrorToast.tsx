'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { usePathname } from 'next/navigation'

export function AuthErrorToast() {
  const pathname = usePathname()

  useEffect(() => {
    // Only run on the client
    if (typeof window === 'undefined') return

    // Supabase OAuth errors are often appended as hash fragments
    const hash = window.location.hash
    if (hash && hash.includes('error=')) {
      const params = new URLSearchParams(hash.replace('#', '?'))
      const error = params.get('error')
      const errorDescription = params.get('error_description')

      if (error) {
        let displayMessage = errorDescription?.replace(/\+/g, ' ') || 'Authentication failed'
        
        // Enhance specific known Supabase errors
        if (displayMessage.includes('Unable to exchange external code')) {
          displayMessage = 'Google Sign In Failed: Supabase could not exchange the Google code. Please check your Supabase Dashboard -> Authentication -> Providers -> Google settings and ensure your Client Secret has no trailing spaces.'
        }

        toast.error('Authentication Error', {
          description: displayMessage,
          duration: 10000,
        })

        // Clean up the URL hash without triggering a reload
        window.history.replaceState(null, '', pathname)
      }
    }
  }, [pathname])

  return null
}
