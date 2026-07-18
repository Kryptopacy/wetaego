export default function FeedbackLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 flex items-center justify-center animate-pulse">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md p-8 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex flex-col items-center">
        {/* Logo/Icon Skeleton */}
        <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-2xl mb-6"></div>
        
        {/* Title Skeleton */}
        <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-md mb-2"></div>
        <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded-md mb-8"></div>
        
        {/* Star Rating Skeleton */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
          ))}
        </div>
        
        {/* Tip Amount Skeleton */}
        <div className="w-full space-y-4 mb-8">
          <div className="h-4 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex-1 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
            ))}
          </div>
        </div>
        
        {/* Button Skeleton */}
        <div className="w-full h-14 bg-zinc-200 dark:bg-zinc-800 rounded-2xl mt-4"></div>
      </div>
    </div>
  )
}
