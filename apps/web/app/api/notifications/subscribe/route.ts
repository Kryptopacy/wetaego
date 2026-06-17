import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const { subscription, deviceName } = await req.json()
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

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
        p256dh: subscription.keys?.p256dh,
        auth: subscription.keys?.auth,
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

    const { endpoint } = await req.json()
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
    }

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
