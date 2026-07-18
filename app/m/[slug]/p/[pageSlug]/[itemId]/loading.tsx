import Image from 'next/image'
import { ChevronLeft } from 'lucide-react'

export default function ItemDetailLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black animate-pulse">
      {/* Back nav */}
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-2 flex items-center gap-2">
        <ChevronLeft className="w-4 h-4 text-zinc-400" />
        <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-8">
        {/* Image skeleton */}
        <div className="w-full md:w-80 shrink-0">
          <div className="aspect-square w-full bg-zinc-200 dark:bg-zinc-800 rounded-3xl" />
          {/* Thumbnail strip */}
          <div className="flex gap-2 mt-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Content skeleton */}
        <div className="flex-1 space-y-5">
          {/* Badge */}
          <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
          {/* Title */}
          <div className="h-8 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          {/* Price */}
          <div className="h-7 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          {/* Description lines */}
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
          {/* Variants */}
          <div className="space-y-3 pt-2">
            <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-9 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
              ))}
            </div>
          </div>
          {/* CTA button */}
          <div className="h-14 w-full bg-zinc-200 dark:bg-zinc-800 rounded-2xl mt-6" />
        </div>
      </div>
    </div>
  )
}
