'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveLocationPromotions(formData: FormData) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Not authenticated')

  const locationId = formData.get('locationId') as string
  const global_discount_enabled = formData.get('global_discount_enabled') === 'on'
  const global_discount_percentage = parseInt(formData.get('global_discount_percentage') as string || '0', 10)
  const global_discount_banner_text = formData.get('global_discount_banner_text') as string
  
  const spinner_enabled = formData.get('spinner_enabled') === 'on'
  let spinner_config = null
  try {
    const rawConfig = formData.get('spinner_config') as string
    if (rawConfig) {
      spinner_config = JSON.parse(rawConfig)
    }
  } catch (e) {
    throw new Error('Invalid JSON for Wheel Segments')
  }

  if (!locationId) throw new Error('Location ID required')

  const { error } = await supabase
    .from('locations')
    .update({
      global_discount_enabled,
      global_discount_percentage,
      global_discount_banner_text,
      spinner_enabled,
      spinner_config
    })
    .eq('id', locationId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/settings')
  // We don't have the slug here easily, but the location settings update so next time it loads it will cache bust
}
