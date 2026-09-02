export const dynamic = 'force-dynamic';
import { createClient, createAnonClient, createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { cookies } from 'next/headers'
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
import { FabGroup } from '../../components/fab-group'
import { PortalNav } from '../../components/portal-nav'
import { unstable_cache } from 'next/cache'
import { PreviewBanner } from '@/components/preview-banner'
import { getGlobalManualPayment } from '@/lib/utils/settings'
import { DealsFAB } from '../../components/deals-fab'
import { PageThemeOverride } from './page-theme-override'
import { WebMCPProvider } from '@/components/webmcp/webmcp-provider'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; pageSlug: string }>
}): Promise<Metadata> {
  const { slug, pageSlug } = await params
  if (slug === 'demo') {
    const { ensureFlagshipDemoLocation } = await import('@/lib/demo/ensure-flagship-demo')
    await ensureFlagshipDemoLocation()
  }
  
  const fetchMetadata = async () => {
    const supabase = slug === 'demo' ? await createAdminClient() : createAnonClient()
    const { data: loc } = await supabase
      .from('locations')
      .select('id, name, portal_display_name, cover_image_url, is_search_visible')
      .eq('slug', slug)
      .single()
    if (!loc) return null

    const { data: page } = await supabase
      .from('location_pages')
      .select('title, content')
      .eq('location_id', loc.id)
      .eq('slug', pageSlug)
      .maybeSingle()
    if (!page) return null

    return { loc, page }
  }

  const data = slug === 'demo'
    ? await fetchMetadata()
    : await unstable_cache(fetchMetadata, [`metadata_${slug}_${pageSlug}`], { revalidate: 60 })()

  if (!data) return { title: 'Pacy Group | WETAEGO' }
  const { loc, page } = data

  const description = page.content
    ? page.content.slice(0, 160).replace(/[#\n]/g, ' ').trim()
    : `${page.title} — ${loc.name}`

  return {
    title: `${page.title} | ${loc.name}`,
    description,
    alternates: {
      canonical: `https://ourmenuos.online/m/${slug}/p/${pageSlug}`
    },
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
  searchParams: Promise<{ qr_id?: string; ref?: string; preview?: string; resource?: string; table?: string; t?: string }>
}) {
  const { slug, pageSlug } = await params
  const { ref, preview, resource: resourceId, qr_id: qrId, table: queryTable, t: queryShortTable } = await searchParams

  const supabase = await createClient()
  const cookieStore = await cookies()
  const isDemoMode = cookieStore.get('demo_mode')?.value === '1'

  const fetchLocation = async () => {
    if (slug === 'demo') {
      const { ensureFlagshipDemoLocation } = await import('@/lib/demo/ensure-flagship-demo')
      await ensureFlagshipDemoLocation()
      const adminClient = await createAdminClient()
      const { data: adminData } = await adminClient
        .from('locations')
        .select('id, name, organization_id, is_search_visible, theme_color, cover_image_url, ai_enabled, ai_name, instagram_handle, x_handle, tiktok_handle, facebook_handle, whatsapp_number, phone_number, google_maps_url, operating_hours, wifi_network, wifi_password, organizations(logo_url, status, refund_policy, subscription_plan), manual_payment_enabled, manual_payment_bank_name, manual_payment_account_name, manual_payment_account_number, manual_payment_instructions, delivery_enabled, delivery_fee_minor, delivery_minimum_order_minor, delivery_note, fulfillment_location_label, currency_code, portal_display_name, location_taxes(*)')
        .eq('slug', 'demo')
        .single()
      return adminData
    }

    const anonSupabase = createAnonClient()
    let { data } = await anonSupabase
      .from('locations')
      .select('id, name, organization_id, is_search_visible, theme_color, cover_image_url, ai_enabled, ai_name, instagram_handle, x_handle, tiktok_handle, facebook_handle, whatsapp_number, phone_number, google_maps_url, operating_hours, wifi_network, wifi_password, organizations(logo_url, status, refund_policy, subscription_plan), manual_payment_enabled, manual_payment_bank_name, manual_payment_account_name, manual_payment_account_number, manual_payment_instructions, delivery_enabled, delivery_fee_minor, delivery_minimum_order_minor, delivery_note, fulfillment_location_label, currency_code, portal_display_name, location_taxes(*)')
      .eq('slug', slug)
      .single()

    if (!data) {
      const adminClient = await createAdminClient()
      const { data: adminData } = await adminClient
        .from('locations')
        .select('id, name, organization_id, is_search_visible, theme_color, cover_image_url, ai_enabled, ai_name, instagram_handle, x_handle, tiktok_handle, facebook_handle, whatsapp_number, phone_number, google_maps_url, operating_hours, wifi_network, wifi_password, organizations(logo_url, status, refund_policy, subscription_plan), manual_payment_enabled, manual_payment_bank_name, manual_payment_account_name, manual_payment_account_number, manual_payment_instructions, delivery_enabled, delivery_fee_minor, delivery_minimum_order_minor, delivery_note, fulfillment_location_label, currency_code, portal_display_name, location_taxes(*)')
        .eq('slug', slug)
        .single()
      data = adminData
    }
    return data
  }
  const loc = preview === 'true' || isDemoMode || slug === 'demo'
    ? await fetchLocation()
    : await unstable_cache(
        fetchLocation,
        [`location_${slug}`],
        { revalidate: 60, tags: [`location_${slug}`] }
      )()

  if (!loc) notFound()

  // Demo mode acts like preview — bypasses KYC and shows unpublished pages
  let isPreview = isDemoMode || slug === 'demo'
  if (!isPreview && preview === 'true') {
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
          .eq('created_by', userData.user.id).limit(1).maybeSingle()
        if (org) isPreview = true
      }
    }
  }

  const showPreviewBanner = preview === 'true' && slug !== 'demo' && !isDemoMode

  // Check KYC status — demo mode always bypasses this
  const org = loc.organizations as { status?: string } | null | undefined;
  const orgStatus = org?.status || 'approved';
  
  if (!isPreview && !isDemoMode && slug !== 'demo' && orgStatus !== 'approved') {
    const { getKycSettings } = await import('@/lib/utils/settings')
    const kycSettings = await getKycSettings() as { require_kyc_to_publish?: boolean }
    if (kycSettings?.require_kyc_to_publish) {
      return (
        <main className="min-h-screen bg-[#f5f7f5] dark:bg-zinc-950 font-sans flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl p-10 max-w-md w-full shadow-2xl border border-black/5 dark:border-white/10">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl mx-auto flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#17201b] dark:text-white mb-3">
              Setting up shop!
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              We're putting the final touches on our digital menu. Check back shortly to explore what we have to offer.
            </p>
          </div>
        </main>
      )
    }
  }

  // 2. Page
  const fetchPage = async () => {
    if (slug === 'demo') {
      const adminClient = await createAdminClient()
      const { data: adminRawData } = await adminClient
        .from('location_pages')
        .select('id, title, slug, content, template_type, billing_enabled, billing_mode, payment_mode, deposit_percentage, business_type_preset, randomizer_enabled, deals_enabled, template_data, is_published, theme_color, background_color, operating_hours, contact_email, contact_phone, wifi_network, wifi_password, address, upsell_mode, design_tokens, ai_enabled, ai_name, ai_base_personality')
        .eq('location_id', loc.id)
        .eq('slug', pageSlug)
        .maybeSingle()
      return adminRawData as Record<string, unknown>
    }

    const anonSupabase = createAnonClient()
    let query = anonSupabase
      .from('location_pages')
      .select('id, title, slug, content, template_type, billing_enabled, billing_mode, payment_mode, deposit_percentage, business_type_preset, randomizer_enabled, deals_enabled, template_data, is_published, theme_color, background_color, operating_hours, contact_email, contact_phone, wifi_network, wifi_password, address, upsell_mode, design_tokens, ai_enabled, ai_name, ai_base_personality')
      .eq('location_id', loc.id)
      .eq('slug', pageSlug)

    if (!isPreview) {
      query = query.eq('is_published', true)
    }

    const { data: rawData } = await query.single()
    return rawData as Record<string, unknown>
  }
  const page = isPreview 
    ? await fetchPage()
    : await unstable_cache(
        fetchPage,
        [`location_page_${loc.id}_${pageSlug}`],
        { revalidate: 60, tags: [`location_page_${loc.id}_${pageSlug}`] }
      )()

  if (!page) notFound()

  // 2.2 Template Feature Flag Guard
  const { getTemplateFlags, getInfrastructureFlags } = await import('@/lib/utils/settings')
  const templateFlags = await getTemplateFlags() as Record<string, boolean>
  if (templateFlags[page.template_type as string] === false) {
    const { data: { user } } = await supabase.auth.getUser()
    const { isAdminEmail } = await import('@/lib/utils/admin')
    const isSuperadmin = isAdminEmail(user?.email)
    
    if (!isSuperadmin) {
      return (
        <main className="min-h-screen bg-[#f5f7f5] dark:bg-zinc-950 font-sans flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl p-10 max-w-md w-full shadow-2xl border border-black/5 dark:border-white/10">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl mx-auto flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#17201b] dark:text-white mb-3">
              Template Maintenance
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              The layout engine powering this page is currently undergoing upgrades. Please check back shortly.
            </p>
          </div>
        </main>
      )
    }
  }

  // 2.5 Fetch published pages count to determine if we show the PortalNav
  const fetchPublishedPagesCount = async () => {
    const anonSupabase = slug === 'demo' ? await createAdminClient() : createAnonClient()
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
    const anonSupabase = slug === 'demo' ? await createAdminClient() : createAnonClient()
    let query = anonSupabase
      .from('page_items')
      .select('*')
      .eq('page_id', page.id as string)
      .order('sort_order')

    if (!isPreview) {
      query = query.eq('is_published', true)
    }

    const { data } = await query
    return data || []
  }
  const adminSupabase = await createAdminClient()
  const paymentSettingsPromise = adminSupabase
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

  const fetchAds = async () => {
    const { getAdsNetworkSettings } = await import('@/lib/utils/settings')
    const adsNetwork = await getAdsNetworkSettings()
    
    const subPlan = (loc.organizations as { subscription_plan?: string })?.subscription_plan || 'lite'
    const isPro = ['pro', 'enterprise'].includes(subPlan)
    
    if (isPro && !adsNetwork.enable_byo_ads) return []
    if (!isPro && !adsNetwork.enable_platform_ads) return []

    const anonSupabase = createAnonClient()
    let query = anonSupabase
      .from('sponsored_ads' as never)
      .select('id, title, category, image_url, target_link')
      .eq('is_active', true)
      .eq('approval_status', 'approved')
      
    if (isPro) {
      query = query.eq('location_id', loc.id)
    } else {
      query = query.eq('is_platform_ad', true)
    }
    
    const { data } = await query.limit(5)
    return data || []
  }

  const adsPromise = unstable_cache(
    fetchAds,
    [`sponsored_ads_${loc.id}`],
    { revalidate: 300, tags: [`sponsored_ads_${loc.id}`] }
  )()

  // Fetch active deals for this location (if page has deals enabled)
  const dealsPromise = (page.deals_enabled !== false) ? (async () => {
    const anonSupabase = createAnonClient()
    const now = new Date().toISOString()
    const { data } = await anonSupabase
      .from('deals')
      .select(`
        id, name, description, type,
        deal_items (
          id, deal_price_minor, quantity_limit, quantity_sold,
          menu_items ( id, name, price_minor, image_url, description )
        )
      `)
      .eq('location_id', loc.id)
      .eq('is_active', true)
      .or(`type.eq.manual,and(type.eq.time_based,start_time.lte.${now},end_time.gte.${now}),type.eq.quantity_based`)
    return (data || []).filter((d: { type: string; deal_items: { quantity_limit: number | null; quantity_sold: number }[] }) =>
      // For quantity_based: only show if at least one item has remaining stock
      d.type !== 'quantity_based' ||
      d.deal_items.some((di) => di.quantity_limit === null || di.quantity_sold < di.quantity_limit)
    )
  })() : Promise.resolve([])

  const qrCodePromise = qrId ? adminSupabase
    .from('qr_codes')
    .select('table_identifier, is_active')
    .eq('id', qrId)
    .eq('location_id', loc.id)
    .maybeSingle() : Promise.resolve(null)

  const [items, { data: paymentSettings }, globalManualPayment, _resource, qrCodeResult, activeDeals, sponsoredAds] = await Promise.all([
    itemsPromise,
    paymentSettingsPromise,
    getGlobalManualPayment(),
    resourceId ? adminSupabase.from('resources').select('id, name, type').eq('id', resourceId).single().then(r => r.data) : Promise.resolve(null),
    qrCodePromise,
    dealsPromise,
    adsPromise
  ])

  const resolvedTableIdentifier = (_resource as { name?: string })?.name || 
    qrCodeResult?.data?.table_identifier || 
    queryTable || 
    queryShortTable || 
    undefined

  const pageThemeColor = page.theme_color || loc.theme_color || '#10b981'
  
  // Resource already checked earlier

  const infraFlags = await getInfrastructureFlags() as Record<string, boolean>

  const sharedProps = {
    location: { 
      ...loc, 
      cover_image_url: loc.cover_image_url ?? undefined, 
      currency: loc.currency_code, 
      theme_color: pageThemeColor,
      operating_hours: page.operating_hours !== null && page.operating_hours !== undefined ? (typeof page.operating_hours === 'string' ? page.operating_hours : (page.operating_hours as unknown)) : loc.operating_hours,
      wifi_network: page.wifi_network || loc.wifi_network,
      wifi_password: page.wifi_password || loc.wifi_password,
      phone_number: page.contact_phone || loc.phone_number,
      address: page.address || undefined
    } as never,
    page: page as never,
     
    items: items as never[],
    sponsoredAds,
    locationSlug: slug,
    referralSource: ref,
    resourceId: resourceId || undefined,
    tableIdentifier: resolvedTableIdentifier,
    paymentIsLive: paymentSettings?.is_active ?? false,
    globalManualPaymentOverride: (globalManualPayment as { global_manual_payment_override?: boolean })?.global_manual_payment_override === true,
    mapsIntegrationEnabled: infraFlags.maps_integration_enabled !== false,
    upsellMode: (page.upsell_mode as string) || 'auto',
  }

  // Route to the right renderer
  let RendererContent = null
  switch (page.template_type) {
    case 'restaurant':
      RendererContent = <RestaurantRenderer {...sharedProps} slug={slug} tableIdentifier={resolvedTableIdentifier} />
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
    "name": `${page.title} - ${loc.portal_display_name || loc.name}`,
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
      {showPreviewBanner && <PreviewBanner />}
      <PageThemeOverride pageTokens={page.design_tokens as any || undefined} />
      {RendererContent}
      
      {publishedPagesCount > 1 && (
        <PortalNav slug={slug} portalName={loc.portal_display_name || loc.name} />
      )}
      
      <WebMCPProvider
        locationId={loc.id}
        locationName={loc.portal_display_name || loc.name}
        slug={slug}
        currency={loc.currency_code || 'USD'}
        businessTypePreset={page.business_type_preset as string}
        templateType={page.template_type as string}
        menuItems={((items as Record<string, any>[]) || []).map(i => ({
          id: String(i.id),
          name: String(i.title || i.name || 'Item'),
          description: (i.description as string) || null,
          price_minor: Number(i.price_minor || 0),
          category: (i.category_name || (i.category as any)?.name || (page as any)?.title || 'General') as string,
          image_url: (i.image_url as string) || null,
          dietary_tags: (i.dietary_tags as string[]) || (i.tags as string[]) || (i.item_data as any)?.dietary_tags || [],
          variants: (i.variants as any) || (i.item_data as any)?.variants || [],
          modifiers: (i.modifiers as any) || (i.item_data as any)?.modifiers || [],
          is_available: i.availability_status !== 'sold_out' && i.is_available !== false
        }))}
        tableIdentifier={_resource?.name || "Storefront Guest"}
        taxes={(loc as any).location_taxes || []}
      />

      <FabGroup>
        {(page.ai_enabled === true || loc.ai_enabled === true || slug === 'demo' || (page.ai_enabled !== false && loc.ai_enabled !== false)) && (
          <AIChat
            locationId={loc.id}
            organizationId={loc.organization_id}
            aiName={(page.ai_name as string) || loc.ai_name || 'Concierge'}
            businessName={loc.portal_display_name || loc.name}
            themeColor={(page.theme_color as string) || loc.theme_color || '#10b981'}
            tableIdentifier={_resource?.name || "Online Storefront"}
            menuItems={((items as Record<string, unknown>[]) || []).map(i => ({ id: i.id as string, name: i.title as string, price_minor: (i.price_minor as number) || 0 }))}
            templateType={page.template_type as string}
            billingMode={page.billing_mode as string}
            businessTypePreset={page.business_type_preset as string}
          />
        )}
        {Boolean(page.randomizer_enabled) && (
          <RouletteFAB />
        )}
        {(activeDeals as unknown[]).length > 0 && (
          <DealsFAB deals={activeDeals as Parameters<typeof DealsFAB>[0]['deals']} locationId={loc.id} pageId={page.id as string} />
        )}
      </FabGroup>
    </>
  )
}
