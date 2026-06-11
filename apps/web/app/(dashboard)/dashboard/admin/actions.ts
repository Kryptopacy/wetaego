'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSetting(formData: FormData) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (data?.user?.email !== 'kryptopacy@gmail.com') {
    throw new Error('Unauthorized')
  }

  const key = formData.get('key') as string
  const isJson = formData.get('is_json') === 'true'

  let value: any = {}

  if (isJson) {
    const rawJson = formData.get('json_value') as string
    try {
      value = JSON.parse(rawJson)
    } catch (e) {
      throw new Error('Invalid JSON format')
    }
  } else {
    // Collect all other keys into an object
    formData.forEach((val, k) => {
      if (k !== 'key' && k !== 'is_json' && !k.startsWith('$ACTION')) {
        // Automatically cast numbers for pricing
        if (key === 'pricing') {
          value[k] = Number(val)
        } else {
          value[k] = val
        }
      }
    })
  }

  const { error } = await supabase
    .from('system_settings')
    .upsert({
      key,
      value,
      updated_by: data.user.id
    })

  if (error) {
    console.error('Failed to update setting', error)
    throw new Error('Failed to update setting')
  }

  revalidatePath('/', 'layout')
}
