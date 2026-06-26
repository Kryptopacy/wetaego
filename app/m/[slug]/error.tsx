'use client'

import { useEffect } from 'react'

export default function GuestMenuError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error('Guest Menu Error:', error)
  }, [error])

  // Detect if the error is likely a network issue
  const isNetworkError = 
    typeof window !== 'undefined' && 
    (!window.navigator.onLine || error.message.toLowerCase().includes('fetch') || error.message.toLowerCase().includes('network'))

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
        {isNetworkError ? (
          <svg className="w-10 h-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        ) : (
          <svg className="w-10 h-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
      </div>
      
      <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
        {isNetworkError ? "Connection Lost" : "Oops! Something went wrong."}
      </h1>
      
      <p className="text-zinc-400 text-[15px] max-w-[280px] leading-relaxed mb-10">
        {isNetworkError 
          ? "It looks like you've hit a dead zone. Connect to a stronger network to view the live menu."
          : "We encountered an unexpected error while loading the menu. Don't worry, your cart is safe."}
      </p>
      
      <button
        onClick={() => reset()}
        className="h-14 px-10 rounded-full bg-white text-black text-[15px] font-bold hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
      >
        Try Again
      </button>
    </div>
  )
}
