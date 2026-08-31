import { NextResponse } from 'next/server'

export const dynamic = 'force-static'
export const revalidate = 86400

const METADATA = {
  protocol: 'dns-aid',
  version: '1.0',
  name: 'OurMenu OS DNS for AI Discovery (DNS-AID) Configuration',
  zone: 'ourmenuos.online',
  dnssec_status: 'signed',
  records: [
    {
      name: '_index._agents.ourmenuos.online',
      type: 'HTTPS',
      priority: 1,
      target: 'ourmenuos.online.',
      params: {
        alpn: 'h2,h3',
        endpoint: 'https://ourmenuos.online/.well-known/ai-catalog.json',
        format: 'application/json'
      }
    },
    {
      name: '_a2a._agents.ourmenuos.online',
      type: 'HTTPS',
      priority: 1,
      target: 'ourmenuos.online.',
      params: {
        alpn: 'h2,h3',
        endpoint: 'https://ourmenuos.online/api/chat',
        format: 'application/json'
      }
    },
    {
      name: '_mcp._agents.ourmenuos.online',
      type: 'HTTPS',
      priority: 1,
      target: 'ourmenuos.online.',
      params: {
        alpn: 'h2,h3',
        endpoint: 'https://ourmenuos.online/.well-known/mcp.json',
        format: 'application/json'
      }
    }
  ],
  dns_records_bind_format: [
    '_index._agents.ourmenuos.online. 3600 IN HTTPS 1 ourmenuos.online. alpn="h2,h3" key65300="https://ourmenuos.online/.well-known/ai-catalog.json"',
    '_a2a._agents.ourmenuos.online. 3600 IN HTTPS 1 ourmenuos.online. alpn="h2,h3" key65300="https://ourmenuos.online/api/chat"',
    '_mcp._agents.ourmenuos.online. 3600 IN HTTPS 1 ourmenuos.online. alpn="h2,h3" key65300="https://ourmenuos.online/.well-known/mcp.json"'
  ]
}

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
  'Vary': 'Accept, Accept-Encoding'
}

export async function GET() {
  return NextResponse.json(METADATA, {
    status: 200,
    headers: HEADERS
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: HEADERS
  })
}
