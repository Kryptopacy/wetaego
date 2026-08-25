import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * OAuth & Auth Callback Route
 *
 * Handles the redirect from Supabase Auth after OAuth (e.g. Google) or email confirmation.
 * Exchanges the auth code for a session and redirects to the dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const errorParam = searchParams.get('error_description') || searchParams.get('error') || searchParams.get('error_code')

  if (errorParam) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorParam)}`)
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // setAll called from Server Component — can be ignored if middleware handles refresh
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Ensure the redirect target is a relative path to prevent open redirects
      const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
      return NextResponse.redirect(`${origin}${safeNext}`)
    } else {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
  }

  // If no code and no specific error
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Authentication could not be completed. Please try again.')}`)
}
