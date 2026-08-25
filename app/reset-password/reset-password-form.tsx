'use client'

import { useState } from 'react'
import Image from 'next/image'
import { updatePassword } from '@/app/login/actions'
import { useFormStatus } from 'react-dom'
import { Lock, CheckCircle2 } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-all hover:bg-blue-500 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-[44px]"
    >
      {pending && (
        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      )}
      {pending ? 'Updating Password...' : 'Set New Password'}
    </button>
  )
}

export default function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleAction = async (formData: FormData) => {
    setActionError(null)

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!password || password.length < 8) {
      setActionError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setActionError('Passwords do not match. Please re-enter.')
      return
    }

    try {
      const res = await updatePassword({ password })
      const data = res?.data as { error?: string; redirect?: string; success?: boolean } | undefined

      if (data?.error) {
        setActionError(data.error)
      } else if (data?.success && data?.redirect) {
        setIsSuccess(true)
        setTimeout(() => {
          window.location.href = data.redirect!
        }, 1500)
      } else if (res?.serverError) {
        setActionError(res.serverError)
      }
    } catch (err: unknown) {
      console.error("Password Update Error:", err)
      setActionError((err as Error)?.message || 'Failed to update password. Please try again.')
    }
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-sm rounded-2xl bg-zinc-900/50 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Password Updated!</h1>
        <p className="text-sm text-zinc-400">
          Your password has been changed successfully. Redirecting you to your dashboard...
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm rounded-2xl bg-zinc-900/50 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Create New Password</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Please choose a strong password with at least 8 characters.
        </p>
      </div>

      {actionError && (
        <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
          <p className="text-sm font-medium text-red-500 text-center">
            {actionError}
          </p>
        </div>
      )}

      <form action={handleAction} className="flex flex-col gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300" htmlFor="password">
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 pl-4 pr-10 py-2.5 text-white placeholder-zinc-500 outline-none transition-colors focus:border-blue-500 focus:bg-zinc-800 focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300"
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300" htmlFor="confirmPassword">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white placeholder-zinc-500 outline-none transition-colors focus:border-blue-500 focus:bg-zinc-800 focus:ring-1 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        <div className="mt-4">
          <SubmitButton />
        </div>
      </form>
    </div>
  )
}
