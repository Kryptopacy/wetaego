import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function TrackLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black animate-pulse">
      <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <ChevronLeft className="w-4 h-4" />
          Back to Store
        </div>
        <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
      </div>
      
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 md:p-10 shadow-sm flex flex-col md:flex-row gap-10 md:gap-16">
          <div className="flex-1 space-y-6">
            <div className="h-8 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            <div className="space-y-4 pt-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-200 dark:bg-zinc-800"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                    <div className="h-3 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full md:w-72 space-y-6">
            <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl"></div>
            <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
          </div>
        </div>
      </main>
    </div>
  )
}
