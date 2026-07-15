'use server'

import { createAnonClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// In a real production scale app, this would push to a Redis queue or Kafka stream.
// For MVP, we insert directly into the append-only `ad_events` table asynchronously via Supabase.
export async function trackAdEvent(adId: string, eventType: 'impression' | 'click') {
  // We use the anon client since this is triggered by public anonymous traffic
  const supabase = createAnonClient()
  
  // Extract a crude session ID or use IP as anon identifier
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'anonymous'
  
  // Generate a hash of IP + Date to get a daily session bucket to prevent excessive logging
  // from the same user repeatedly refreshing, though exact tracking is fine for MVP.
  const sessionId = Buffer.from(`${ip}-${new Date().toISOString().split('T')[0]}`).toString('base64').slice(0, 16)

  // Non-blocking fire-and-forget insert
  supabase.from('ad_events' as any).insert([{
    ad_id: adId,
    event_type: eventType,
    session_id: sessionId
  }]).then(({ error }) => {
    if (error) {
      console.error('[AdTracking] Failed to log event:', error)
    }
  })

  return { success: true }
}
