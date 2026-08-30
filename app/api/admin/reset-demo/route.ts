import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ensureFlagshipDemoLocation } from '@/lib/demo/ensure-flagship-demo'

/**
 * GET/POST /api/admin/reset-demo
 * Force-nukes the demo location + all its pages and items, then re-seeds from scratch.
 *
 * Browser access (GET):
 *   https://ourmenuos.online/api/admin/reset-demo?token=pacy-demo-reset-2026
 */

const RESET_SECRET = process.env.DEMO_RESET_SECRET || 'pacy-demo-reset-2026'

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${RESET_SECRET}`) return true
  const url = new URL(request.url)
  return url.searchParams.get('token') === RESET_SECRET
}

async function runReset() {
  const adminClient = await createAdminClient()

  const { data: loc } = await adminClient
    .from('locations')
    .select('id, slug, name')
    .eq('slug', 'demo')
    .maybeSingle()

  let deletedPages = 0
  let deletedItems = 0

  if (loc) {
    const { data: pages } = await adminClient
      .from('location_pages')
      .select('id')
      .eq('location_id', loc.id)

    if (pages && pages.length > 0) {
      const pageIds = pages.map((p: { id: string }) => p.id)
      await adminClient.from('page_items').delete().in('page_id', pageIds)
      deletedItems = pages.length
      await adminClient.from('location_pages').delete().eq('location_id', loc.id)
      deletedPages = pages.length
    }

    await adminClient.from('locations').delete().eq('id', loc.id)
  }

  const newLocationId = await ensureFlagshipDemoLocation()

  return {
    success: true,
    previousLocation: loc ? { id: loc.id, name: loc.name } : null,
    deleted: { pages: deletedPages, items: deletedItems },
    newLocationId,
    message: newLocationId
      ? '✅ Demo reset complete. Pacy Group seeded at /m/demo with all 9 concepts.'
      : '⚠️ Reset done but seeder returned null — check Supabase admin credentials.',
    storefronts: [
      '/m/demo',
      '/m/demo/p/restaurant',
      '/m/demo/p/pacy-wellness',
      '/m/demo/p/pacy-boutique',
      '/m/demo/p/pacy-gadgets',
      '/m/demo/p/pacy-stays',
      '/m/demo/p/pacy-hotels',
      '/m/demo/p/pacy-media',
      '/m/demo/p/pacy-repairs',
    ],
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized. Add ?token=<secret> to URL.' }, { status: 401 })
  }
  try {
    return NextResponse.json(await runReset())
  } catch (err) {
    return NextResponse.json({ error: 'Reset failed', detail: String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  try {
    return NextResponse.json(await runReset())
  } catch (err) {
    return NextResponse.json({ error: 'Reset failed', detail: String(err) }, { status: 500 })
  }
}
