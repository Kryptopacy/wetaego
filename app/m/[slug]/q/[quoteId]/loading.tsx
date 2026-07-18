import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function QuoteLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans animate-pulse">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
            <ChevronLeft className="w-4 h-4" />
            Back
          </div>
          <div className="w-32 h-6 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        </div>

        {/* Content Skeleton */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 md:p-10">
          <div className="space-y-4 mb-8">
            <div className="w-48 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
            <div className="w-32 h-4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          </div>
          
          <div className="space-y-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-start">
                <div className="space-y-2 flex-1 pr-4">
                  <div className="w-3/4 h-5 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                  <div className="w-1/2 h-3 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                </div>
                <div className="w-20 h-5 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-end">
            <div className="w-24 h-4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            <div className="w-32 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
