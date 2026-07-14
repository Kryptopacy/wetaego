'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { authActionClient } from '@/lib/safe-action'
import { z } from 'zod'

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const clockIn = authActionClient
  .schema(z.object({ 
    locationId: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional()
  }))
  .action(async ({ parsedInput: { locationId, latitude, longitude }, ctx: { user } }) => {
    const supabase = await createClient()

    // Geofence validation
    if (latitude !== undefined && longitude !== undefined) {
      const { data: location } = await supabase
        .from('locations')
        .select('latitude, longitude, geofence_radius_meters')
        .eq('id', locationId)
        .single()
        
      if (location?.latitude && location?.longitude) {
        const radius = location.geofence_radius_meters ?? 100;
        const distance = getDistanceInMeters(latitude, longitude, location.latitude, location.longitude);
        if (distance > radius) {
          throw new Error(`You must be within ${radius}m of the location to clock in.`);
        }
      }
    }

    // Check if already clocked in at ANY location
    const { data: activeShifts } = await supabase
      .from('staff_shifts')
      .select('id, location_id')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (activeShifts && activeShifts.length > 0) {
      // If they are clocked into the exact same location, return success.
      if (activeShifts.some(shift => shift.location_id === locationId)) {
        return { success: true }
      }
      throw new Error('You are currently clocked in at another location. Please clock out there first.')
    }

    const { error } = await supabase
      .from('staff_shifts')
      .insert({
        location_id: locationId,
        user_id: user.id,
        status: 'active',
        clock_in_latitude: latitude,
        clock_in_longitude: longitude
      })

    if (error) {
      console.error('Clock in error:', error)
      throw new Error('Failed to clock in.')
    }

    revalidatePath('/dashboard', 'layout')
    return { success: true }
  })

export const clockOut = authActionClient
  .schema(z.object({ shiftId: z.string() }))
  .action(async ({ parsedInput: { shiftId }, ctx: { user } }) => {
    const supabase = await createClient()

    // Get shift start time to calculate total_hours
    const { data: shift, error: fetchError } = await supabase
      .from('staff_shifts')
      .select('clock_in_time')
      .eq('id', shiftId)
      .single()

    if (fetchError || !shift) {
      throw new Error('Shift not found')
    }

    const clockInTime = new Date(shift.clock_in_time).getTime()
    const clockOutTime = Date.now()
    const hours = (clockOutTime - clockInTime) / (1000 * 60 * 60)

    const { error } = await supabase
      .from('staff_shifts')
      .update({
        status: 'completed',
        clock_out_time: new Date(clockOutTime).toISOString(),
        total_hours: parseFloat(hours.toFixed(2))
      })
      .eq('id', shiftId)
      .eq('user_id', user.id) // Security check

    if (error) {
      console.error('Clock out error:', error)
      throw new Error('Failed to clock out.')
    }

    revalidatePath('/dashboard', 'layout')
    return { success: true }
  })
