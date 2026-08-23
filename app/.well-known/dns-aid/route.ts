import { NextResponse } from 'next/server'

export async function GET() {
  const dnsAid = {
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
    ]
  }

  return NextResponse.json(dnsAid, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Vary': 'Accept, Accept-Encoding'
    }
  })
}
