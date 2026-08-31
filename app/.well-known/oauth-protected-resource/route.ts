import { NextResponse } from 'next/server'

export const dynamic = 'force-static'
export const revalidate = 86400

const METADATA = {
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
  resource_documentation: 'https://ourmenuos.online/docs',
  agent_discovery: {
    mcp_endpoint: 'https://ourmenuos.online/.well-known/mcp.json',
    ai_catalog: 'https://ourmenuos.online/.well-known/ai-catalog.json',
    llms_txt: 'https://ourmenuos.online/llms.txt',
    agent_skills: 'https://ourmenuos.online/.well-known/agent-skills/index.json'
  }
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
