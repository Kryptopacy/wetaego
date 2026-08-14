import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  action?: ReactNode
}

/**
 * Shared page header component for all dashboard pages.
 * Sits directly below the sticky top bar and provides a consistent
 * title zone with optional description, eyebrow, and action slot.
 */
export function PageHeader({ title, description, eyebrow, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0 mt-0.5">
          {action}
        </div>
      )}
    </div>
  )
}
