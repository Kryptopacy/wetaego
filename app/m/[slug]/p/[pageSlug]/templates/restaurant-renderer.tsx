import { createAnonClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import { MenuRenderer, CategoryWithItems } from '../../../menu-renderer'
import { LiveOrderTracker, CustomMilestone } from '../../../live-order-tracker'
import { GlobalDiscountBanner } from '../../../components/global-discount-banner'
import { CartFAB } from '../../../cart-fab'
import { VenueHeader } from '../../../components/venue-header'

import type { Database } from '@/lib/supabase/types'

type Location = Database['public']['Tables']['locations']['Row']

export async function RestaurantRenderer({
  location,
  slug,
  tableIdentifier,
  paymentIsLive,
  page,
  upsellMode,
}: {
  location: Location
  slug: string
  tableIdentifier?: string
  paymentIsLive: boolean
  page: { id: string; background_color?: string }
  upsellMode?: string
}) {
  const fetchMenuCategories = async () => {
    const anonSupabase = createAnonClient()
    
    // Fetch collections and their junction to items
    const { data: collections } = await anonSupabase
      .from('page_collections')
      .select('*, page_item_collections(page_items(*))')
      .eq('page_id', page.id)
      .order('sort_order')
    
    if (!collections) return []

    // Map to the legacy structure expected by MenuRenderer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return collections.map((col: any) => {
      // Filter out nulls just in case, and extract the actual page_items
      const items = (col.page_item_collections || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((pic: any) => pic.page_items)
        .filter(Boolean)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => ((a?.sort_order || 0) - (b?.sort_order || 0)))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => ({
          id: item?.id,
          name: item?.title,
          description: item?.description,
          price_minor: item?.price_minor,
          image_url: Array.isArray(item?.images) && item?.images.length > 0 ? item?.images[0] : null,
          dietary_tags: item?.item_data?.dietary_tags || [],
          allergen_tags: item?.item_data?.allergen_tags || [],
          stock_count: item?.item_data?.stock_count || null,
          availability_status: item?.availability_status,
          is_upsell_eligible: item?.is_upsell_eligible
        }))
        
      return {
        id: col.id,
        name: col.name,
        menu_items: items
      }
    })
  }

  const categories = await unstable_cache(
    fetchMenuCategories,
    [`page_collections_with_items_${page.id}`],
    { revalidate: 60, tags: [`page_collections_with_items_${page.id}`] }
  )()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allMenuItems = categories.flatMap((cat: any) => 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cat.menu_items || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      price_minor: item.price_minor,
      is_upsell_eligible: item.is_upsell_eligible
    }))
  )

  return (
    <main className="min-h-screen bg-[#f5f7f5] dark:bg-zinc-950 font-sans text-[#17201b] dark:text-zinc-100 pb-32 transition-colors" style={{ backgroundColor: page.background_color || undefined }}>
      <VenueHeader 
        location={location} 
        slug={slug} 
        tableIdentifier={tableIdentifier} 
      />

      <article className="px-6 max-w-2xl mx-auto pt-6 relative">
        {location.global_discount_enabled && location.global_discount_banner_text && (
          <GlobalDiscountBanner 
            bannerText={location.global_discount_banner_text} 
            percentage={location.global_discount_percentage || 0} 
          />
        )}
        <LiveOrderTracker customOrderMilestones={location.custom_order_milestones as CustomMilestone[] | null} />
        
        <MenuRenderer initialCategories={categories as CategoryWithItems[]} />
        
        <div className="mt-12 text-center pb-8">
          <a href="https://ourmenuos.online" className="text-xs text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors font-medium">
            Powered by OurMenu OS
          </a>
        </div>
      </article>

      <CartFAB 
        organizationId={location.organization_id} 
        locationId={location.id} 
        tableIdentifier={tableIdentifier}
        paymentIsLive={paymentIsLive}
        manualPaymentEnabled={location.manual_payment_enabled || false}
        manualPaymentBankName={location.manual_payment_bank_name || undefined}
        manualPaymentAccountName={location.manual_payment_account_name || undefined}
        manualPaymentAccountNumber={location.manual_payment_account_number || undefined}
        manualPaymentInstructions={location.manual_payment_instructions || undefined}
        globalDiscountEnabled={location.global_discount_enabled || false}
        globalDiscountPercentage={location.global_discount_percentage || 0}
        menuItems={allMenuItems}
        templateType="restaurant"
        deliveryEnabled={location.delivery_enabled}
        deliveryFeeMinor={location.delivery_fee_minor}
        deliveryMinimumOrderMinor={location.delivery_minimum_order_minor}
        deliveryNote={location.delivery_note}
        fulfillmentLocationLabel={location.fulfillment_location_label}
        refundPolicy={(location as { organizations?: { refund_policy?: string } }).organizations?.refund_policy}
        upsellMode={upsellMode}
      />
    </main>
  )
}
