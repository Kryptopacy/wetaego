export default function Loading() {
  return (
    <div className="flex-1 flex flex-col p-6 lg:p-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 bg-zinc-800 rounded-lg mb-2"></div>
        <div className="h-4 w-96 bg-zinc-800/50 rounded-lg"></div>
      </div>

      {/* Content Skeleton */}
      <div className="space-y-6">
        <div className="h-64 bg-zinc-900 border border-zinc-800 rounded-xl"></div>
        <div className="h-64 bg-zinc-900 border border-zinc-800 rounded-xl"></div>
      </div>
    </div>
  )
}
