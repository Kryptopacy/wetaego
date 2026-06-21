import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { CartFAB } from './cart-fab'
import { CallStaffFAB } from './call-staff-fab'
import { AIChat } from './ai-chat'
import { MenuRenderer } from './menu-renderer'
import { LiveOrderTracker } from './live-order-tracker'
import { RouletteFAB } from './roulette-fab'
import { SpinnerModal } from '../../components/spinner-modal'
import { PortalRenderer } from './portal-renderer'
import { EcosystemNav } from '@/components/layout/ecosystem-nav'
import { Tables } from '../../../../../types'

type CategoryWithItems = Tables<'menu_categories'> & {
  menu_items: Tables<'menu_items'>[]
}

import { VenueHeader } from './components/venue-header'
import { InvalidQrMessage, UnassignedTableMessage } from './components/qr-state-messages'
import { GlobalDiscountBanner } from './components/global-discount-banner'

// Revalidate this page every 60 seconds (Incremental Static Regeneration)
// This ensures edge caching handles high traffic seamlessly
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const supabase = await createClient()
  const { data: locationData } = await supabase.from('locations').select('id, name, cover_image_url').eq('slug', resolvedParams.slug).single()
  
  if (!locationData) return { title: 'Not Found' }
  
  const { data: locationPages } = await supabase
    .from('location_pages')
    .select('template_type')
    .eq('location_id', locationData.id)
    .eq('is_published', true)
    
  let templateName = "Menu";
  if (locationPages && locationPages.length > 0) {
     const types = locationPages.map(p => p.template_type);
     if (types.some(t => ['services', 'consulting', 'salon', 'spa'].includes(t))) {
         templateName = "Services";
     } else if (types.some(t => ['catalog', 'retail'].includes(t))) {
         templateName = "Catalog";
     }
  }

  const title = `${locationData.name} - ${templateName} | OurMenu OS`;
  const description = `View the live ${templateName.toLowerCase()} and order directly at ${locationData.name}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://ourmenuos.online/m/${resolvedParams.slug}`
    },
    openGraph: {
      title,
      description,
      type: 'website',
      images: locationData.cover_image_url ? [locationData.cover_image_url] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: locationData.cover_image_url ? [locationData.cover_image_url] : undefined,
    }
  }
}

