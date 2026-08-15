export default function FeedbackLoading() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl animate-pulse space-y-6">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800" />
          <div className="w-48 h-6 rounded-lg bg-zinc-800" />
          <div className="w-64 h-4 rounded-lg bg-zinc-800/60" />
        </div>

        <div className="space-y-4 pt-4 border-t border-zinc-800/60">
          <div className="w-32 h-4 rounded bg-zinc-800 mx-auto" />
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-10 h-10 rounded-xl bg-zinc-800/80" />
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <div className="w-full h-24 rounded-2xl bg-zinc-800/40 border border-zinc-800" />
        </div>

        <div className="w-full h-12 rounded-2xl bg-zinc-800" />
      </div>
    </div>
  )
}
