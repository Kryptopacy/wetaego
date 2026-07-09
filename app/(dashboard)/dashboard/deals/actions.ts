'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { authActionClient } from '@/lib/safe-action'
import { z } from 'zod'

export const createDealAction = authActionClient
  .schema(z.object({
    organization_id: z.string(),
    location_id: z.string(),
    name: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(['time_based', 'quantity_based', 'manual']),
    is_active: z.union([z.boolean(), z.string()]).transform(v => v === true || v === 'true'),
    start_time: z.string().optional().nullable(),
    end_time: z.string().optional().nullable(),
  }))
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('deals')
      .insert({
        organization_id: parsedInput.organization_id,
        location_id: parsedInput.location_id,
        name: parsedInput.name,
        description: parsedInput.description || null,
        type: parsedInput.type,
        is_active: parsedInput.is_active,
        start_time: parsedInput.start_time || null,
        end_time: parsedInput.end_time || null,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/deals')
    return { success: true, deal: data }
  })

export const toggleDealAction = authActionClient
  .schema(z.object({ deal_id: z.string(), is_active: z.boolean() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()
    const { error } = await supabase
      .from('deals')
      .update({ is_active: parsedInput.is_active })
      .eq('id', parsedInput.deal_id)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/deals')
    return { success: true }
  })

export const deleteDealAction = authActionClient
  .schema(z.object({ deal_id: z.string() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()
    const { error } = await supabase.from('deals').delete().eq('id', parsedInput.deal_id)
    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/deals')
    return { success: true }
  })

export const addDealItemAction = authActionClient
  .schema(z.object({
    deal_id: z.string(),
    menu_item_id: z.string(),
    deal_price_minor: z.number().min(0),
    quantity_limit: z.number().nullable().optional(),
  }))
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()
    const { error } = await supabase
      .from('deal_items')
      .insert({
        deal_id: parsedInput.deal_id,
        menu_item_id: parsedInput.menu_item_id,
        deal_price_minor: parsedInput.deal_price_minor,
        quantity_limit: parsedInput.quantity_limit ?? null,
      })

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/deals')
    return { success: true }
  })

export const removeDealItemAction = authActionClient
  .schema(z.object({ deal_item_id: z.string() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createClient()
    const { error } = await supabase.from('deal_items').delete().eq('id', parsedInput.deal_item_id)
    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/deals')
    return { success: true }
  })
