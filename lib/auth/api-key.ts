import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export interface AuthenticatedApiKey {
  id: string
  organization_id: string
  scopes: string[] | null
}

export async function authenticateApiRequest(
  req: NextRequest
): Promise<{ apiKey: AuthenticatedApiKey; adminClient: Awaited<ReturnType<typeof createAdminClient>> } | { error: string; status: number }> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header', status: 401 }
  }

  const rawKey = authHeader.replace('Bearer ', '').trim()
  if (!rawKey) {
    return { error: 'Missing or invalid Authorization header', status: 401 }
  }

  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

  const adminClient = await createAdminClient()

  const { data: apiKey, error } = await adminClient
    .from('api_keys')
    .select('id, organization_id, scopes')
    .eq('key_hash', keyHash)
    .single()

  if (error || !apiKey) {
    return { error: 'Invalid API key', status: 403 }
  }

  const now = new Date().toISOString()
  adminClient
    .from('api_keys')
    .update({ last_used_at: now })
    .eq('id', apiKey.id)
    .then(undefined, () => {})

  return { apiKey, adminClient }
}
