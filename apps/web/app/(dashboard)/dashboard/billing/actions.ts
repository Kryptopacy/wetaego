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

export async function buyCredits(formData: FormData) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Not authenticated')

  const orgId = formData.get('organization_id') as string
  const credits = parseInt(formData.get('credits') as string || '0', 10)

  if (!orgId || credits <= 0) return { error: 'Invalid data' }

  const { data: org } = await supabase
    .from('organizations')
    .select('purchased_credits')
    .eq('id', orgId)
    .single()

  if (!org) return { error: 'Org not found' }

  await supabase
    .from('organizations')
    .update({ purchased_credits: (org.purchased_credits || 0) + credits })
    .eq('id', orgId)

  // Normally we would redirect to a checkout page, but we'll fulfill directly for the demo
  return { success: true }
}
