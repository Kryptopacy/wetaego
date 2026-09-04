import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  let dbOk = false
  try {
    const supabase = await createAdminClient()
    const { error } = await supabase.from('organizations').select('id', { count: 'exact', head: true }).limit(1)
    dbOk = !error
  } catch {
    dbOk = false
  }

  const status = dbOk ? 'ok' : 'degraded'
  return NextResponse.json(
    {
      status,
      service: 'WETAEGO API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: dbOk ? 'operational' : 'unreachable',
        payment_gateways: ['paystack', 'bachs']
      }
    },
    {
      status: dbOk ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      }
    }
  )
}
