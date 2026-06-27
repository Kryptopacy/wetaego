import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginForm from './login-form'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If already logged in, go straight to dashboard
  if (user) {
    // If it's a demo user, maybe they want to sign up for real. 
    // But standard behavior is to redirect them so they don't get confused.
    // They can log out from the dashboard to create a real account.
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans text-zinc-100">
      <LoginForm />
    </div>
  )
}

