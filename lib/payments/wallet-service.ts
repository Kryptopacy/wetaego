import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Refunds a wallet deduction after a failed payment.
 * Uses an atomic RPC (refund_wallet) that locks the customer row FOR UPDATE
 * and increments the balance server-side, avoiding both the wrong-row read
 * and the read-then-write race condition.
 */
export async function refundWalletTransaction(
  adminClient: SupabaseClient,
  orderId: string,
  organizationId: string,
  customerId: string,
  amountMinor: number
) {
  if (!customerId || !organizationId || !Number.isFinite(amountMinor) || amountMinor <= 0) {
    return
  }

  const { error } = await adminClient.rpc('refund_wallet', {
    p_organization_id: organizationId,
    p_customer_id: customerId,
    p_amount_minor: amountMinor,
    p_description: `Refund for failed order payment ${orderId.substring(0, 8)}`
  })

  if (error) {
    console.error('Wallet refund failed:', error)
    throw new Error('Wallet refund failed')
  }
}
