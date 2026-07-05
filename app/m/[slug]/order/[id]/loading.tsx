export default function LoadingOrderTracker() {
  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans animate-pulse">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mt-4">
          <div className="space-y-2">
            <div className="w-32 h-6 bg-zinc-800 rounded-md"></div>
            <div className="w-24 h-4 bg-zinc-800 rounded-md"></div>
          </div>
          <div className="w-20 h-8 bg-zinc-800 rounded-full"></div>
        </div>

        {/* Progress Tracker Skeleton */}
        <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 space-y-8 mt-6">
          <div className="w-48 h-6 bg-zinc-800 rounded-md mb-4"></div>
          
          <div className="relative pt-4">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-zinc-800"></div>
            <div className="space-y-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="relative flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0 z-10 border-4 border-zinc-900"></div>
                  <div className="space-y-2 flex-1 pt-1">
                    <div className="w-32 h-5 bg-zinc-800 rounded-md"></div>
                    <div className="w-48 h-4 bg-zinc-800 rounded-md"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Details Skeleton */}
        <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 space-y-4">
          <div className="w-32 h-6 bg-zinc-800 rounded-md mb-4"></div>
          {[1, 2].map((item) => (
            <div key={item} className="flex justify-between items-center py-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-800 rounded-lg"></div>
                <div className="w-32 h-4 bg-zinc-800 rounded-md"></div>
              </div>
              <div className="w-16 h-4 bg-zinc-800 rounded-md"></div>
            </div>
          ))}
          <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
            <div className="w-24 h-5 bg-zinc-800 rounded-md"></div>
            <div className="w-20 h-6 bg-zinc-800 rounded-md"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
