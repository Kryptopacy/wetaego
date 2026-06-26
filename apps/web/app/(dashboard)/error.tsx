'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error('Dashboard Error Boundary caught:', error)
  }, [error])

  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center p-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 shadow-lg shadow-red-900/20">
        <AlertTriangle className="h-10 w-10 text-red-500" />
      </div>
      
      <h2 className="mb-2 text-2xl font-bold text-white tracking-tight">Something went wrong!</h2>
      
      <p className="mb-8 max-w-md text-zinc-400">
        Your data is safe, but we couldn&apos;t render this page.
      </p>

      <button
        onClick={() => reset()}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition-all hover:scale-105 hover:from-violet-500 hover:to-indigo-500"
      >
        <RefreshCcw className="h-4 w-4" />
        Try again
      </button>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-12 w-full max-w-2xl rounded-xl bg-black/50 p-4 text-left border border-red-500/30 overflow-auto">
          <p className="mb-2 font-mono text-sm font-bold text-red-400">Developer Stack Trace:</p>
          <pre className="font-mono text-xs text-zinc-500 whitespace-pre-wrap">
            {error.message}
            {'\n'}
            {error.stack}
          </pre>
        </div>
      )}
    </div>
  )
}
