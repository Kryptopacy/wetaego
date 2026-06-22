import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { OrderStatusClient } from './order-status-client'

export default async function OrderStatusPage(props: { params: Promise<{ slug: string, id: string }> }) {
  const { slug, id } = await props.params
  const supabase = await createClient()

  // 1. Resolve Location via slug
  const { data: locationPage } = await supabase
    .from('location_pages')
    .select('location_id, locations(*)')
    .eq('slug', slug)
    .single()

  if (!locationPage?.locations) {
    notFound()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const location = locationPage.locations as any

  // 2. Fetch Order
  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single()

  if (!order) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <OrderStatusClient 
          initialOrder={order} 
          manualPaymentBankName={location.manual_payment_bank_name}
          manualPaymentAccountName={location.manual_payment_account_name}
          manualPaymentAccountNumber={location.manual_payment_account_number}
          manualPaymentInstructions={location.manual_payment_instructions}
          slug={slug}
        />
      </div>
    </div>
  )
}
