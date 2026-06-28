'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { authActionClient } from '@/lib/safe-action'

export const saveTax = authActionClient
  .schema(zfd.formData({
    id: zfd.text(z.string().uuid().optional()),
    location_id: zfd.text(z.string().uuid()),
    name: zfd.text(z.string().min(1, 'Tax name is required')),
    percentage: zfd.numeric(z.number().min(0, 'Percentage cannot be negative')),
    is_active: zfd.checkbox().default(true)
  }))
  .action(async ({ parsedInput: { id, location_id, name, percentage, is_active }, ctx: { supabase } }) => {
    if (id) {
      // Update
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('location_taxes')
        .update({ name, percentage, is_active })
        .eq('id', id)
        .eq('location_id', location_id)
      
      if (error) throw new Error(error.message || 'Failed to update tax')
    } else {
      // Insert
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('location_taxes')
        .insert({ location_id, name, percentage, is_active })
      
      if (error) throw new Error(error.message || 'Failed to insert tax')
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
  })

export const deleteTax = authActionClient
  .schema(z.object({
    taxId: z.string().uuid(),
    locationId: z.string().uuid()
  }))
  .action(async ({ parsedInput: { taxId, locationId }, ctx: { supabase } }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('location_taxes')
      .delete()
      .eq('id', taxId)
      .eq('location_id', locationId)

    if (error) throw new Error(error.message || 'Failed to delete tax')

    revalidatePath('/dashboard/settings')
    return { success: true }
  })
