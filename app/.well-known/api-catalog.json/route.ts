import { NextResponse } from 'next/server'

export async function GET() {
  const catalog = {
    linkset: [
      {
        anchor: 'https://ourmenuos.online/api',
        'service-desc': [
          {
            href: 'https://ourmenuos.online/openapi.json',
            type: 'application/openapi+json'
          }
        ],
        'service-doc': [
          {
            href: 'https://ourmenuos.online/docs',
            type: 'text/html'
          }
        ],
        status: [
          {
            href: 'https://ourmenuos.online/api/health',
            type: 'application/json'
          }
        ],
        describedby: [
          {
            href: 'https://ourmenuos.online/llms.txt',
            type: 'text/plain'
          }
        ]
      }
    ]
  }

  return new NextResponse(JSON.stringify(catalog, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/linkset+json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Vary': 'Accept, Accept-Encoding'
    }
  })
}
