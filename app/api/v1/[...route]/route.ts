import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/upstash'
import crypto from 'crypto'

// A helper to validate API key and rate limits
async function authenticateApiRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header', status: 401 }
  }

  const rawKey = authHeader.split(' ')[1]
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

  const adminClient = await createAdminClient()

  // 1. Validate Key
  const { data: apiKey, error } = await adminClient
    .from('api_keys')
    .select('id, organization_id, scopes')
    .eq('key_hash', keyHash)
    .single()

  if (error || !apiKey) {
    return { error: 'Invalid API key', status: 403 }
  }

  // 2. Check Rate Limits
  const rateLimit = await checkRateLimit('inbound_api', apiKey.id)
  if (rateLimit && !rateLimit.success) {
    return { error: 'Rate limit exceeded. Please try again later.', status: 429 }
  }

  // 3. Update last used in the background (fire and forget)
  adminClient
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKey.id)
    .then()

  return { apiKey, adminClient }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ route: string[] }> }) {
  const auth = await authenticateApiRequest(req)
  if (auth.error || !auth.adminClient || !auth.apiKey) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { adminClient, apiKey } = auth

  const resolvedParams = await params
  const resource = resolvedParams.route[0]

  if (resource === 'menu') {
    // Return all pages, collections, and items for the org
    const { data: pages } = await adminClient
      .from('location_pages')
      .select('id, title, template_type, is_primary')
      .in('location_id', (
        await adminClient.from('locations').select('id').eq('organization_id', apiKey.organization_id)
      ).data?.map(l => l.id) || [])
      
    const { data: collections } = await adminClient
      .from('page_collections')
      .select('*')
      .in('page_id', pages?.map(p => p.id) || [])
      
    const { data: items } = await adminClient
      .from('page_items')
      .select('*, page_item_collections(collection_id)')
      .in('page_id', pages?.map(p => p.id) || [])

    return NextResponse.json({ pages, collections, items })
  }

  return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ route: string[] }> }) {
  const auth = await authenticateApiRequest(req)
  if (auth.error || !auth.adminClient || !auth.apiKey) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { adminClient, apiKey } = auth

  const resolvedParams = await params
  const resource = resolvedParams.route[0]

  if (resource === 'orders') {
    try {
      const body = await req.json()
      // Insert new POS order logic...
      // Mocked for demonstration
      return NextResponse.json({ success: true, message: 'Order received', order_id: 'ord_123' }, { status: 201 })
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }
  }

  return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
}
