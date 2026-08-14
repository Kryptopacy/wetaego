import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: ReactNode
  className?: string
}

/**
 * Standardized empty state container across all dashboard pages.
 * Replaces plain text strings with branded visual cues and clear action triggers.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = ''
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-3xl border border-white/6 bg-linear-to-b from-zinc-900/60 to-zinc-950/80 p-10 sm:p-12 text-center flex flex-col items-center justify-center relative overflow-hidden shadow-xl ${className}`}
    >
      {/* Ambient center blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />

      {Icon && (
        <div className="relative mb-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900/80 border border-white/8 flex items-center justify-center shadow-lg relative z-10">
            <Icon className="w-6 h-6 text-zinc-400" />
          </div>
          <div className="absolute inset-0 bg-emerald-500/10 blur-md rounded-2xl" />
        </div>
      )}

      <h3 className="text-base font-bold text-white tracking-tight relative z-10">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 max-w-sm leading-relaxed relative z-10">
        {description}
      </p>

      {action && (
        <div className="mt-6 relative z-10">
          {action}
        </div>
      )}
    </div>
  )
}
