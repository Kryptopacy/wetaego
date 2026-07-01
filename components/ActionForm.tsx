'use client'

import { toast } from 'sonner'
import { ReactNode } from 'react'
import confetti from 'canvas-confetti'

type LegacyActionResponse = { error?: string; success?: boolean; data?: unknown } | void
type SafeActionResponse = { serverError?: string; validationErrors?: Record<string, string[]>; data?: unknown } | void
type ActionResponse = LegacyActionResponse | SafeActionResponse

interface ActionFormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'action'> {
  action: (formData: FormData) => Promise<ActionResponse>
  successMessage?: string
  triggerConfettiOnSuccess?: boolean
  children: ReactNode
}

export function ActionForm({ action, successMessage, triggerConfettiOnSuccess, children, ...props }: ActionFormProps) {
  return (
    <form
      {...props}
      action={async (formData) => {
        try {
          const res = await action(formData)
          if (res && 'serverError' in res && res.serverError) {
            toast.error(res.serverError)
          } else if (res && 'validationErrors' in res && res.validationErrors) {
            toast.error(Object.values(res.validationErrors).flat()[0] || 'Validation failed')
          } else if (res && 'error' in res && res.error) {
            toast.error(res.error)
          } else if ((res && 'success' in res && res.success) || (res && 'data' in res && res.data) || successMessage) {
            toast.success(successMessage || 'Saved successfully')
            if (triggerConfettiOnSuccess) {
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10b981', '#3b82f6', '#f59e0b', '#e4e4e7']
              })
            }
          }
        } catch (error: unknown) {
          if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error
          }
          toast.error((error as Error).message || 'An unexpected error occurred')
        }
      }}
    >
      {children}
    </form>
  )
}
