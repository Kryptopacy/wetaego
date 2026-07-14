'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function setActiveLocationCookie(locationId: string, pageId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const cookieStore = await cookies()
  cookieStore.set('ourmenu_active_location_id', locationId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax'
  })
  if (pageId !== undefined) {
    if (pageId === '') {
      cookieStore.delete('ourmenu_active_page_id')
    } else {
      cookieStore.set('ourmenu_active_page_id', pageId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax'
      })
    }
  }
  return { success: true }
}
