import { NextResponse } from 'next/server'

export const dynamic = 'force-static'
export const revalidate = 86400

const METADATA = {
  "acp": {
    "version": "1.0",
    "supported_protocols": ["mcp", "ucp", "x402", "openapi"],
    "name": "OurMenu OS Agent Commerce Profile",
    "description": "Agent Commerce Profile linking storefront tools, settlement gateways, and live catalog APIs for autonomous agents."
  },
  "endpoints": {
    "mcp": "https://ourmenuos.online/.well-known/mcp.json",
    "ucp": "https://ourmenuos.online/.well-known/ucp",
    "x402": "https://ourmenuos.online/api/x402",
    "oauth_metadata": "https://ourmenuos.online/.well-known/oauth-protected-resource",
    "dns_aid": "https://ourmenuos.online/.well-known/dns-aid",
    "openapi": "https://ourmenuos.online/openapi.json",
    "llms": "https://ourmenuos.online/llms.txt"
  }
}

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
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
