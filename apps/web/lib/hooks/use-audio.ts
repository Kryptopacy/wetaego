'use client'

import { useEffect, useRef, useCallback } from 'react'

export function useAudioAlert() {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // We use a gentle, modern, high-quality chime. A base64 embedded short MP3/WAV is ideal
    // or pointing to a public asset if we had one. Since we don't know if a public asset exists,
    // we can use a synthesized beep to avoid 404s, or point to a typical static path.
    // Let's create a tiny synthesized bell sound so it works instantly without assets.
    
    // Create AudioContext lazily on play to comply with browser autoplay policies.
  }, [])

  const playChime = useCallback(() => {
    try {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) return
      
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()

      osc.connect(gainNode)
      gainNode.connect(ctx.destination)

      // A pleasant ding (like a hotel bell or soft ping)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1) // up to A6
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 1.5)
    } catch (e) {
      console.error('Audio chime failed', e)
    }
  }, [])

  return { playChime }
}
