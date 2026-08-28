import { NextResponse } from 'next/server'
import { getMCPManifest } from '@/lib/webmcp/manifest'

export const dynamic = 'force-static'
export const revalidate = 3600

export async function GET() {
  const manifest = getMCPManifest()

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
    }
  })
}
