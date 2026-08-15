'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { authActionClient } from '@/lib/safe-action'

export const saveDeliveryRules = authActionClient
  .schema(zfd.formData({
    locationId: zfd.text(z.string().uuid()),
    pageId: zfd.text(z.string().uuid().optional()),
    delivery_enabled: zfd.checkbox(),
    delivery_fee_minor: zfd.numeric(z.number().min(0).default(0)),
    delivery_minimum_order_minor: zfd.numeric(z.number().min(0).default(0)),
    delivery_note: zfd.text(z.string().optional()),
  }))
  .action(async ({ parsedInput, ctx: { supabase } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      return { success: true }
    }

    const {
      locationId,
      pageId,
      delivery_enabled,
      delivery_fee_minor,
      delivery_minimum_order_minor,
      delivery_note,
    } = parsedInput

    if (pageId) {
      const { error } = await supabase
        .from('location_pages')
        .update({
          delivery_enabled,
          delivery_fee_minor,
          delivery_minimum_order_minor,
          delivery_note: delivery_note || null,
        })
        .eq('id', pageId)

      if (error) throw new Error(error.message)
    } else {
      // Fallback: update all pages for this location
      const { error } = await supabase
        .from('location_pages')
        .update({
          delivery_enabled,
          delivery_fee_minor,
          delivery_minimum_order_minor,
          delivery_note: delivery_note || null,
        })
        .eq('location_id', locationId)

      if (error) throw new Error(error.message)
    }

    revalidatePath('/dashboard/delivery')
    revalidatePath('/dashboard/settings')
    revalidatePath('/m/[slug]', 'layout')
    return { success: true }
  })
