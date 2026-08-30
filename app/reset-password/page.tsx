import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResetPasswordForm from './reset-password-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Set New Password | WETAEGO',
  description: 'Update your account password securely on WETAEGO.',
}

export default async function ResetPasswordPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Must have an active recovery session
  if (!user) {
    redirect('/login?error=Invalid+or+expired+password+reset+link.+Please+request+a+new+one.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans text-zinc-100">
      <ResetPasswordForm />
    </div>
  )
}
