export default function MenuLoading() {
  return (
    <div className="max-w-2xl mx-auto min-h-screen p-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="h-32 bg-zinc-900 rounded-2xl mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 skeleton-shimmer"></div>
      </div>
      
      <div className="text-center mb-10">
        <div className="h-8 bg-zinc-800 rounded w-1/3 mx-auto mb-3"></div>
        <div className="h-4 bg-zinc-800 rounded w-1/2 mx-auto"></div>
      </div>

      {/* Categories Skeleton */}
      <div className="flex gap-4 overflow-x-auto pb-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-10 w-24 bg-zinc-800 rounded-full shrink-0"></div>
        ))}
      </div>

      {/* Items Skeleton */}
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <div className="flex-1">
              <div className="h-6 bg-zinc-800 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-zinc-800 rounded w-full mb-1"></div>
              <div className="h-4 bg-zinc-800 rounded w-2/3 mb-4"></div>
              <div className="h-5 bg-zinc-800 rounded w-1/4"></div>
            </div>
            <div className="w-24 h-24 bg-zinc-800 rounded-xl shrink-0"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
