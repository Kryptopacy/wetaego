'use client' // Error components must be Client Components

import { useEffect } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service like Sentry
    console.error('Global Error Boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white">
      <div className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-black mb-3">Something went wrong</h2>
        <p className="text-zinc-400 text-sm mb-8">
          We encountered an unexpected error. Our team has been notified. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="w-full py-3 px-4 bg-white text-black font-bold rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Try Again
        </button>
      </div>
    </div>
  )
}
