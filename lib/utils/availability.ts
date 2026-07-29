import { format, parseISO, isBefore, isAfter, parse, addMinutes } from 'date-fns'
import { createAdminClient } from '@/lib/supabase/server'

export interface AvailabilitySchedule {
  [day: string]: { start: string; end: string }[]
}

export interface LocationAvailability {
  timezone: string
  slot_interval: number
  schedule: AvailabilitySchedule
}

export interface BookingInterval {
  booking_date: string // YYYY-MM-DD
  booking_time: string | null // HH:mm
  booking_end_time: string | null // HH:mm
  item_id?: string | null
}

export interface TimeSlot {
  start: string // HH:mm
  end: string // HH:mm
  available: boolean
}

/**
 * Returns the current date (YYYY-MM-DD) and time (HH:mm) in the target timezone.
 */
export function getCurrentTimeInTimezone(timezone: string) {
  const now = new Date()
  
  // Format the date specifically for the timezone
  const dateStr = new Intl.DateTimeFormat('en-CA', { // en-CA gives YYYY-MM-DD format
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now)

  const timeStr = new Intl.DateTimeFormat('en-GB', { // en-GB gives HH:mm format
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now)

  return { date: dateStr, time: timeStr }
}

/**
 * Generates available time slots for a specific date in the business's timezone.
 */
export function generateAvailabilitySlots(
  targetDate: string, // YYYY-MM-DD
  availability: LocationAvailability,
  existingBookings: BookingInterval[],
  resourceIds?: string[]
): TimeSlot[] {
  // Determine day of week (0 = Sunday, 1 = Monday, etc.)
  // We parse the target date as local to avoid UTC shift
  const [year, month, day] = targetDate.split('-').map(Number)
  const dateObj = new Date(year, month - 1, day)
  const dayOfWeek = dateObj.getDay().toString()

  const daySchedule = availability.schedule[dayOfWeek] || []
  
  if (daySchedule.length === 0) {
    return [] // Closed on this day
  }

  const { date: currentDateInTz, time: currentTimeInTz } = getCurrentTimeInTimezone(availability.timezone)
  const isToday = targetDate === currentDateInTz
  const isPast = targetDate < currentDateInTz

  if (isPast) {
    return [] // Cannot book in the past
  }

  const slots: TimeSlot[] = []

  // Generate slots for each configured block
  for (const block of daySchedule) {
    let currentSlotStart = parse(block.start, 'HH:mm', dateObj)
    const blockEnd = parse(block.end, 'HH:mm', dateObj)

    while (isBefore(currentSlotStart, blockEnd)) {
      const slotEnd = addMinutes(currentSlotStart, availability.slot_interval)
      
      // If the slot overflows the block end, we stop
      if (isAfter(slotEnd, blockEnd)) break

      const startStr = format(currentSlotStart, 'HH:mm')
      const endStr = format(slotEnd, 'HH:mm')

      // Check if this slot is in the past (if today)
      const isSlotInPast = isToday && startStr <= currentTimeInTz

      // Check against existing bookings for conflicts
      // A simple conflict is if the slot overlaps with any booking
      const isConflict = existingBookings.some(booking => {
        if (booking.booking_date !== targetDate) return false
        if (resourceIds && resourceIds.length > 0 && booking.item_id && !resourceIds.includes(booking.item_id)) {
          return false // Booking is for a different resource/item, no conflict
        }
        if (!booking.booking_time) return true // Daily booking blocks entire day
        
        const bookingStart = booking.booking_time
        const bookingEnd = booking.booking_end_time || bookingStart // if no end time, assume it blocks the slot

        // Overlap condition: slotStart < bookingEnd AND slotEnd > bookingStart
        return startStr < bookingEnd && endStr > bookingStart
      })

      slots.push({
        start: startStr,
        end: endStr,
        available: !isSlotInPast && !isConflict
      })

      currentSlotStart = slotEnd
    }
  }

  return slots
}

export async function getAvailableSlots(
  locationId: string,
  targetDate: Date | string,
  resourceIds?: string[]
): Promise<TimeSlot[]> {
  try {
    const supabase = await createAdminClient()

    // 1. Fetch location availability configuration
    const { data: avail } = await supabase
      .from('location_availability')
      .select('timezone, slot_interval, schedule')
      .limit(1)
      .maybeSingle()

    if (!avail) return []

    const availability: LocationAvailability = {
      timezone: avail.timezone,
      slot_interval: avail.slot_interval,
      schedule: avail.schedule as unknown as LocationAvailability['schedule']
    }

    // 2. Format the target date (YYYY-MM-DD) reliably without timezone shifting if string is passed
    const targetDateStr = typeof targetDate === 'string' ? targetDate : format(targetDate, 'yyyy-MM-dd')

    // 3. Fetch existing bookings for this location and date
    // Since page_bookings are tied to pages, we need to find pages for the location
    const { data: pages } = await supabase
      .from('location_pages')
      .select('id')
      .eq('location_id', locationId)

    let existingBookings: BookingInterval[] = []

    if (pages && pages.length > 0) {
      const pageIds = pages.map(p => p.id)
      const { data: bookings } = await supabase
        .from('page_bookings')
        .select('booking_date, booking_time, booking_end_time, item_id')
        .in('page_id', pageIds)
        .eq('booking_date', targetDateStr)
        .neq('status', 'cancelled')
        .neq('status', 'voided')

      if (bookings) {
        existingBookings = bookings.map(b => ({
          booking_date: b.booking_date!,
          booking_time: b.booking_time,
          booking_end_time: b.booking_end_time,
          item_id: b.item_id
        }))
      }
    }

    // 4. Generate availability slots
    return generateAvailabilitySlots(targetDateStr, availability, existingBookings, resourceIds)
  } catch (error) {
    console.error('Error in getAvailableSlots:', error)
    return []
  }
}
