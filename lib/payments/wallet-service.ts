import { SupabaseClient } from '@supabase/supabase-js'

export async function refundWalletTransaction(
  adminClient: SupabaseClient,
  orderId: string,
  organizationId: string,
  customerId: string,
  amountMinor: number
) {
  // Refund the wallet balance by fetching and updating
  const { data: customer } = await adminClient
    .from('customer_profiles')
    .select('wallet_balance_minor')
    .limit(1)
    .maybeSingle()
    
  if (customer) {
    const newBalance = (customer.wallet_balance_minor || 0) + amountMinor
    await adminClient
      .from('customer_profiles')
      .update({ wallet_balance_minor: newBalance })
      .eq('id', customerId)
      
    // Log the rollback transaction
    await adminClient
      .from('wallet_transactions')
      .insert({
        organization_id: organizationId,
        customer_id: customerId,
        amount_minor: amountMinor,
        transaction_type: 'credit',
        description: `Refund for failed order payment ${orderId.substring(0, 8)}`,
        status: 'completed'
      })
  }
}
