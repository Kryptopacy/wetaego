import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js Middleware — Supabase Session Refresh & Route Protection
 *
 * Responsibilities:
 * 1. Refreshes the Supabase auth session on every request (prevents silent token expiry)
 * 2. Protects /dashboard/* routes — redirects unauthenticated users to /login
 * 3. Allows all public routes (/m/*, /api/*, /login, /, etc.) without auth
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do NOT use supabase.auth.getSession() here.
  // getUser() actually validates the token with the Supabase Auth server,
  // while getSession() only reads the JWT locally (which could be expired/tampered).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Route protection: redirect unauthenticated users away from dashboard
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')
  const isAffiliateDashboard = request.nextUrl.pathname.startsWith('/affiliate/dashboard')

  if (!user && (isProtectedRoute || isAffiliateDashboard)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icons, manifest, sw.js (PWA assets)
     * - Public assets with file extensions (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon-.*\\.png|apple-touch-icon\\.png|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)).*)',
  ],
}
