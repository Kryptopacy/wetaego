import { NextResponse } from 'next/server'

export const dynamic = 'force-static'
export const revalidate = 86400

const METADATA = {
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

const HEADERS = {
  'Content-Type': 'application/linkset+json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400'
}

export async function GET() {
  return NextResponse.json(METADATA, { status: 200, headers: HEADERS })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEADERS })
}
