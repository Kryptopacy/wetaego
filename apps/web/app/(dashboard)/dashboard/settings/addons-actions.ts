'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveAddonsSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const { cookies } = await import('next/headers')
  if ((await cookies()).get('demo_mode')?.value === '1') {
    return { success: true }
  }
  if (!userData?.user) throw new Error('Not authenticated')

  const locationId = formData.get('locationId') as string
  const randomizer_enabled = formData.get('randomizerEnabled') === 'true'
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
      randomizer_enabled,
      spinner_enabled,
      spinner_config
    })
    .eq('id', locationId)

  if (error) throw new Error((error as Error).message)

  revalidatePath('/dashboard/settings')
}
