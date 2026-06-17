export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">You&apos;re offline</h1>
      <p className="text-zinc-500 text-sm max-w-xs leading-relaxed mb-8">
        It looks like your internet connection dropped. Reconnect and try again — your data is safe.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-zinc-100 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
