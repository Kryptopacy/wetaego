'use server'

import { cookies } from 'next/headers'

export async function setActiveLocationCookie(locationId: string) {
  const cookieStore = await cookies()
  cookieStore.set('ourmenu_active_location_id', locationId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax'
  })
  return { success: true }
}
