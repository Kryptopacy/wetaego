import { NextResponse } from 'next/server'

export async function GET() {
  const protectedResource = {
    resource: 'https://ourmenuos.online/api',
    authorization_servers: [
      'https://ourmenuos.online'
    ],
    scopes_supported: [
      'orders:read',
      'orders:write',
      'catalog:read',
      'catalog:write',
      'bookings:read',
      'bookings:write'
    ],
    bearer_methods_supported: [
      'header'
    ],
    resource_documentation: 'https://ourmenuos.online/docs'
  }

  return NextResponse.json(protectedResource, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Vary': 'Accept, Accept-Encoding'
    }
  })
}
