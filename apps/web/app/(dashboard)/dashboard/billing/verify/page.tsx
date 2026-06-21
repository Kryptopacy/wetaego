/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect, @typescript-eslint/ban-ts-comment */
// FIXME: Developer bypassed types/rules. Requires refactoring for true perfection.
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function BillingVerifyPage({
  searchParams
}: {
  searchParams: Promise<{ reference?: string }>
}) {
  const params = await searchParams
  const reference = params.reference

  if (!reference) {
    return redirect('/dashboard/billing')
  }

  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

  // Verify the transaction immediately for good UX
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
    }
  })

  const data = await res.json()

  if (data.status && data.data.status === 'success') {
    // Transaction successful. Update the organization status immediately.
    // The webhook will also catch this, but this makes the UI instantly responsive.
    const orgId = data.data.metadata?.organization_id
    const planType = data.data.metadata?.plan_type
    
    if (orgId) {
      const supabase = await createClient()
      const updateData: any = { subscription_status: 'active' }
      if (planType) {
        updateData.subscription_plan = planType
      }

      await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', orgId)
    }
    
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-6">
        <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-3xl font-bold text-white">Subscription Active!</h1>
        <p className="text-zinc-400">Your card has been successfully authorized and your subscription is now active.</p>
        <div className="pt-8">
          <a href="/dashboard" className="bg-white text-black font-bold py-3 px-8 rounded-full transition-colors hover:bg-zinc-200">
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-20 text-center space-y-6">
      <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
      </div>
      <h1 className="text-3xl font-bold text-white">Verification Failed</h1>
      <p className="text-zinc-400">We could not verify your subscription payment. Please try again or contact support.</p>
      <div className="pt-8">
        <a href="/dashboard/billing" className="bg-zinc-800 text-white font-bold py-3 px-8 rounded-full transition-colors hover:bg-zinc-700">
          Back to Billing
        </a>
      </div>
    </div>
  )
}
