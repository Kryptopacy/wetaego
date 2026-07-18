import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function IouLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans animate-pulse">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
            <ChevronLeft className="w-4 h-4" />
            Back
          </div>
          <div className="w-20 h-6 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        </div>

        {/* Amount Due Skeleton */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 mb-6 text-center">
          <div className="w-24 h-4 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto mb-4"></div>
          <div className="w-40 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl mx-auto"></div>
        </div>

        {/* Form Skeleton */}
        <div className="space-y-4">
          <div className="w-full h-14 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl"></div>
          <div className="w-full h-14 bg-zinc-200 dark:bg-zinc-800 rounded-2xl"></div>
        </div>
      </div>
    </div>
  )
}
