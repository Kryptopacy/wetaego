'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { authActionClient } from '@/lib/safe-action'
import { z } from 'zod'
import crypto from 'crypto'

const TOKEN_TTL_SECONDS = 30

/** Generate a cryptographically secure token, store it with a 30s expiry.
 *  Called by the Kiosk display every 30 seconds via polling.
 */
export const generateKioskToken = authActionClient
  .schema(z.object({ locationId: z.string().uuid() }))
  .action(async ({ parsedInput: { locationId }, ctx: { user } }) => {
    const supabase = await createClient()

    // Verify caller is manager/owner for this location
    const { data: member } = await supabase
      .from('organization_members')
      .select('role, organizations!inner(locations!inner(id))')
      .eq('user_id', user.id)
      .in('role', ['owner', 'manager'])
      .single()

    if (!member) {
      throw new Error('Unauthorized: only managers can generate kiosk tokens.')
    }

    const token = crypto.randomBytes(16).toString('hex') // 32-char hex
    const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString()

    // Upsert: replace any existing token for this location atomically
    const { error } = await supabase
      .from('kiosk_tokens')
      .upsert(
        { location_id: locationId, token, expires_at: expiresAt },
        { onConflict: 'location_id' }
      )

    if (error) throw new Error('Failed to generate kiosk token.')

    return { token, expiresAt, ttlSeconds: TOKEN_TTL_SECONDS }
  })

/** Staff submit the scanned QR token to clock in. */
export const clockInWithQr = authActionClient
  .schema(z.object({
    locationId: z.string().uuid(),
    token: z.string().min(1)
  }))
  .action(async ({ parsedInput: { locationId, token }, ctx: { user } }) => {
    const supabase = await createClient()

    // 1. Validate the token is current and unexpired
    const { data: kioskToken } = await supabase
      .from('kiosk_tokens')
      .select('token, expires_at')
      .eq('location_id', locationId)
      .single()

    if (!kioskToken) {
      throw new Error('No active kiosk session found. Ask a manager to open Kiosk Mode.')
    }

    const isExpired = new Date(kioskToken.expires_at) < new Date()
    if (isExpired) {
      throw new Error('QR code has expired. Please scan the latest code on the kiosk screen.')
    }

    // Constant-time comparison to prevent timing attacks
    const expectedBuf = Buffer.from(kioskToken.token)
    const providedBuf = Buffer.from(token)
    const isValid =
      expectedBuf.length === providedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, providedBuf)

    if (!isValid) {
      throw new Error('Invalid QR code. Please scan the code displayed on the kiosk screen.')
    }

    // 2. Check for existing active shift
    const { data: activeShifts } = await supabase
      .from('staff_shifts')
      .select('id, location_id')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (activeShifts && activeShifts.length > 0) {
      if (activeShifts.some(s => s.location_id === locationId)) {
        return { success: true } // Already clocked in here
      }
      throw new Error('You are currently clocked in at another location. Please clock out there first.')
    }

    // 3. Insert the shift, marked as QR-verified
    const { error } = await supabase
      .from('staff_shifts')
      .insert({
        location_id: locationId,
        user_id: user.id,
        status: 'active',
        clock_in_method: 'qr_kiosk',
        is_location_verified: true
      })

    if (error) throw new Error('Failed to clock in.')

    revalidatePath('/dashboard', 'layout')
    return { success: true }
  })
