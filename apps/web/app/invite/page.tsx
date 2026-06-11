import { createClient } from '@/lib/supabase/server'
import InviteAcceptForm from './invite-accept-form'
import Link from 'next/link'

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const token = resolvedSearchParams.token

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans text-zinc-100">
        <div className="w-full max-w-md rounded-2xl bg-zinc-900/50 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl border border-zinc-800 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mb-2">Invalid Invitation Link</h1>
          <p className="text-zinc-400 text-sm mb-6">
            A valid security token is required to accept an invitation. Please contact the administrator who invited you.
          </p>
          <Link
            href="/"
            className="block w-full text-center rounded-lg bg-zinc-850 border border-zinc-700 hover:bg-zinc-850 px-4 py-2 font-medium text-white transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  const supabase = await createClient()

  // Fetch the invite and join with organizations
  const { data: invite, error } = await supabase
    .from('organization_invites')
    .select('*, organizations(name)')
    .eq('token', token)
    .single()

  if (error || !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans text-zinc-100">
        <div className="w-full max-w-md rounded-2xl bg-zinc-900/50 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl border border-zinc-800 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mb-2">Invitation Expired or Invalid</h1>
          <p className="text-zinc-400 text-sm mb-6">
            This invitation has expired or has already been used. Please request a new invitation from your administrator.
          </p>
          <Link
            href="/"
            className="block w-full text-center rounded-lg bg-zinc-850 border border-zinc-700 hover:bg-zinc-800 px-4 py-2 font-medium text-white transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  // Get current user auth state if any
  const { data: userData } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans text-zinc-100">
      <InviteAcceptForm
        token={token}
        inviteEmail={invite.email}
        orgName={(invite as any).organizations?.name || 'OurMenu Partner'}
        role={invite.role}
        currentUserEmail={userData?.user?.email || null}
      />
    </div>
  )
}
