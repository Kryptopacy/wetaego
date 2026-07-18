import { GemstoneSpinner } from '@/components/ui/gemstone-spinner'

export default function FeedbackVerifyLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black font-sans">
      <div className="relative flex flex-col items-center gap-6">
        <GemstoneSpinner size="lg" />
        <p className="text-sm font-medium tracking-widest text-zinc-400 uppercase animate-pulse">
          Verifying...
        </p>
      </div>
    </div>
  )
}
