export default function LoadingPaymentPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-black text-white p-4 font-sans animate-pulse">
      <div className="max-w-md w-full mx-auto space-y-6 mt-8 flex-1">
        {/* Header Skeleton */}
        <div className="text-center space-y-2">
          <div className="w-48 h-8 bg-zinc-800 rounded-md mx-auto"></div>
          <div className="w-32 h-4 bg-zinc-800 rounded-md mx-auto"></div>
        </div>

        {/* Bill Summary Skeleton */}
        <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex justify-between items-center py-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-800 rounded-lg"></div>
                <div className="w-24 h-4 bg-zinc-800 rounded-md"></div>
              </div>
              <div className="w-16 h-4 bg-zinc-800 rounded-md"></div>
            </div>
          ))}
          
          <div className="border-t border-dashed border-zinc-800 pt-4 mt-2 space-y-3">
            <div className="flex justify-between items-center">
              <div className="w-20 h-4 bg-zinc-800 rounded-md"></div>
              <div className="w-16 h-4 bg-zinc-800 rounded-md"></div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="w-24 h-6 bg-zinc-800 rounded-md"></div>
              <div className="w-28 h-6 bg-zinc-800 rounded-md"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Drawer Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-full h-14 bg-zinc-800 rounded-xl"></div>
          <div className="flex gap-2 pt-2">
            <div className="flex-1 h-12 bg-zinc-800 rounded-xl"></div>
            <div className="w-24 h-12 bg-zinc-800 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
