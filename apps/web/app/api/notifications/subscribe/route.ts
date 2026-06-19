import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const subscribeSchema = z.object({
  deviceName: z.string().optional().nullable(),
  subscription: z.object({
    endpoint: z.string().url('Invalid endpoint'),
    keys: z.object({
      p256dh: z.string().optional(),
      auth: z.string().optional()
    }).optional().nullable()
  })
})

/**
 * POST /api/notifications/subscribe
 * Saves a Web Push subscription to the DB, tied to the current user's organization.
 * Called by the ServiceWorkerRegistration component on mount.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = subscribeSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }

    const { subscription, deviceName } = parsed.data

    // Get org ID for this user
    const { data: member } = await supabase
      .from('organization_members')
      .select('organizations(id)')
      .eq('user_id', userData.user.id)
      .single()

    const orgId = (member?.organizations as { id: string } | null)?.id
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    // Upsert by endpoint — handles subscription renewal cleanly
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userData.user.id,
        organization_id: orgId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh || '',
        auth: subscription.keys?.auth || '',
        device_name: deviceName || 'Browser',
      },
      { onConflict: 'endpoint' }
    )

    if (error) {
      console.error('Push subscription save error:', error)
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Subscribe route error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

const unsubscribeSchema = z.object({
  endpoint: z.string().url('Invalid endpoint')
})

/**
 * DELETE /api/notifications/subscribe
 * Removes a push subscription (user unsubscribes or revokes permission).
 */
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = unsubscribeSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }

    const { endpoint } = parsed.data

    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('user_id', userData.user.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Unsubscribe route error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
