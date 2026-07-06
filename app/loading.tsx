import { GemstoneSpinner } from '@/components/ui/gemstone-spinner'

export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 font-sans text-zinc-100">
      <div className="relative flex flex-col items-center gap-6">
        <GemstoneSpinner size="lg" />
        <p className="text-sm font-medium tracking-widest text-zinc-400 uppercase animate-pulse">
          Loading
        </p>
      </div>
    </div>
  )
}
