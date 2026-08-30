'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { authActionClient } from '@/lib/safe-action'
import { isAdminEmail } from '@/lib/utils/admin'
import { initiateTransfer } from '@/lib/payments/paystack'

export const updateSetting = authActionClient
  .schema(z.instanceof(FormData))
  .action(async ({ parsedInput: formData, ctx: { user } }) => {
    const supabase = await createClient()

    if (!isAdminEmail(user.email)) {
      throw new Error('Unauthorized')
    }

    const key = formData.get('key') as string
    const isJson = formData.get('is_json') === 'true'

    
    let value: Record<string, unknown> = {}

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

    
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key,
        value: value as unknown as string, // TypeScript hack to bypass Json union mismatch without using 'any'
        updated_by: user.id
      })

    if (error) {
      console.error('Failed to update setting', error)
      throw new Error('Failed to update setting')
    }

    revalidatePath('/', 'layout')
    return { success: true }
  })

export const payAffiliateEarnings = authActionClient
  .schema(z.object({ affiliate_id: z.string() }))
  .action(async ({ parsedInput: { affiliate_id }, ctx: { user } }) => {
    const supabase = await createClient()
    if (!isAdminEmail(user.email)) throw new Error('Unauthorized')

    const { data: affiliate } = await supabase.from('affiliates').select('paystack_recipient_code').eq('id', affiliate_id).single()
    if (!affiliate?.paystack_recipient_code) throw new Error('Affiliate has no payout recipient code configured')

    const { data: earnings } = await supabase.from('affiliate_earnings').select('id, amount_minor').eq('affiliate_id', affiliate_id).eq('status', 'pending')
    if (!earnings || earnings.length === 0) throw new Error('No pending earnings found')

    const totalMinor = earnings.reduce((sum: number, e: { amount_minor: number }) => sum + e.amount_minor, 0)

    try {
      await initiateTransfer(totalMinor, affiliate.paystack_recipient_code, "Affiliate Payout")
    } catch (error: unknown) {
      console.error('Transfer failed:', error)
      throw new Error('Transfer failed: ' + (error instanceof Error ? error.message : String(error)))
    }

    const ids = earnings.map((e: { id: string }) => e.id)
    await supabase.from('affiliate_earnings').update({ status: 'paid' }).in('id', ids)

    revalidatePath('/', 'layout')
    return { success: true, message: `Paid NGN ${(totalMinor / 100).toLocaleString()} successfully.` }
  })

export const overrideTenantPlan = authActionClient
  .schema(z.instanceof(FormData))
  .action(async ({ parsedInput: formData, ctx: { user } }) => {
    const supabase = await createClient()

    if (!isAdminEmail(user.email)) {
      throw new Error('Unauthorized')
    }

    const orgId = formData.get('org_id') as string
    const plan = formData.get('subscription_plan') as string
    const status = formData.get('subscription_status') as string
    const credits = Number(formData.get('purchased_credits')) || 0

    
    const { error } = await supabase
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
  .schema(z.instanceof(FormData))
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

export const resetFlagshipDemo = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx: { user } }) => {
    if (!isAdminEmail(user.email)) {
      throw new Error('Unauthorized')
    }

    const { createAdminClient } = await import('@/lib/supabase/server')
    const { ensureFlagshipDemoLocation } = await import('@/lib/demo/ensure-flagship-demo')
    const adminClient = await createAdminClient()

    const { data: loc } = await adminClient
      .from('locations')
      .select('id, slug, name')
      .eq('slug', 'demo')
      .maybeSingle()

    let deletedPages = 0
    let deletedItems = 0

    if (loc) {
      const { data: pages } = await adminClient
        .from('location_pages')
        .select('id')
        .eq('location_id', loc.id)

      if (pages && pages.length > 0) {
        const pageIds = pages.map((p: { id: string }) => p.id)
        await adminClient
          .from('page_items')
          .delete()
          .in('page_id', pageIds)
        deletedItems = pageIds.length

        await adminClient
          .from('location_pages')
          .delete()
          .eq('location_id', loc.id)
        deletedPages = pages.length
      }

      await adminClient.from('locations').delete().eq('id', loc.id)
    }

    const newLocationId = await ensureFlagshipDemoLocation()

    revalidatePath('/', 'layout')
    revalidatePath('/m/demo', 'layout')
    revalidatePath('/dashboard/admin')

    return {
      success: true,
      deleted: { pages: deletedPages, items: deletedItems },
      newLocationId,
      message: 'Pacy Group flagship showcase reset successfully with 76 curated items across all 9 concepts.'
    }
  })
