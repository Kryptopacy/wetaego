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
import { getMarkdownForPath } from './lib/markdown-content'

function prefersMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) return false
  const lower = acceptHeader.toLowerCase()
  if (!lower.includes('text/markdown') && !lower.includes('text/x-markdown')) {
    return false
  }
  const parts = lower.split(',').map((p) => p.trim())
  let mdQuality = -1
  let htmlQuality = -1

  for (const part of parts) {
    const [media, ...params] = part.split(';')
    const mediaType = media.trim()
    let q = 1.0
    for (const param of params) {
      const [key, val] = param.trim().split('=')
      if (key === 'q') {
        const parsed = parseFloat(val)
        if (!isNaN(parsed)) q = parsed
      }
    }
    if (mediaType === 'text/markdown' || mediaType === 'text/x-markdown') {
      mdQuality = Math.max(mdQuality, q)
    } else if (mediaType === 'text/html') {
      htmlQuality = Math.max(htmlQuality, q)
    }
  }

  if (mdQuality <= 0) return false
  if (htmlQuality < 0) return true
  return mdQuality >= htmlQuality
}

export const AGENT_LINK_HEADERS = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</docs>; rel="service-doc"',
  '</openapi.json>; rel="service-desc"; type="application/openapi+json"',
  '</llms.txt>; rel="describedby"',
  '</.well-known/oauth-authorization-server>; rel="oauth-authorization-server"',
  '</.well-known/oauth-protected-resource>; rel="oauth-protected-resource"',
  '</.well-known/ai-catalog.json>; rel="ai-catalog"',
  '</.well-known/agent-skills/index.json>; rel="agent-skills"',
  '</.well-known/mcp.json>; rel="mcp"',
  '</.well-known/ucp>; rel="ucp"',
  '</.well-known/acp.json>; rel="acp"',
  '</auth.md>; rel="author-doc"'
].join(', ')

/**
 * Next.js Middleware — Supabase Session Refresh & Route Protection
 *
 * Responsibilities:
 * 1. Refreshes the Supabase auth session on every request (prevents silent token expiry)
 * 2. Protects /dashboard/* routes — redirects unauthenticated users to /login
 * 3. Allows all public routes (/m/*, /api/*, /login, /, etc.) without auth
 * 4. Negotiates Accept: text/markdown content for AI agents (acceptmarkdown.com compliant)
 * 5. Emits RFC 8288 Link discovery headers for agent discovery
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const acceptHeader = request.headers.get('accept')

  // --- 0. AGENT DISCOVERY & AUTH.MD DIRECT PASS-THROUGH ---
  if (path.startsWith('/.well-known/') || path === '/auth.md') {
    const response = NextResponse.next()
    response.headers.set('Link', AGENT_LINK_HEADERS)
    response.headers.set('Vary', 'Accept, Accept-Encoding')
    response.headers.set('Access-Control-Allow-Origin', '*')
    if (path.includes('x402')) {
      response.headers.set('X-402-Payment-Required', 'true')
      response.headers.set('X-402-Facilitator', 'https://ourmenuos.online/api/x402')
      response.headers.set('WWW-Authenticate', 'X402 token="USDC", network="base", address="0x87A8f8303e339F091F8402D3b934789518d6e9d6", amount="0.05", facilitator="https://ourmenuos.online/api/x402"')
    }
    return response
  }

  // --- 1. MARKDOWN CONTENT NEGOTIATION (acceptmarkdown.com) ---
  if (prefersMarkdown(acceptHeader) && !path.startsWith('/api/') && !path.startsWith('/pay/')) {
    const mdResult = getMarkdownForPath(path)
    return new NextResponse(mdResult.content, {
      status: mdResult.status,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Vary': 'Accept, Accept-Encoding',
        'Link': AGENT_LINK_HEADERS,
        'Cache-Control': mdResult.status === 200 
          ? 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400' 
          : 'no-cache',
      },
    })
  }

  // --- 2. EDGE WAF PROTECTION ---
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
  const rawHost = request.headers.get('host') || ''
  const cleanHost = rawHost.split(':')[0].toLowerCase()

  const primaryDomain = (process.env.NEXT_PUBLIC_PRIMARY_DOMAIN || 'ourmenuos.online').toLowerCase()
  let siteUrlHost = ''
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try {
      siteUrlHost = new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname.toLowerCase()
    } catch {
      // Ignore URL parse error
    }
  }

  // Define our primary domains to ignore rewrites
  const isPrimaryDomain = 
    cleanHost === 'localhost' || 
    cleanHost === '127.0.0.1' || 
    cleanHost === primaryDomain || 
    cleanHost === `www.${primaryDomain}` ||
    (siteUrlHost && (cleanHost === siteUrlHost || cleanHost === `www.${siteUrlHost}`)) ||
    cleanHost.endsWith('.vercel.app')

  // We only rewrite if it's NOT the primary domain, AND not an internal protected/api route
  if (!isPrimaryDomain && !isProtectedPath && !isProtectedRoute && !isAffiliateDashboard) {
    // For custom domains, if a matching route isn't found, let it fall back to standard handling rather than fake _domain rewrite
    return supabaseResponse
  }

  // --- 4. LOCALE AUTO-DETECTION (Guest UI) ---
  if (request.nextUrl.pathname.startsWith('/m/')) {
    const hasLocaleCookie = request.cookies.has('NEXT_LOCALE')
    if (!hasLocaleCookie) {
      const acceptLang = request.headers.get('accept-language')
      const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'yo', 'ig', 'ha']
      let bestLocale = 'en'
      
      if (acceptLang) {
        const preferredLocales = acceptLang.split(',').map(lang => lang.split(';')[0].trim().toLowerCase())
        for (const locale of preferredLocales) {
          if (SUPPORTED_LOCALES.includes(locale)) {
            bestLocale = locale
            break
          }
          const base = locale.split('-')[0]
          if (SUPPORTED_LOCALES.includes(base)) {
            bestLocale = base
            break
          }
        }
      }
      
      // Set the cookie for future requests
      supabaseResponse.cookies.set('NEXT_LOCALE', bestLocale, { path: '/' })
    }
  }

  supabaseResponse.headers.set('Vary', 'Accept, Accept-Encoding')
  supabaseResponse.headers.set('Link', AGENT_LINK_HEADERS)
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icons, manifest, sw.js (PWA assets)
     * - SEO, AEO & Agent assets (robots.txt, sitemap.xml, manifest.json, site.webmanifest, llms.txt, llms-full.txt, auth.md, .well-known/*)
     * - Public assets with file extensions (images, fonts, markdown, json, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|sitemap-.*\\.xml|manifest\\.json|site\\.webmanifest|llms\\.txt|llms-full\\.txt|auth\\.md|\\.well-known/.*|icon-.*\\.png|apple-touch-icon\\.png|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|txt|xml|json|md)).*)',
  ],
}
