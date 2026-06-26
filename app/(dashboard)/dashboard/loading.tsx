export default function DashboardLoading() {
  return (
    <div className="max-w-4xl animate-pulse">
      <div className="h-8 bg-zinc-800 rounded w-1/4 mb-8"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 border border-zinc-800 rounded-xl bg-zinc-900/50">
            <div className="h-6 bg-zinc-800 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-zinc-800 rounded w-2/3"></div>
            <div className="mt-6 h-10 bg-zinc-800 rounded-lg w-full"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