export default async function PublicMenuPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ qr_id?: string, view?: string }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const slug = resolvedParams.slug
  const qrId = resolvedSearchParams.qr_id

  const supabase = await createClient()

  const { data: locationData } = await supabase
    .from('locations')
    .select('id, name, organization_id, ai_enabled, ai_name, theme_color, cover_image_url, operating_hours, wifi_network, wifi_password, instagram_handle, twitter_handle, facebook_handle, whatsapp_number, phone_number, google_maps_url, randomizer_enabled, spinner_enabled, spinner_config, global_discount_enabled, global_discount_banner_text, global_discount_percentage, manual_payment_enabled, manual_payment_bank_name, manual_payment_account_name, manual_payment_account_number, manual_payment_instructions, organizations(logo_url)')
    .eq('slug', slug)
    .single()

  if (!locationData) {
    notFound()
  }

  const location = locationData as any // temporary until global DB types are generated

  // 1.2 Fetch Payment Settings
  const { data: paymentSettings } = await supabase
    .from('organization_payment_settings')
    .select('is_active, provider_account_id')
    .eq('organization_id', location.organization_id)
    .single()
    
  const isPaystackLive = paymentSettings?.is_active && paymentSettings?.provider_account_id

  // 1.5 Handle Dynamic QR Routing
  let tableIdentifier = undefined

  if (qrId) {
    const { data: qrCode } = await supabase
      .from('qr_codes')
      .select('table_identifier, is_active')
      .eq('id', qrId)
      .eq('location_id', location.id)
      .single()

    if (!qrCode || !qrCode.is_active) {
      return <InvalidQrMessage />
    }

    if (!qrCode.table_identifier) {
      return <UnassignedTableMessage qrId={qrId} />
    }

    tableIdentifier = qrCode.table_identifier
  }

  // 1.8 Check location_pages for Portal mode
  const { data: locationPages } = await supabase
    .from('location_pages')
    .select('id, slug, title, template_type, is_published')
    .eq('location_id', location.id)
    .eq('is_published', true)

  const view = resolvedSearchParams.view;
  const hasPortalMode = locationPages && locationPages.length > 0;

  if (hasPortalMode && view !== 'menu') {
    return <PortalRenderer location={location} pages={locationPages} />
  }

  // 2. Find the active menu for this location
  let categories: CategoryWithItems[] = []

  const { data: menu } = await supabase
    .from('menus')
    .select('id')
    .eq('location_id', location.id)
    .single()

  if (menu) {
    // 3. Fetch categories and items
    const { data } = await supabase
      .from('menu_categories')
      .select('*, menu_items(*)')
      .eq('menu_id', menu.id)
      .order('sort_order')
    
    categories = data || []
  }

  const allMenuItems = categories.flatMap(cat => 
    (cat.menu_items || []).map(item => ({
      id: item.id,
      name: item.name,
      price_minor: item.price_minor
    }))
  )

  // Generate JSON-LD Schema dynamically based on business type
  const templateType = locationPages && locationPages.length > 0 ? locationPages[0].template_type : 'restaurant';
  let schemaType = "Restaurant";
  if (['services', 'consulting'].includes(templateType)) schemaType = "ProfessionalService";
  if (['salon', 'spa'].includes(templateType)) schemaType = "HealthAndBeautyBusiness";
  if (['catalog', 'retail'].includes(templateType)) schemaType = "LocalBusiness";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "name": location.name,
    "image": location.cover_image_url || undefined,
    "logo": location.organizations?.logo_url || undefined,
    "telephone": location.phone_number || location.whatsapp_number || undefined,
    "url": `https://ourmenuos.online/m/${slug}`,
    "hasMenu": {
      "@type": "Menu",
      "hasMenuSection": categories.map(cat => ({
        "@type": "MenuSection",
        "name": cat.name,
        "hasMenuItem": (cat.menu_items || []).map(item => ({
          "@type": "MenuItem",
          "name": item.name,
          "description": item.description,
          "image": item.image_url || undefined,
          "offers": {
            "@type": "Offer",
            "price": item.price_minor / 100,
            "priceCurrency": "NGN"
          }
        }))
      }))
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-[#f5f7f5] dark:bg-zinc-950 font-sans text-[#17201b] dark:text-zinc-100 pb-32 transition-colors">
        {/* Elevated Cover Image Hero Section */}
        <VenueHeader 
          location={location} 
          slug={slug} 
          tableIdentifier={tableIdentifier} 
        />

        <article className="px-6 max-w-2xl mx-auto pt-6 relative">
          {location.global_discount_enabled && location.global_discount_banner_text && (
            <GlobalDiscountBanner 
              bannerText={location.global_discount_banner_text} 
              percentage={location.global_discount_percentage} 
            />
          )}
          <LiveOrderTracker organizationId={location.organization_id} locationId={location.id} />
          {/* Categories */}
          <MenuRenderer initialCategories={categories} />
          
          <div className="mt-12 text-center pb-8">
            <a href="https://ourmenuos.online" className="text-xs text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors font-medium">
              Powered by OurMenu OS
            </a>
          </div>
        </article>

        {/* Floating Actions */}
        <CallStaffFAB organizationId={location.organization_id} locationId={location.id} tableIdentifier={tableIdentifier} />
        {location.randomizer_enabled && <RouletteFAB />}
        {location.spinner_enabled && location.spinner_config && (
          <SpinnerModal locationId={location.id} config={location.spinner_config as any} />
        )}
        <EcosystemNav locationId={location.id} slug={slug} currentPath="menu" />
        <CartFAB 
          organizationId={location.organization_id} 
          locationId={location.id} 
          tableIdentifier={tableIdentifier}
          paymentIsLive={!!isPaystackLive}
          manualPaymentEnabled={location.manual_payment_enabled}
          manualPaymentBankName={location.manual_payment_bank_name}
          manualPaymentAccountName={location.manual_payment_account_name}
          manualPaymentAccountNumber={location.manual_payment_account_number}
          manualPaymentInstructions={location.manual_payment_instructions}
          globalDiscountEnabled={location.global_discount_enabled}
          globalDiscountPercentage={location.global_discount_percentage}
          menuItems={allMenuItems}
          templateType="catalog"
        />
        {location.ai_enabled && (
          <AIChat 
            locationId={location.id}
            organizationId={location.organization_id}
            aiName={location.ai_name}
            themeColor={location.theme_color}
            tableIdentifier={tableIdentifier || ''}
            menuItems={allMenuItems}
          />
        )}
      </main>
    </>
  )
}



