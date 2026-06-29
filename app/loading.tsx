import { Loader2 } from 'lucide-react'

export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 font-sans text-zinc-100">
      <div className="relative flex flex-col items-center gap-4">
        {/* Glowing ring effect */}
        <div className="absolute -inset-4 animate-pulse rounded-full bg-violet-500/20 blur-xl" />
        <Loader2 className="h-10 w-10 animate-spin text-violet-500 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
        <p className="text-sm font-medium tracking-widest text-zinc-400 uppercase">
          Loading
        </p>
      </div>
    </div>
  )
}
