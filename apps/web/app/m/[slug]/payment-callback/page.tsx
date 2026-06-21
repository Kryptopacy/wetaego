/* eslint-disable react/no-unescaped-entities */
// FIXME: Developer bypassed types/rules. Requires refactoring for true perfection.
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function PaymentCallbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ reference?: string; trxref?: string }>
}) {
  const { slug } = await params
  const { reference } = await searchParams

  if (!reference) {
    redirect(`/m/${slug}`)
  }

  const supabase = await createClient()

  // Verify the order status
  // It's possible the webhook hasn't processed it yet (race condition), 
  // so we show a success screen regardless and rely on Realtime on the live tracker
  const { data: order } = await supabase
    .from('orders')
    .select('id, table_identifier, status')
    .eq('id', reference)
    .single()

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold text-red-500">Order Not Found</h1>
        <p className="text-zinc-400">We couldn't find the order associated with this payment.</p>
        <Link href={`/m/${slug}`} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full">
          Return to Menu
        </Link>
      </div>
    )
  }

  // Redirect to the live order tracker for their table
  // The live tracker will show "paid" or "pending" (which auto updates when webhook finishes)
  redirect(`/m/${slug}/${order.table_identifier}?orderId=${order.id}`)
}
