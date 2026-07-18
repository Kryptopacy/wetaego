'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { authActionClient } from '@/lib/safe-action'
import { z } from 'zod'

const availabilitySchema = z.object({
  location_id: z.string().uuid(),
  timezone: z.string(),
  slot_interval: z.number().int().min(5).max(1440),
  schedule: z.any() // JSONB
})

export const upsertAvailability = authActionClient
  .schema(availabilitySchema)
  .action(async ({ parsedInput }) => {
    const { location_id, timezone, slot_interval, schedule } = parsedInput
    const supabase = await createClient()

    const { error } = await supabase
      .from('location_availability')
      .upsert(
        {
          location_id,
          timezone,
          slot_interval,
          schedule
        },
        { onConflict: 'location_id' }
      )

    if (error) {
      console.error('Failed to upsert availability:', error)
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/availability')
    return { success: true }
  })
