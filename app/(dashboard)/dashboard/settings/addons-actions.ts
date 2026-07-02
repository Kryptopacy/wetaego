'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { authActionClient } from '@/lib/safe-action'

export const saveAddonsSettings = authActionClient
  .schema(zfd.formData({
    locationId: zfd.text(z.string().uuid()),
    randomizerEnabled: zfd.checkbox(),
    spinner_enabled: zfd.checkbox(),
    spinner_config: zfd.text(z.string().optional()),
    delivery_enabled: zfd.checkbox(),
    delivery_fee_minor: zfd.numeric(z.number().default(0)),
    delivery_minimum_order_minor: zfd.numeric(z.number().default(0)),
    delivery_note: zfd.text(z.string().optional()),
  }))
  .action(async ({ parsedInput, ctx: { supabase } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      return { success: true }
    }

    const {
      locationId,
      randomizerEnabled,
      spinner_enabled,
      delivery_enabled,
      delivery_fee_minor,
      delivery_minimum_order_minor,
      delivery_note,
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
        randomizer_enabled: randomizerEnabled,
        spinner_enabled,
        spinner_config,
        delivery_enabled,
        delivery_fee_minor,
        delivery_minimum_order_minor,
        delivery_note: delivery_note || null
      })
      .eq('id', locationId)

    if (error) throw new Error((error as Error).message)

    revalidatePath('/dashboard/settings')
    return { success: true }
  })

export const saveIouSettings = authActionClient
  .schema(zfd.formData({
    organizationId: zfd.text(z.string().uuid()),
    is_enabled: zfd.checkbox(),
    auto_approve_spend_threshold_minor: zfd.numeric(z.number().optional()),
    default_credit_limit_minor: zfd.numeric(z.number().default(0)),
    reminder_frequency_days: zfd.numeric(z.number().default(7)),
  }))
  .action(async ({ parsedInput, ctx: { supabase } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      return { success: true }
    }

    const {
      organizationId,
      is_enabled,
      auto_approve_spend_threshold_minor,
      default_credit_limit_minor,
      reminder_frequency_days,
    } = parsedInput

    const { error } = await supabase
      .from('iou_settings')
      .upsert({
        organization_id: organizationId,
        is_enabled,
        auto_approve_spend_threshold_minor: auto_approve_spend_threshold_minor || null,
        default_credit_limit_minor,
        reminder_frequency_days,
      })

    if (error) throw new Error((error as Error).message)

    revalidatePath('/dashboard/settings')
    return { success: true }
  })
