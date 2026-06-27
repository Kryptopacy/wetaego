'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const taxSchema = z.object({
  id: z.string().uuid().optional(),
  location_id: z.string().uuid(),
  name: z.string().min(1, 'Tax name is required'),
  percentage: z.number().min(0, 'Percentage cannot be negative'),
  is_active: z.boolean().default(true)
})

export async function saveTax(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) throw new Error('Not authenticated')

    const parsed = taxSchema.safeParse({
      id: formData.get('id') || undefined,
      location_id: formData.get('location_id'),
      name: formData.get('name'),
      percentage: parseFloat(formData.get('percentage') as string),
      is_active: formData.get('is_active') === 'true'
    })

    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { id, location_id, name, percentage, is_active } = parsed.data

    if (id) {
      // Update
      const { error } = await supabase
        .from('location_taxes' as any)
        .update({ name, percentage, is_active })
        .eq('id', id)
        .eq('location_id', location_id)
      
      if (error) throw error
    } else {
      // Insert
      const { error } = await supabase
        .from('location_taxes' as any)
        .insert({ location_id, name, percentage, is_active })
      
      if (error) throw error
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Failed to save tax' }
  }
}

export async function deleteTax(taxId: string, locationId: string) {
  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('location_taxes' as any)
      .delete()
      .eq('id', taxId)
      .eq('location_id', locationId)

    if (error) throw error

    revalidatePath('/dashboard/settings')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Failed to delete tax' }
  }
}
