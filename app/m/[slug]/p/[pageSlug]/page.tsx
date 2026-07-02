
export const revalidate = 60;
import { createClient, createAnonClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { BookingRenderer } from './templates/booking-renderer'
import { CatalogPageRenderer } from './templates/catalog-page-renderer'
import { ListingRenderer } from './templates/listing-renderer'
import { RateCardRenderer } from './templates/rate-card-renderer'
import { QuoteRenderer } from './templates/quote-renderer'
import { InfoRenderer } from './templates/info-renderer'
import { RestaurantRenderer } from './templates/restaurant-renderer'
import { PortfolioRenderer } from './templates/portfolio-renderer'
import { AIChat } from '../../ai-chat'
import { RouletteFAB } from '../../roulette-fab'
import { CallStaffFAB } from '../../call-staff-fab'
import { FabGroup } from '../../components/fab-group'
import { PortalNav } from '../../components/portal-nav'
import { unstable_cache } from 'next/cache'
import { PreviewBanner } from '@/components/preview-banner'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; pageSlug: string }>
}): Promise<Metadata> {
  const { slug, pageSlug } = await params
  
  const getCachedData = unstable_cache(async () => {
    const supabase = createAnonClient()
    const { data: loc } = await supabase
      .from('locations')
      .select('id, name, cover_image_url, is_search_visible')
      .eq('slug', slug)
      .single()
    if (!loc) return null

    const { data: page } = await supabase
      .from('location_pages')
      .select('title, content')
      .eq('location_id', loc.id)
      .eq('slug', pageSlug)
      .eq('is_published', true)
      .single()
    if (!page) return null

    return { loc, page }
  }, [`metadata_${slug}_${pageSlug}`], { revalidate: 60 })

  const data = await getCachedData()
  if (!data) return { title: 'Not Found' }
  const { loc, page } = data

  const description = page.content
    ? page.content.slice(0, 160).replace(/[#\n]/g, ' ').trim()
    : `${page.title} — ${loc.name}`

  return {
    title: `${page.title} | ${loc.name}`,
    description,
    robots: {
      index: loc.is_search_visible ?? false,
      follow: loc.is_search_visible ?? false,
    },
    openGraph: {
      title: `${page.title} | ${loc.name}`,
      description,
      images: loc.cover_image_url ? [{ url: loc.cover_image_url }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${page.title} | ${loc.name}`,
      description,
    },
  }
}

export default async function PublicPageView({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; pageSlug: string }>
  searchParams: Promise<{ qr_id?: string; ref?: string; preview?: string }>
}) {
  const { slug, pageSlug } = await params
  const { ref, preview } = await searchParams

  const supabase = await createClient()

  const fetchLocation = async () => {

    const { data } = await supabase
      .from('locations')
      .select('id, name, organization_id, is_search_visible, theme_color, cover_image_url, ai_enabled, ai_name, instagram_handle, x_handle, tiktok_handle, whatsapp_number, phone_number, organizations(logo_url), manual_payment_enabled, manual_payment_bank_name, manual_payment_account_name, manual_payment_account_number, manual_payment_instructions, delivery_enabled, delivery_fee_minor, delivery_minimum_order_minor, delivery_note, fulfillment_location_label, currency_code, portal_display_name, location_taxes(*)')
      .eq('slug', slug)
      .single()
    return data
  }
  const loc = await unstable_cache(
    fetchLocation,
    [`location_${slug}`],
    { revalidate: 60, tags: [`location_${slug}`] }
  )()

  if (!loc) notFound()

  let isPreview = false
  if (preview === 'true') {
    const { data: userData } = await supabase.auth.getUser()
    if (userData?.user) {
      const { data: member } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', loc.organization_id)
        .eq('user_id', userData.user.id)
        .single()
        
      if (member?.role === 'owner' || member?.role === 'manager') {
        isPreview = true
      } else {
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('id', loc.organization_id)
          .eq('created_by', userData.user.id)
          .single()
        if (org) isPreview = true
      }
    }
  }


  // 2. Page
  const fetchPage = async () => {
    const anonSupabase = createAnonClient()
    let query = anonSupabase
      .from('location_pages')
      .select('id, title, slug, content, template_type, billing_enabled, billing_mode, payment_mode, deposit_percentage, business_type_preset, randomizer_enabled, template_data, is_published')
      .eq('location_id', loc.id)
      .eq('slug', pageSlug)

    if (!isPreview) {
      query = query.eq('is_published', true)
    }

    const { data } = await query.single()
    return data
  }
  const page = isPreview 
    ? await fetchPage()
    : await unstable_cache(
        fetchPage,
        [`location_page_${loc.id}_${pageSlug}`],
        { revalidate: 60, tags: [`location_page_${loc.id}_${pageSlug}`] }
      )()

  if (!page) notFound()

  // 2.5 Fetch published pages count to determine if we show the PortalNav
  const fetchPublishedPagesCount = async () => {
    const anonSupabase = createAnonClient()
    let query = anonSupabase
      .from('location_pages')
      .select('*', { count: 'exact', head: true })
      .eq('location_id', loc.id)

    if (!isPreview) {
      query = query.eq('is_published', true)
    }

    const { count } = await query
    return count || 0
  }
  
  const publishedPagesCount = isPreview
    ? await fetchPublishedPagesCount()
    : await unstable_cache(
        fetchPublishedPagesCount,
        [`location_pages_count_${loc.id}`],
        { revalidate: 60, tags: [`location_pages_count_${loc.id}`] }
      )()

  // 3. Items (for catalog, booking, listing, rate_card)
  const fetchItems = async () => {
    const anonSupabase = createAnonClient()
    let query = anonSupabase
      .from('page_items')
      .select('*')
      .eq('page_id', page.id)
      .order('sort_order')

    if (!isPreview) {
      query = query.eq('is_published', true)
    }

    const { data } = await query
    return data || []
  }
  const paymentSettingsPromise = supabase
    .from('organization_payment_settings')
    .select('is_active')
    .eq('organization_id', loc.organization_id)
    .single()

  const itemsPromise = isPreview
    ? fetchItems()
    : unstable_cache(
        fetchItems,
        [`page_items_${page.id}`],
        { revalidate: 60, tags: [`page_items_${page.id}`] }
      )()

  const [items, { data: paymentSettings }] = await Promise.all([
    itemsPromise,
    paymentSettingsPromise
  ])

  const sharedProps = {
     
    location: { ...loc, cover_image_url: loc.cover_image_url ?? undefined, currency: loc.currency_code } as never,
     
    page: page as never,
     
    items: items as never[],
    locationSlug: slug,
    referralSource: ref,
    paymentIsLive: paymentSettings?.is_active ?? false,
  }

  // Route to the right renderer
  let RendererContent = null
  switch (page.template_type) {
    case 'restaurant':
      RendererContent = <RestaurantRenderer {...sharedProps} slug={slug} />
      break
    case 'booking':
      RendererContent = <BookingRenderer {...sharedProps} />
      break
    case 'catalog':
      RendererContent = <CatalogPageRenderer {...sharedProps} />
      break
    case 'listing':
      RendererContent = <ListingRenderer {...sharedProps} />
      break
    case 'rate_card':
      RendererContent = <RateCardRenderer {...sharedProps} />
      break
    case 'quote':
      RendererContent = <QuoteRenderer {...sharedProps} />
      break
    case 'portfolio':
      RendererContent = <PortfolioRenderer {...sharedProps} />
      break
    case 'info':
    case 'custom':
    default:
      RendererContent = <InfoRenderer {...sharedProps} />
      break
  }

  const ldJson = loc.is_search_visible ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${page.title} - ${loc.name}`,
    "url": `https://ourmenuos.online/m/${slug}/p/${pageSlug}`,
    "itemListElement": (items as { title: string, description?: string | null, image_url?: string | null, price_minor?: number | null }[]).map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": item.title,
        "description": item.description || undefined,
        "image": item.image_url || undefined,
        "offers": {
          "@type": "Offer",
          "price": item.price_minor ? (item.price_minor / 100).toFixed(2) : "0.00",
          "priceCurrency": loc.currency_code || "USD"
        }
      }
    }))
  } : null;

  return (
    <>
      {ldJson && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }}
        />
      )}
      {isPreview && <PreviewBanner />}
      {RendererContent}
      
      {publishedPagesCount > 1 && (
        <PortalNav slug={slug} portalName={loc.portal_display_name || loc.name} />
      )}
      
      <FabGroup>
        {loc.ai_enabled && (
          <AIChat
            locationId={loc.id}
            organizationId={loc.organization_id}
            aiName={loc.ai_name || ''}
            themeColor={loc.theme_color || '#7c3aed'}
            tableIdentifier="QR Scan" // Standard fallback for generic pages
            menuItems={((items as Record<string, unknown>[]) || []).map(i => ({ id: i.id as string, name: i.title as string, price_minor: (i.price_minor as number) || 0 }))}
            templateType={page.template_type}
            billingMode={page.billing_mode}
            businessTypePreset={page.business_type_preset}
          />
        )}
        <CallStaffFAB organizationId={loc.organization_id} locationId={loc.id} tableIdentifier="QR Scan" />
        {page.randomizer_enabled && (
          <RouletteFAB />
        )}
      </FabGroup>
    </>
  )
}
