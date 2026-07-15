'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAd(data: {
  location_id: string
  title: string
  category: string
  image_url: string
  target_link: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('sponsored_ads' as any).insert([
    {
      ...data,
      is_platform_ad: false, // Merchants can only create BYO ads
      approval_status: 'approved', // BYO ads are auto-approved for their own catalog
      is_active: true
    }
  ])

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/ads')
  revalidatePath('/m/[slug]', 'layout') // Revalidate public portals
  return { success: true }
}

export async function toggleAdStatus(adId: string, isActive: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('sponsored_ads' as any)
    .update({ is_active: isActive })
    .eq('id', adId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/ads')
  revalidatePath('/m/[slug]', 'layout')
  return { success: true }
}

export async function deleteAd(adId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('sponsored_ads' as any)
    .delete()
    .eq('id', adId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/ads')
  revalidatePath('/m/[slug]', 'layout')
  return { success: true }
}

export async function getAdStats(adId: string) {
  const supabase = await createClient()
  
  const { count: impressions, error: impError } = await supabase
    .from('ad_events' as any)
    .select('id', { count: 'exact', head: true })
    .eq('ad_id', adId)
    .eq('event_type', 'impression')

  const { count: clicks, error: clickError } = await supabase
    .from('ad_events' as any)
    .select('id', { count: 'exact', head: true })
    .eq('ad_id', adId)
    .eq('event_type', 'click')

  if (impError || clickError) {
    return { error: 'Failed to fetch stats' }
  }

  const ctr = impressions ? ((clicks || 0) / impressions) * 100 : 0

  return {
    impressions: impressions || 0,
    clicks: clicks || 0,
    ctr: ctr.toFixed(2)
  }
}
