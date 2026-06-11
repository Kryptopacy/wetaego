import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const action = url.searchParams.get('action')
  
  const cookieStore = await cookies()

  if (action === 'exit') {
    cookieStore.delete('demo_mode')
    return redirect('/')
  }

  // Set the demo mode cookie (expires in 1 day)
  cookieStore.set('demo_mode', '1', {
    maxAge: 60 * 60 * 24, // 1 day
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })

  // Redirect to dashboard
  return redirect('/dashboard')
}
