'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { authActionClient } from '@/lib/safe-action'

export const saveLocationPromotions = authActionClient
  .schema(zfd.formData({
    locationId: zfd.text(z.string().uuid()),
    global_discount_enabled: zfd.checkbox(),
    global_discount_percentage: zfd.numeric(z.number().default(0)),
    global_discount_banner_text: zfd.text(z.string().optional()),
    spinner_enabled: zfd.checkbox(),
    spinner_config: zfd.text(z.string().optional()),
  }))
  .action(async ({ parsedInput, ctx: { supabase } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      return { success: true }
    }

    const {
      locationId,
      global_discount_enabled,
      global_discount_percentage,
      global_discount_banner_text,
      spinner_enabled,
    } = parsedInput

    let spinner_config = null
    try {
      if (parsedInput.spinner_config) {
        spinner_config = JSON.parse(parsedInput.spinner_config)
      }
    } catch {
      throw new Error('Invalid JSON for Wheel Segments')
    }

    const { error } = await supabase
      .from('locations')
      .update({
        global_discount_enabled,
        global_discount_percentage,
        global_discount_banner_text: global_discount_banner_text || null,
        spinner_enabled,
        spinner_config
      })
      .eq('id', locationId)

    if (error) throw new Error((error as Error).message)

    revalidatePath('/dashboard/settings')
    return { success: true }
  })
