import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getPlanLimits } from '@/lib/utils/settings'
import * as Sentry from '@sentry/nextjs'

export type PlanType = 'lite' | 'pro' | 'enterprise' | string

/**
 * Attempts to charge credits for an organization.
 * Uses an atomic PostgreSQL function (charge_credits_atomic) to prevent race conditions.
 * @returns { success: boolean, remaining?: number, error?: string }
 */
export async function chargeCredits(organizationId: string, cost: number, reason: string, userId?: string) {
  try {
    const supabase = await createAdminClient()

    // Use the atomic RPC function (prevents race conditions via SELECT ... FOR UPDATE)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: rpcError } = await supabase.rpc('charge_credits_atomic' as any, {
      p_organization_id: organizationId,
      p_cost: cost,
      p_reason: reason,
      p_user_id: userId || null,
    })

    if (rpcError) {
      // If the RPC function doesn't exist yet (migration not applied), fall back to non-atomic
      if (rpcError.message?.includes('function') && rpcError.message?.includes('does not exist')) {
        console.warn('charge_credits_atomic RPC not found — using fallback. Apply the 20260622100000_atomic_credits migration.')
        return await chargeCreditsFallback(organizationId, cost, reason, userId)
      }
      throw new Error(rpcError.message)
    }

    const result = data as unknown as { success: boolean; remaining?: number; error?: string }
    return result

  } catch (error) {
    Sentry.captureException(error)
    return { success: false, error: (error as Error).message || 'An unexpected error occurred while processing credits.' }
  }
}

/**
 * Non-atomic fallback for environments where the migration hasn't been applied.
 * @deprecated Use the atomic RPC once the migration is applied.
 */
async function chargeCreditsFallback(organizationId: string, cost: number, reason: string, userId?: string) {
  const supabase = await createAdminClient()

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('subscription_tier, purchased_credits, monthly_free_credits_used')
    .eq('id', organizationId)
    .single()

  if (orgError || !org) {
    throw new Error('Organization not found')
  }

  const tier = (org.subscription_tier || 'lite') as string
  const dynamicPlanLimits = await getPlanLimits() as Record<string, { credits: number, pages: number }>
  const monthlyLimit = dynamicPlanLimits[tier]?.credits ?? (tier === 'trial' || tier === 'pro' ? 50 : 10)
  const availableFree = Math.max(0, monthlyLimit - org.monthly_free_credits_used)
  const totalAvailable = availableFree + org.purchased_credits

  if (totalAvailable < cost) {
    return { success: false, error: "Insufficient credits. Please upgrade your plan or purchase additional credits." }
  }

  let newFreeUsed = org.monthly_free_credits_used
  let newPurchased = org.purchased_credits

  if (availableFree >= cost) {
    newFreeUsed += cost
  } else {
    newFreeUsed += availableFree
    newPurchased -= (cost - availableFree)
  }

  const { error: updateError } = await supabase
    .from('organizations')
    .update({ monthly_free_credits_used: newFreeUsed, purchased_credits: newPurchased })
    .eq('id', organizationId)

  if (updateError) throw updateError

  await supabase.from('credit_transactions').insert({
    organization_id: organizationId,
    amount: -cost,
    reason,
    created_by: userId
  })

  return { success: true, remaining: (newPurchased + Math.max(0, monthlyLimit - newFreeUsed)) }
}


/**
 * Refunds credits for an organization if an action failed after charge.
 */
export async function refundCredits(organizationId: string, amountToRefund: number, reason: string, userId?: string) {
  try {
    const supabase = await createAdminClient()

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('purchased_credits, monthly_free_credits_used')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) return { success: false, error: 'Organization not found' }

    // First try to refund into monthly free pool (reduce the usage)
    const amountToFreePool = Math.min(amountToRefund, org.monthly_free_credits_used)
    const amountToPurchased = amountToRefund - amountToFreePool

    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        monthly_free_credits_used: Math.max(0, org.monthly_free_credits_used - amountToFreePool),
        purchased_credits: org.purchased_credits + amountToPurchased
      })
      .eq('id', organizationId)

    if (updateError) throw updateError

    // Log the refund transaction
    await supabase.from('credit_transactions').insert({
      organization_id: organizationId,
      amount: amountToRefund,
      reason: `Refund: ${reason}`,
      created_by: userId
    })

    return { success: true }
  } catch (error) {
    Sentry.captureException(error)
    return { success: false, error: 'Failed to refund credits' }
  }
}
