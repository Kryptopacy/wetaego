'use client'

import { toast } from 'sonner'
import { ReactNode } from 'react'

type ActionResponse = { error?: string; success?: boolean; data?: unknown } | void

interface ActionFormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'action'> {
  action: (formData: FormData) => Promise<ActionResponse>
  successMessage?: string
  children: ReactNode
}

export function ActionForm({ action, successMessage, children, ...props }: ActionFormProps) {
  return (
    <form
      {...props}
      action={async (formData) => {
        try {
          const res = await action(formData)
          if (res?.error) {
            toast.error(res.error)
          } else if (res?.success || successMessage) {
            toast.success(successMessage || 'Saved successfully')
          }
        } catch (error: unknown) {
          toast.error((error as Error).message || 'An unexpected error occurred')
        }
      }}
    >
      {children}
    </form>
  )
}
