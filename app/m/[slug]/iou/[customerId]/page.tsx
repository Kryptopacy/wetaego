import { notFound, redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import IouPaymentClient from './iou-payment-client'

export const metadata = {
  title: 'Settle IOU Balance',
}

interface PageProps {
  params: Promise<{ slug: string; customerId: string }>
}

export default async function IouPaymentPage({ params }: PageProps) {
  const { slug, customerId } = await params
  const supabase = await createAdminClient()

  // 1. Get organization and currency
  const { data: orgData } = await supabase
    .from('organizations')
    .select('id, name, logo_url, locations(currency_code)')
    .eq('slug', slug)
    .single()

  if (!orgData) notFound()

  const currency = orgData.locations?.[0]?.currency_code || 'NGN'

  // 2. Get customer details
  const { data: customer } = await supabase
    .from('customer_profiles')
    .select('credit_balance_minor')
    .eq('id', customerId)
    .eq('organization_id', orgData.id)
    .single()

  if (!customer) notFound()

  // 3. Get IOU Settings
  const { data: iouSettings } = await supabase
    .from('iou_settings')
    .select('minimum_repayment_percentage')
    .eq('organization_id', orgData.id)
    .single()

  const minPercentage = iouSettings?.minimum_repayment_percentage || 100

  // If no balance, just show a success/empty state
  if ((customer.credit_balance_minor || 0) <= 0) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">You're All Caught Up!</h1>
        <p className="text-zinc-400 max-w-sm">
          You currently have no outstanding IOU balance with {orgData.name}.
        </p>
      </div>
    )
  }

  return (
    <IouPaymentClient 
      organizationId={orgData.id}
      organizationName={orgData.name}
      logoUrl={orgData.logo_url || ''}
      customerId={customerId}
      customerName={'Customer'}
      balanceMinor={customer.credit_balance_minor || 0}
      currency={currency}
      minPercentage={minPercentage}
      slug={slug}
    />
  )
}
