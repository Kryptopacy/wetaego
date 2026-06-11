'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCustomPage(formData: FormData) {
  const supabase = await createClient()
  const title = formData.get('title') as string
  const slug = formData.get('slug') as string
  const content = formData.get('content') as string
  const location_id = formData.get('location_id') as string

  if (location_id === 'demo-loc') {
    revalidatePath('/dashboard/pages')
    return { success: true }
  }

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: 'Not authenticated' }

  // 1. Get organization ID for this location
  const { data: loc } = await supabase.from('locations').select('organization_id').eq('id', location_id).single()
  if (!loc) return { error: 'Location not found' }
  const orgId = loc.organization_id

  // 2. Get org tier and current page count
  const { data: org } = await supabase.from('organizations').select('subscription_tier').eq('id', orgId).single()
  const { count } = await supabase.from('location_pages').select('id', { count: 'exact' }).eq('location_id', location_id)
  
  const { getFreePagesLimit } = await import('@/lib/utils/billing')
  const freeLimit = await getFreePagesLimit(org?.subscription_tier || 'starter')
  
  // 3. If over limit, charge custom page credits
  if ((count || 0) >= freeLimit) {
    const { getCreditCosts } = await import('@/lib/utils/settings')
    const creditCosts = await getCreditCosts() as Record<string, number>
    const pageCost = creditCosts.custom_page || 10

    const { chargeCredits } = await import('@/lib/payments/credits')
    const charge = await chargeCredits(orgId, pageCost, `Created Custom Page: ${slug}`, userData.user.id)
    if (!charge.success) {
      return { error: `Insufficient credits to create an extra custom page. Please buy more credits. (Cost: ${pageCost})` }
    }
  }

  const { error } = await supabase.from('location_pages').insert({
    location_id,
    title,
    slug,
    content,
    is_published: true
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/pages')
  return { success: true }
}

export async function togglePageStatus(formData: FormData) {
  const supabase = await createClient()
  const pageId = formData.get('pageId') as string
  const currentStatus = formData.get('currentStatus') === 'true'
  
  if (pageId.startsWith('page-')) {
    revalidatePath('/dashboard/pages')
    return
  }

  await supabase.from('location_pages').update({ is_published: !currentStatus }).eq('id', pageId)
  revalidatePath('/dashboard/pages')
}

export async function deletePage(formData: FormData) {
  const supabase = await createClient()
  const pageId = formData.get('pageId') as string
  
  if (pageId.startsWith('page-')) {
    revalidatePath('/dashboard/pages')
    return
  }

  await supabase.from('location_pages').delete().eq('id', pageId)
  revalidatePath('/dashboard/pages')
}
