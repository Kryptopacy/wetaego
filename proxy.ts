import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Redis for Edge WAF only if env variables exist
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) 
  ? Redis.fromEnv() 
  : null

// Global WAF limiter: 100 requests per 10 seconds per IP for API routes to stop DDoS/Bot attacks
const wafLimiter = redis 
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '10 s'),
      analytics: true,
      prefix: '@upstash/ratelimit/waf'
    })
  : null
/**
 * Next.js Middleware — Supabase Session Refresh & Route Protection
 *
 * Responsibilities:
 * 1. Refreshes the Supabase auth session on every request (prevents silent token expiry)
 * 2. Protects /dashboard/* routes — redirects unauthenticated users to /login
 * 3. Allows all public routes (/m/*, /api/*, /login, /, etc.) without auth
 */
export async function proxy(request: NextRequest) {
  // --- 1. EDGE WAF PROTECTION ---
  const path = request.nextUrl.pathname
  const isProtectedPath = path.startsWith('/api') || path.startsWith('/pay')
  
  if (isProtectedPath && wafLimiter) {
    const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1'
    
    try {
      const { success, limit, reset, remaining } = await wafLimiter.limit(ip)
      
      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests. WAF protection active.' },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString()
            }
          }
        )
      }
    } catch (error) {
      // If Redis fails, fail open so we don't break the app
      console.error('WAF Error:', error)
    }
  }

  // --- 2. SUPABASE SESSION REFRESH & AUTH ---
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

  const isDemoMode = request.cookies.get('demo_mode')?.value === '1'

  if (!user && !isDemoMode && (isProtectedRoute || isAffiliateDashboard)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // --- 3. CUSTOM DOMAIN REWRITES ---
  // If the request comes from a custom domain, rewrite it to /m/[slug]
  const hostname = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  
  // Define our primary domain to ignore rewrites
  const isPrimaryDomain = 
    hostname === 'localhost:3000' || 
    hostname === process.env.NEXT_PUBLIC_PRIMARY_DOMAIN || 
    hostname?.endsWith('.vercel.app')

  // We only rewrite if it's NOT the primary domain, AND not an internal protected/api route
  if (!isPrimaryDomain && !isProtectedPath && !isProtectedRoute && !isAffiliateDashboard) {
    // We would ideally query Supabase here to get the slug for the custom domain.
    // However, Edge Middleware cannot use the standard Supabase client to hit the DB without latency.
    // Instead, we will rewrite the URL to a dynamic route like `/[domain]/...`
    // OR we pass the hostname in the headers and let the server components handle it.
    
    // For Vercel Edge Middleware pattern: rewrite to `/_domain/[hostname]/[path]`
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = `/_domain/${hostname}${request.nextUrl.pathname}`
    return NextResponse.rewrite(rewriteUrl)
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
