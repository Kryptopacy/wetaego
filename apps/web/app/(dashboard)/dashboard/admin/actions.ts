'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSetting(formData: FormData) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (data?.user?.email !== (process.env.ADMIN_EMAIL || 'kryptopacy@gmail.com')) {
    throw new Error('Unauthorized')
  }

  const key = formData.get('key') as string
  const isJson = formData.get('is_json') === 'true'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: Record<string, any> = {}

  if (isJson) {
    const rawJson = formData.get('json_value') as string
    try {
      value = JSON.parse(rawJson)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
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

export async function overrideTenantPlan(formData: FormData) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (data?.user?.email !== (process.env.ADMIN_EMAIL || 'kryptopacy@gmail.com')) {
    throw new Error('Unauthorized')
  }

  const orgId = formData.get('org_id') as string
  const plan = formData.get('subscription_plan') as string
  const status = formData.get('subscription_status') as string
  const credits = Number(formData.get('purchased_credits')) || 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('organizations')
    .update({
      subscription_plan: plan,
      subscription_status: status,
      purchased_credits: credits,
      updated_at: new Date().toISOString()
    })
    .eq('id', orgId)

  if (error) {
    console.error('Override error:', error)
    throw new Error('Failed to override tenant plan')
  }

  revalidatePath('/dashboard/admin')
}
