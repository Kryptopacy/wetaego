'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { authActionClient } from '@/lib/safe-action'

export const saveLocationPromotions = authActionClient
  .schema(zfd.formData({
    pageId: zfd.text(z.string().uuid()),
    global_discount_enabled: zfd.checkbox(),
    global_discount_percentage: zfd.numeric(z.number().default(0)),
    global_discount_banner_text: zfd.text(z.string().optional()),
  }))
  .action(async ({ parsedInput, ctx: { supabase } }) => {
    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      return { success: true }
    }

    const {
      pageId,
      global_discount_enabled,
      global_discount_percentage,
      global_discount_banner_text,
    } = parsedInput

    // @ts-expect-error - location_pages might not be in the generated types yet
    const { error } = await supabase
      .from('location_pages')
      .update({
        global_discount_enabled,
        global_discount_percentage,
        global_discount_banner_text: global_discount_banner_text || null,
      })
      .eq('id', pageId)

    if (error) throw new Error((error as Error).message)

    revalidatePath('/dashboard/settings')
    return { success: true }
  })
