import { NextResponse } from 'next/server'

export async function GET() {
  const robotsTxt = `# robots.txt for WETAEGO (https://ourmenuos.online)

User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /api/
Disallow: /affiliate/dashboard/
Disallow: /pay/
Disallow: /d/
Disallow: /kiosk-scan/
Disallow: /invite/

# Content Signals for AI and Search Agents (https://contentsignals.org)
Content-Signal: ai-train=no, search=yes, ai-input=yes

# Discovery & Sitemap
Sitemap: https://ourmenuos.online/sitemap.xml
`

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Signal': 'ai-train=no, search=yes, ai-input=yes',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'Vary': 'Accept, Accept-Encoding'
    }
  })
}
