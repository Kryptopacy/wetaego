'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { login, signup, requestPasswordReset, signInWithGoogle } from './actions'
import { useFormStatus } from 'react-dom'
import { KeyRound, ArrowLeft } from 'lucide-react'

type AuthMode = 'login' | 'signup' | 'forgot_password'

function SubmitButton({ mode }: { mode: AuthMode }) {
  const { pending } = useFormStatus()
  
  const getButtonText = () => {
    if (pending) {
      if (mode === 'login') return 'Signing In...'
      if (mode === 'signup') return 'Signing Up...'
      return 'Sending Reset Link...'
    }
    if (mode === 'login') return 'Sign In'
    if (mode === 'signup') return 'Sign Up'
    return 'Send Reset Link'
  }

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-all hover:bg-blue-500 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-[44px]"
    >
      {pending && (
        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      )}
      {getButtonText()}
    </button>
  )
}

function LoginFormInner() {
  const [showPassword, setShowPassword] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  useEffect(() => {
    // Parse URL hash for OAuth / Supabase errors (e.g. #error=access_denied&error_description=...)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const hashError = hashParams.get('error_description') || hashParams.get('error')
      if (hashError) {
        setActionError(decodeURIComponent(hashError.replace(/\+/g, ' ')))
      }
    }
  }, [])

  const handleAction = async (formData: FormData) => {
    setActionError(null)
    setActionSuccess(null)

    const email = formData.get('email') as string
    const password = (formData.get('password') as string) || ''
    const redirectParam = (formData.get('redirectTo') as string) || redirectTo

    try {
      if (authMode === 'forgot_password') {
        const res = await requestPasswordReset({ email })
        if (res?.data?.error) {
          setActionError(res.data.error)
        } else if (res?.data?.message) {
          setActionSuccess(res.data.message)
        } else if (res?.serverError) {
          setActionError(res.serverError)
        }
        return
      }

      let res;
      if (authMode === 'login') {
        res = await login({ email, password, redirectTo: redirectParam })
      } else {
        res = await signup({ email, password, redirectTo: redirectParam })
      }
      
      if (res?.data?.error) {
        setActionError(res.data.error)
      } else if (res?.data?.redirect) {
        window.location.href = res.data.redirect
      } else if (res?.data?.message) {
        setActionSuccess(res.data.message)
      } else if (res?.serverError) {
        setActionError(res.serverError)
      } else if (res?.validationErrors) {
        const valErrors = res.validationErrors
        const errStrings = typeof valErrors === 'object' && valErrors !== null
          ? Object.values(valErrors).flat().filter(Boolean).join('. ')
          : 'Invalid inputs provided.'
        setActionError(errStrings)
      }
    } catch (err: unknown) {
      console.error("Auth Action Error:", err)
      setActionError((err as Error)?.message || 'An unexpected error occurred. Please try again.')
    }
  }

  const urlError = searchParams.get('error_description') || searchParams.get('error') || searchParams.get('message')
  const displayedError = actionError || urlError
  const displayedSuccess = actionSuccess || searchParams.get('success')

  return (
    <div className="w-full max-w-sm rounded-2xl bg-zinc-900/50 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
      <div className="mb-8 flex flex-col items-center text-center">
        {authMode === 'forgot_password' ? (
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
        ) : (
          <Image src="/ourmenu-qr-icon.svg" alt="OurMenu Logo" width={48} height={48} className="mb-4 object-contain" />
        )}
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {authMode === 'forgot_password' ? 'Reset Password' : 'OurMenu OS'}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          {authMode === 'login' && 'Sign in to your dashboard'}
          {authMode === 'signup' && 'Create a new merchant account'}
          {authMode === 'forgot_password' && 'Enter your email to receive a password reset link'}
        </p>
      </div>

      {displayedError && (
        <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
          <p className="text-sm font-medium text-red-500 text-center">
            {displayedError}
          </p>
        </div>
      )}

      {displayedSuccess && (
        <div className="mb-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4">
          <p className="text-sm font-medium text-emerald-500 text-center">
            {displayedSuccess}
          </p>
        </div>
      )}

      <form action={handleAction} className="flex flex-col gap-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white placeholder-zinc-500 outline-none transition-colors focus:border-blue-500 focus:bg-zinc-800 focus:ring-1 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>

        {authMode !== 'forgot_password' && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-zinc-300" htmlFor="password">
                Password
              </label>
              {authMode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setActionError(null)
                    setActionSuccess(null)
                    setAuthMode('forgot_password')
                  }}
                  className="text-xs text-blue-500 hover:text-blue-400"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
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
        )}

        <div className="mt-4 flex flex-col gap-3">
          <SubmitButton mode={authMode} />

          {authMode !== 'forgot_password' && (
            <>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-zinc-900/50 px-2 text-zinc-400">Or continue with</span>
                </div>
              </div>

              <button
                formAction={signInWithGoogle}
                formNoValidate
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 font-medium text-white transition-all hover:bg-zinc-700 active:scale-[0.98]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
            </>
          )}

          {authMode === 'forgot_password' && (
            <button
              type="button"
              onClick={() => {
                setActionError(null)
                setActionSuccess(null)
                setAuthMode('login')
              }}
              className="mt-2 flex items-center justify-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </button>
          )}
        </div>
      </form>

      {authMode !== 'forgot_password' && (
        <p className="mt-6 text-center text-sm text-zinc-400">
          {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setActionError(null)
              setActionSuccess(null)
              setAuthMode(authMode === 'login' ? 'signup' : 'login')
            }}
            className="font-medium text-blue-500 hover:text-blue-400"
          >
            {authMode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      )}
    </div>
  )
}

export default function LoginForm() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-sm rounded-2xl bg-zinc-900/50 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl h-[420px] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-zinc-800 border-t-white rounded-full animate-spin mb-4" />
        <div className="text-sm font-medium text-zinc-500 animate-pulse">Loading dashboard...</div>
      </div>
    }>
      <LoginFormInner />
    </Suspense>
  )
}
