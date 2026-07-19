import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { OrderStatusClient } from './order-status-client'

export default async function OrderStatusPage(props: { params: Promise<{ slug: string, id: string }> }) {
  const { slug, id } = await props.params
  const adminSupabase = await createAdminClient()

  // 1. Resolve Location via slug
  const { data: locationPage } = await adminSupabase
    .from('location_pages')
    .select('location_id, locations(*)')
    .eq('slug', slug)
    .single()

  if (!locationPage?.locations) {
    notFound()
  }

  const location = locationPage.locations as { 
    id: string; 
    name?: string;
    manual_payment_bank_name?: string;
    manual_payment_account_name?: string;
    manual_payment_account_number?: string;
    manual_payment_instructions?: string;
    currency_code?: string;
  }

  // 2. Fetch Order — scope to the resolved location to prevent IDOR
  const { data: order } = await adminSupabase
    .from('orders')
    .select('*, order_items(*), order_payments(*)')
    .eq('id', id)
    .eq('location_id', location.id)
    .single()

  if (!order) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <OrderStatusClient 
          initialOrder={order} 
          orgName={location.name || 'OurMenu Partner'}
          manualPaymentBankName={location.manual_payment_bank_name}
          manualPaymentAccountName={location.manual_payment_account_name}
          manualPaymentAccountNumber={location.manual_payment_account_number}
          manualPaymentInstructions={location.manual_payment_instructions}
          currencyCode={location.currency_code || 'NGN'}
          slug={slug}
        />
      </div>
    </div>
  )
}
