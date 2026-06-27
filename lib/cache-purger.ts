import { createClient } from '@/lib/supabase/server'
import { invalidateCache } from '@/lib/redis-cache'
import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * World-Class Edge Caching:
 * Purges the Redis edge caches and Next.js static caches for all public storefronts
 * associated with an organization. This enables On-Demand Revalidation.
 */
export async function purgeStorefrontCache(orgId: string) {
  try {
    const supabase = await createClient()
    const { data: locations } = await supabase
      .from('locations')
      .select('id, slug')
      .eq('organization_id', orgId)

    if (!locations) return

    for (const loc of locations) {
      // 1. Purge Redis distributed edge caches
      await invalidateCache(`location_${loc.slug}`)
      await invalidateCache(`location_pages_${loc.id}`)
      await invalidateCache(`menu_categories_${loc.id}`)

      // 2. Purge Next.js static page cache & fetch tags
      revalidateTag(`location_data_${loc.slug}`, 'default')
      revalidateTag(`location_pages_${loc.id}`, 'default')
      revalidateTag(`menu_categories_${loc.id}`, 'default')
      
      revalidatePath(`/m/${loc.slug}`, 'page')
      revalidatePath(`/m/${loc.slug}`)
    }
  } catch (error) {
    console.error('Failed to purge storefront cache:', error)
  }
}
