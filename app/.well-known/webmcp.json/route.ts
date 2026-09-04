import { NextResponse } from 'next/server'
import { getMCPManifest } from '@/lib/webmcp/manifest'

export const dynamic = 'force-static'
export const revalidate = 86400

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
}

export async function GET() {
  return NextResponse.json(getMCPManifest(), { status: 200, headers: HEADERS })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEADERS })
}
