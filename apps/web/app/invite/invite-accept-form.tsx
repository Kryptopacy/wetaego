'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { acceptInviteAction } from './actions'

interface InviteAcceptFormProps {
  token: string
  inviteEmail: string
  orgName: string
  role: string
  currentUserEmail: string | null
}

export default function InviteAcceptForm({
  token,
  inviteEmail,
  orgName,
  role,
  currentUserEmail,
}: InviteAcceptFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAccept = async () => {
    setLoading(true)
    setError(null)
    const result = await acceptInviteAction(token)
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.reload()
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
      case 'manager':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
      case 'editor':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      case 'viewer':
      default:
        return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
    }
  }

  // Case 1: Logged Out
  if (!currentUserEmail) {
    const loginUrl = `/login?redirectTo=${encodeURIComponent(`/invite?token=${token}`)}`
    return (
      <div className="w-full max-w-md rounded-2xl bg-zinc-900/50 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl border border-zinc-800 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">You're Invited!</h1>
        <p className="text-zinc-400 text-sm mb-6">
          You have been invited to join <strong className="text-zinc-200">{orgName}</strong> as a
          <span className={`inline-block ml-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium ${getRoleBadgeColor(role)}`}>
            {role}
          </span>
        </p>

        <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-4 text-left mb-6">
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Invitation Email</p>
          <p className="text-sm font-medium text-zinc-300">{inviteEmail}</p>
        </div>

        <p className="text-xs text-zinc-500 mb-6">
          Please log in or register a new account using the email address above to accept this invitation.
        </p>

        <Link
          href={loginUrl}
          className="block w-full text-center rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-all hover:bg-blue-500 active:scale-[0.98]"
        >
          Sign In or Sign Up
        </Link>
      </div>
    )
  }

  // Case 2: Logged in with incorrect email
  if (currentUserEmail.toLowerCase() !== inviteEmail.toLowerCase()) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-zinc-900/50 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl border border-zinc-800">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-600/10 border border-amber-500/20 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-white mb-2 text-center">Account Mismatch</h1>
        <p className="text-zinc-400 text-sm mb-6 text-center">
          This invitation was sent to <strong className="text-zinc-200">{inviteEmail}</strong>, but you are currently signed in as <strong className="text-zinc-200">{currentUserEmail}</strong>.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="w-full rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2.5 font-medium text-white transition-all disabled:opacity-50"
          >
            {loading ? 'Signing Out...' : 'Sign Out & Use Another Account'}
          </button>
          <Link
            href="/dashboard"
            className="block w-full text-center rounded-lg border border-zinc-800 hover:bg-zinc-800 px-4 py-2.5 font-medium text-zinc-400 hover:text-white transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Case 3: Logged in with correct email
  return (
    <div className="w-full max-w-md rounded-2xl bg-zinc-900/50 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl border border-zinc-800 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Accept Invitation</h1>
      <p className="text-zinc-400 text-sm mb-6">
        You are joining <strong className="text-zinc-200">{orgName}</strong> as a
        <span className={`inline-block ml-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium uppercase tracking-wider ${getRoleBadgeColor(role)}`}>
          {role}
        </span>
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6 text-left">
          {error}
        </div>
      )}

      <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-4 text-left mb-6">
        <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Signed In As</p>
        <p className="text-sm font-medium text-zinc-300">{currentUserEmail}</p>
      </div>

      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 font-medium text-white transition-all disabled:opacity-50 active:scale-[0.98]"
      >
        {loading ? 'Joining Team...' : 'Accept Invitation & Enter'}
      </button>
    </div>
  )
}
