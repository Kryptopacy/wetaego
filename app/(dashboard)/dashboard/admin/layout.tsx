import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (data?.user?.email !== (process.env.ADMIN_EMAIL || 'kryptopacy@gmail.com')) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
