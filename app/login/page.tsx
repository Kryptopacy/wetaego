import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginForm from './login-form'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If already logged in, go straight to dashboard
  if (user) {
    // If it's a demo user, do not redirect them. We want them to see the login form
    // so they can seamlessly upgrade their session to a real account or log back into their real account.
    if (!user.email?.includes('demo-') && !user.email?.includes('@ourmenuos.online')) {
      redirect('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans text-zinc-100">
      <LoginForm />
    </div>
  )
}

