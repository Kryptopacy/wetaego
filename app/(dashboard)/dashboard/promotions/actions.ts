'use server'

import { authActionClient } from '@/lib/safe-action'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export const createPromoCodeAction = authActionClient
  .schema(z.object({
    organization_id: z.string().uuid(),
    location_id: z.string().uuid(),
    code: z.string().min(3).max(20).toUpperCase(),
    discount_type: z.enum(['percentage', 'flat']),
    discount_value: z.number().min(0),
    max_uses: z.number().nullable(),
    valid_until: z.string().nullable(),
  }))
  .action(async ({ parsedInput, ctx: { supabase, user } }) => {
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/promotions')
      return { success: true }
    }

    const { organization_id, location_id, code, discount_type, discount_value, max_uses, valid_until } = parsedInput

    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .single()

    let isAuthorized = member?.role === 'owner' || member?.role === 'manager'
    
    if (!member) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', organization_id)
        .eq('created_by', user.id)
        .single()
      isAuthorized = !!org
    }

    if (!isAuthorized) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('location_promo_codes')
      .insert({
        location_id,
        code: code.replace(/\s+/g, '').toUpperCase(),
        discount_type,
        discount_value,
        max_uses,
        valid_until,
        is_active: true
      })

    if (error) {
      if (error.code === '23505') {
        throw new Error('A promo code with this name already exists for this location.')
      }
      throw new Error('Failed to create promo code: ' + error.message)
    }

    revalidatePath('/dashboard/promotions')
    return { success: true }
  })

export const togglePromoCodeAction = authActionClient
  .schema(z.object({
    promo_code_id: z.string().uuid(),
    is_active: z.boolean(),
  }))
  .action(async ({ parsedInput, ctx: { supabase, user } }) => {
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/promotions')
      return { success: true }
    }

    const { error } = await supabase
      .from('location_promo_codes')
      .update({ is_active: parsedInput.is_active })
      .eq('id', parsedInput.promo_code_id)

    if (error) throw new Error('Failed to update promo code.')

    revalidatePath('/dashboard/promotions')
    return { success: true }
  })

export const deletePromoCodeAction = authActionClient
  .schema(z.object({
    promo_code_id: z.string().uuid(),
  }))
  .action(async ({ parsedInput, ctx: { supabase, user } }) => {
    if ((await cookies()).get('demo_mode')?.value === '1') {
      revalidatePath('/dashboard/promotions')
      return { success: true }
    }

    const { error } = await supabase
      .from('location_promo_codes')
      .delete()
      .eq('id', parsedInput.promo_code_id)

    if (error) throw new Error('Failed to delete promo code.')

    revalidatePath('/dashboard/promotions')
    return { success: true }
  })
