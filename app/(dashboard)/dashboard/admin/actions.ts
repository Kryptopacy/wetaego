'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { authActionClient } from '@/lib/safe-action'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { isAdminEmail } from '@/lib/utils/admin'

export const updateSetting = authActionClient
  .schema(zfd.formData(z.any()))
  .action(async ({ parsedInput: formData, ctx: { user } }) => {
    const supabase = await createClient()

    if (!isAdminEmail(user.email)) {
      throw new Error('Unauthorized')
    }

    const key = formData.get('key') as string
    const isJson = formData.get('is_json') === 'true'

    
    let value: Record<string, any> = {}

    if (isJson) {
      const rawJson = formData.get('json_value') as string
      try {
        value = JSON.parse(rawJson)
      } catch {
        throw new Error('Invalid JSON format')
      }
    } else {
      // Collect all other keys into an object
      formData.forEach((val: FormDataEntryValue, k: string) => {
        if (k !== 'key' && k !== 'is_json' && !k.startsWith('$ACTION')) {
          if (key === 'pricing' || key === 'trial_settings' || key === 'credit_costs') {
            value[k] = Number(val)
          } else {
            value[k] = val
          }
        }
      })
    }

    
    const { error } = await (supabase as any)
      .from('system_settings')
      .upsert({
        key,
        value,
        updated_by: user.id
      })

    if (error) {
      console.error('Failed to update setting', error)
      throw new Error('Failed to update setting')
    }

    revalidatePath('/', 'layout')
    return { success: true }
  })

export const overrideTenantPlan = authActionClient
  .schema(zfd.formData(z.any()))
  .action(async ({ parsedInput: formData, ctx: { user } }) => {
    const supabase = await createClient()

    if (!isAdminEmail(user.email)) {
      throw new Error('Unauthorized')
    }

    const orgId = formData.get('org_id') as string
    const plan = formData.get('subscription_plan') as string
    const status = formData.get('subscription_status') as string
    const credits = Number(formData.get('purchased_credits')) || 0

    
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
    return { success: true }
  })

export const createCoupon = authActionClient
  .schema(zfd.formData(z.any()))
  .action(async ({ parsedInput: formData, ctx: { user } }) => {
    const supabase = await createClient()

    if (!isAdminEmail(user.email)) {
      throw new Error('Unauthorized')
    }

    const code = (formData.get('code') as string).toUpperCase().trim()
    const discount_type = formData.get('discount_type') as 'free_plan' | 'free_credits' | 'plan_extension' | 'trial_extension'
    const discount_value = Number(formData.get('discount_value'))
    const plan_tier = discount_type === 'free_plan' ? (formData.get('plan_tier') as string) : null
    
    const expires_at_raw = formData.get('expires_at') as string
    const expires_at = expires_at_raw ? new Date(expires_at_raw).toISOString() : null
    
    const max_redemptions_raw = formData.get('max_redemptions') as string
    const max_redemptions = max_redemptions_raw ? Number(max_redemptions_raw) : null

    const { error } = await supabase.from('coupons').insert({
      code,
      discount_type,
      discount_value,
      plan_tier,
      expires_at,
      max_redemptions,
      created_by: user.id
    })

    if (error) {
      console.error('Failed to create coupon:', error)
      throw new Error('Failed to create coupon')
    }

    revalidatePath('/dashboard/admin')
    return { success: true }
  })
