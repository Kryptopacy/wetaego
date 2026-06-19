import { createClient } from '@/lib/supabase/server'
import { getPlanLimits } from '@/lib/utils/settings'
import * as Sentry from '@sentry/nextjs'

export type PlanType = 'lite' | 'pro' | 'enterprise' | string

/**
 * Attempts to charge credits for an organization.
 * @returns { success: boolean, remaining?: number, error?: string }
 */
export async function chargeCredits(organizationId: string, cost: number, reason: string, userId?: string) {
  try {
    const supabase = await createClient()

    // 1. Fetch current org state
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
    const monthlyLimit = dynamicPlanLimits[tier]?.credits || 0
    const availableFree = Math.max(0, monthlyLimit - org.monthly_free_credits_used)
    
    const totalAvailable = availableFree + org.purchased_credits

    // 2. Check if they have enough
    if (totalAvailable < cost) {
      return { 
        success: false, 
        error: "Insufficient credits. Please upgrade your plan or purchase additional credits." 
      }
    }

    // 3. Deduct correctly
    let newFreeUsed = org.monthly_free_credits_used
    let newPurchased = org.purchased_credits

    if (availableFree >= cost) {
      newFreeUsed += cost
    } else {
      // Consume all remaining free credits
      newFreeUsed += availableFree
      const remainingCost = cost - availableFree
      // Consume from purchased
      newPurchased -= remainingCost
    }

    // 4. Update the organization in a transaction-like way
    // (Using RPC is better, but since we are early stage we can just do an update. 
    // For absolute safety, Supabase RPC should be used to prevent race conditions).
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        monthly_free_credits_used: newFreeUsed,
        purchased_credits: newPurchased
      })
      .eq('id', organizationId)

    if (updateError) throw updateError

    // 5. Log transaction
    await supabase.from('credit_transactions').insert({
      organization_id: organizationId,
      amount: -cost,
      reason,
      created_by: userId
    })

    return { success: true, remaining: (newPurchased + Math.max(0, monthlyLimit - newFreeUsed)) }

  } catch (error) {
    Sentry.captureException(error)
    return { success: false, error: (error as any).message || 'An unexpected error occurred while processing credits.' }
  }
}
