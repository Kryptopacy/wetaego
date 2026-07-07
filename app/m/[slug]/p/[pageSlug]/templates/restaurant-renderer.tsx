import { createAnonClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import { MenuRenderer } from '../../../menu-renderer'
import { LiveOrderTracker } from '../../../live-order-tracker'
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
}: {
  location: Location
  slug: string
  tableIdentifier?: string
  paymentIsLive: boolean
  page: any
}) {
  const fetchMenuCategories = async () => {
    const anonSupabase = createAnonClient()
    const { data: menuData } = await anonSupabase
      .from('menus')
      .select('id')
      .eq('location_id', location.id)
      .single()

    if (!menuData) return []

    const { data } = await anonSupabase
      .from('menu_categories')
      .select('*, menu_items(*)')
      .eq('menu_id', menuData.id)
      .order('sort_order')
    
    return data || []
  }

  const categories = await unstable_cache(
    fetchMenuCategories,
    [`menu_categories_${location.id}`],
    { revalidate: 60, tags: [`menu_categories_${location.id}`] }
  )()

  
  type Category = Database['public']['Tables']['menu_categories']['Row'] & {
    menu_items: Database['public']['Tables']['menu_items']['Row'][]
  }

  const allMenuItems = categories.flatMap((cat: Category) => 
    
    (cat.menu_items || []).map((item: Database['public']['Tables']['menu_items']['Row']) => ({
      id: item.id,
      name: item.name,
      price_minor: item.price_minor
    }))
  )

  return (
    <main className="min-h-screen bg-[#f5f7f5] dark:bg-zinc-950 font-sans text-[#17201b] dark:text-zinc-100 pb-32 transition-colors" style={{ backgroundColor: (page as any).background_color || undefined }}>
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
        <LiveOrderTracker />
        
        <MenuRenderer initialCategories={categories} />
        
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
        refundPolicy={(location as any).organizations?.refund_policy}
      />
    </main>
  )
}
