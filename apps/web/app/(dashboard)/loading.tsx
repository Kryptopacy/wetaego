export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
      {/* Skeleton Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="h-4 w-48 bg-zinc-800 rounded mb-3"></div>
          <div className="h-8 w-64 bg-zinc-800 rounded mb-2"></div>
          <div className="h-4 w-96 bg-zinc-800 rounded"></div>
        </div>
        <div className="hidden md:block h-10 w-32 bg-zinc-800 rounded-xl"></div>
      </div>

      {/* Skeleton Quick Actions */}
      <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6">
        <div className="h-4 w-32 bg-zinc-800 rounded mb-4"></div>
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-36 bg-zinc-800 rounded-xl"></div>
          ))}
        </div>
      </div>

      {/* Skeleton Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-5 h-36">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 mb-4"></div>
            <div className="h-3 w-20 bg-zinc-800 rounded mb-2"></div>
            <div className="h-8 w-16 bg-zinc-800 rounded"></div>
          </div>
        ))}
      </div>

      {/* Skeleton Modules Grid */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 rounded-lg bg-zinc-800"></div>
          <div className="h-5 w-40 bg-zinc-800 rounded"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-5 h-48">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 mb-4"></div>
              <div className="h-4 w-3/4 bg-zinc-800 rounded mb-2"></div>
              <div className="h-16 w-full bg-zinc-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
