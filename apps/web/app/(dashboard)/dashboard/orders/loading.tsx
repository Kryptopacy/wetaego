export default function OrdersLoading() {
  return (
    <div className="flex-1 flex flex-col mt-8 animate-pulse">
      {/* Tabs Skeleton */}
      <div className="flex space-x-2 mb-6">
        <div className="h-10 w-32 bg-zinc-800 rounded-lg"></div>
        <div className="h-10 w-40 bg-zinc-800 rounded-lg"></div>
        <div className="h-10 w-28 bg-zinc-800 rounded-lg"></div>
      </div>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:h-[calc(100vh-12rem)]">
        {/* Requests Column Skeleton */}
        <div className="col-span-1 border border-zinc-800 rounded-xl bg-zinc-900/30 flex flex-col">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
            <div className="h-5 w-32 bg-zinc-800 rounded"></div>
            <div className="h-5 w-8 bg-zinc-800 rounded-full"></div>
          </div>
          <div className="p-4 space-y-4">
            <div className="h-32 bg-zinc-800/50 rounded-lg"></div>
            <div className="h-32 bg-zinc-800/50 rounded-lg"></div>
          </div>
        </div>

        {/* Orders Column Skeleton */}
        <div className="col-span-1 lg:col-span-2 border border-zinc-800 rounded-xl bg-zinc-900/30 flex flex-col">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
            <div className="h-5 w-32 bg-zinc-800 rounded"></div>
            <div className="h-5 w-8 bg-zinc-800 rounded-full"></div>
          </div>
          <div className="p-4 space-y-4">
            <div className="h-48 bg-zinc-800/50 rounded-lg"></div>
            <div className="h-48 bg-zinc-800/50 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
