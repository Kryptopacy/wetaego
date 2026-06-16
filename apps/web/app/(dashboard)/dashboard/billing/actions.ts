'use server'

import { createClient } from '@/lib/supabase/server'
import { getOrCreateBillingPlan, initializeSubscription } from '@/lib/payments/billing'
import { redirect } from 'next/navigation'

export async function subscribeToPro(formData: FormData) {
  const supabase = await createClient()
  
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Not authenticated')

  const orgId = formData.get('organization_id') as string
  
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single()

  if (!org) throw new Error('Organization not found')

  const planCode = await getOrCreateBillingPlan(orgId, org.name)
  const authUrl = await initializeSubscription(userData.user.email!, planCode, orgId)

  redirect(authUrl)
}

import { Resend } from 'resend'
import InvoiceEmail from '../../../../emails/invoice-email'
import { waitUntil } from '@vercel/functions'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy')

export async function buyCredits(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Not authenticated')

  const orgId = formData.get('organization_id') as string
  const credits = parseInt(formData.get('credits') as string || '0', 10)

  if (!orgId || credits <= 0) throw new Error('Invalid data')

  const { data: org } = await supabase
    .from('organizations')
    .select('name, purchased_credits')
    .eq('id', orgId)
    .single()

  if (!org) throw new Error('Org not found')

  await supabase
    .from('organizations')
    .update({ purchased_credits: (org.purchased_credits || 0) + credits })
    .eq('id', orgId)

  // Normally we would redirect to a checkout page, but we'll fulfill directly for the demo
  // 3. Send the Invoice Email
  const transactionId = crypto.randomUUID() // Mock transaction ID
  const orgName = org.name || 'OurMenu Partner'
  
  waitUntil((async () => {
    const { error: resendError } = await resend.emails.send({
      from: 'OurMenu <onboarding@resend.dev>',
      to: userData.user.email!,
      subject: `Invoice for ${credits} Credits`,
      react: InvoiceEmail({
        organizationName: orgName,
        amountCredits: credits,
        userName: userData.user.email! // Or use full name if available
      }) as React.ReactElement
    }, {
      idempotencyKey: `invoice-${transactionId}`
    });

    if (resendError) {
      console.error('Failed to send invoice email:', resendError.message);
    }
  })())
}
