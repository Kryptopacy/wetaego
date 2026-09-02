import { createClient, createAnonClient, createAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import { cookies } from 'next/headers'

import { PortalRenderer } from './portal-renderer'
import { InvalidQrMessage } from './components/qr-state-messages'
import { PreviewBanner } from '@/components/preview-banner'
import { WebMCPProvider } from '@/components/webmcp/webmcp-provider'
import { unstable_cache } from 'next/cache'
import { ensureFlagshipDemoLocation } from '@/lib/demo/ensure-flagship-demo'
import { AIChat } from './ai-chat'

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  if (resolvedParams.slug === 'demo') {
    await ensureFlagshipDemoLocation()
  }

  const getCachedMetadata = unstable_cache(async () => {
    const supabase = resolvedParams.slug === 'demo' ? await createAdminClient() : createAnonClient()
    const { data: locationData } = await supabase.from('locations').select('id, name, portal_display_name, cover_image_url, is_search_visible').eq('slug', resolvedParams.slug).single()
    if (!locationData) return null

    const { data: locationPages } = await supabase
      .from('location_pages')
      .select('template_type')
      .eq('location_id', locationData.id)
      .eq('is_published', true)

    let templateName = "Portal"
    if (locationPages && locationPages.length > 0) {
       const types = locationPages.map(p => p.template_type)
       if (types.some(t => ['services', 'consulting', 'salon', 'spa'].includes(t))) {
           templateName = "Services"
       } else if (types.some(t => ['catalog', 'retail'].includes(t))) {
           templateName = "Catalog"
       }
    }
    return { locationData, templateName }
  }, [`metadata_${resolvedParams.slug}`], { tags: [`location_data_${resolvedParams.slug}`], revalidate: 60 })

  const metadata = await getCachedMetadata()
  if (!metadata) return { title: 'Not Found' }
  const { locationData, templateName } = metadata

  const displayName = locationData.portal_display_name || locationData.name;
  const title = `${displayName} - ${templateName} | WETAEGO`;
  const description = `Explore the official digital showcase and interactive services at ${displayName} on WETAEGO.`;

  return {
    title,
    description,
    robots: {
      index: locationData.is_search_visible ?? false,
      follow: locationData.is_search_visible ?? false,
    },
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
  searchParams: Promise<{ qr_id?: string, view?: string, preview?: string, resource?: string }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const slug = resolvedParams.slug
  const qrId = resolvedSearchParams.qr_id
  const preview = resolvedSearchParams.preview
  const resource = resolvedSearchParams.resource

  const supabase = await createClient()
  const cookieStore = await cookies()
  const isDemoMode = cookieStore.get('demo_mode')?.value === '1'

  const locationFetcher = async () => {
    const anonSupabase = createAnonClient()
    let { data } = await anonSupabase
      .from('locations')
      .select('id, slug, name, portal_display_name, organization_id, is_search_visible, ai_enabled, ai_name, theme_color, cover_image_url, operating_hours, wifi_network, wifi_password, instagram_handle, twitter_handle, facebook_handle, whatsapp_number, phone_number, google_maps_url, randomizer_enabled, spinner_enabled, spinner_config, global_discount_enabled, global_discount_banner_text, global_discount_percentage, manual_payment_enabled, manual_payment_bank_name, manual_payment_account_name, manual_payment_account_number, manual_payment_instructions, delivery_enabled, delivery_fee_minor, delivery_minimum_order_minor, delivery_note, fulfillment_location_label, currency_code, publication_status, organizations(logo_url, name, status, portal_name, portal_cover_image_url, portal_theme_color, portal_background_color), location_taxes(id, name, percentage, is_active)')
      .eq('slug', slug)
      .single()

    if (slug === 'demo') {
      await ensureFlagshipDemoLocation()
      const adminClient = await createAdminClient()
      const { data: adminData } = await adminClient
        .from('locations')
        .select('id, slug, name, portal_display_name, organization_id, is_search_visible, ai_enabled, ai_name, theme_color, cover_image_url, operating_hours, wifi_network, wifi_password, instagram_handle, twitter_handle, facebook_handle, whatsapp_number, phone_number, google_maps_url, randomizer_enabled, spinner_enabled, spinner_config, global_discount_enabled, global_discount_banner_text, global_discount_percentage, manual_payment_enabled, manual_payment_bank_name, manual_payment_account_name, manual_payment_account_number, manual_payment_instructions, delivery_enabled, delivery_fee_minor, delivery_minimum_order_minor, delivery_note, fulfillment_location_label, currency_code, publication_status, organizations(logo_url, name, status, portal_name, portal_cover_image_url, portal_theme_color, portal_background_color), location_taxes(id, name, percentage, is_active)')
        .eq('slug', 'demo')
        .single()
      return adminData
    }

    if (!data) {
      const adminClient = await createAdminClient()
      const { data: adminData } = await adminClient
        .from('locations')
        .select('id, slug, name, portal_display_name, organization_id, is_search_visible, ai_enabled, ai_name, theme_color, cover_image_url, operating_hours, wifi_network, wifi_password, instagram_handle, twitter_handle, facebook_handle, whatsapp_number, phone_number, google_maps_url, randomizer_enabled, spinner_enabled, spinner_config, global_discount_enabled, global_discount_banner_text, global_discount_percentage, manual_payment_enabled, manual_payment_bank_name, manual_payment_account_name, manual_payment_account_number, manual_payment_instructions, delivery_enabled, delivery_fee_minor, delivery_minimum_order_minor, delivery_note, fulfillment_location_label, currency_code, publication_status, organizations(logo_url, name, status, portal_name, portal_cover_image_url, portal_theme_color, portal_background_color), location_taxes(id, name, percentage, is_active)')
        .eq('slug', slug)
        .single()
      data = adminData
    }
    return data;
  }

  const locationData = preview === 'true' || isDemoMode || slug === 'demo'
    ? await locationFetcher()
    : await unstable_cache(
        locationFetcher,
        [`location_${slug}`],
        { revalidate: 60, tags: [`location_${slug}`] }
      )();

  if (!locationData) {
    notFound()
  }

  const location = locationData;

  // Demo mode acts like preview — bypasses KYC and shows all pages
  let isPreview = isDemoMode || slug === 'demo'
  if (!isPreview && preview === 'true') {
    const { data: userData } = await supabase.auth.getUser()
    if (userData?.user) {
      const { data: member } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', location.organization_id)
        .eq('user_id', userData.user.id)
        .single()
        
      if (member?.role === 'owner' || member?.role === 'manager') {
        isPreview = true
      } else {
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('id', location.organization_id)
          .eq('created_by', userData.user.id).limit(1).maybeSingle()
        if (org) isPreview = true
      }
    }
  }

  const showPreviewBanner = preview === 'true' && slug !== 'demo' && !isDemoMode

  // Check publication and KYC status — preview & demo mode bypass this
  const isPublished = (location as any).publication_status === 'published'
  if (!isPreview && !isDemoMode && slug !== 'demo' && !isPublished) {
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
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            We&apos;re putting the final touches on our digital offerings. Check back shortly to explore what we have to offer.
          </p>
        </div>
      </main>
    )
  }

  const org = location.organizations as { status?: string } | null;
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

  // Fetch secondary data in parallel
  const adminSupabase = await createAdminClient()
  const paymentSettingsPromise = adminSupabase
    .from('organization_payment_settings')
    .select('is_active, provider_account_id')
    .eq('organization_id', location.organization_id)
    .single()

  const qrCodePromise = qrId ? adminSupabase
    .from('qr_codes')
    .select('table_identifier, destination_path, is_active')
    .eq('id', qrId)
    .eq('location_id', location.id)
    .single() : Promise.resolve(null)

  const fetchLocationPages = async () => {
    const supabaseClient = slug === 'demo' ? await createAdminClient() : createAnonClient()
    let query = supabaseClient
      .from('location_pages')
      .select('id, slug, title, template_type, is_published')
      .eq('location_id', location.id)
      .order('created_at', { ascending: true })

    if (!isPreview) {
      query = query.eq('is_published', true)
    }

    const { data } = await query
    return data
  }

  const locationPagesPromise = isPreview || slug === 'demo'
    ? fetchLocationPages()
    : unstable_cache(
        fetchLocationPages,
        [`location_pages_${location.id}`],
        { revalidate: 60, tags: [`location_pages_${location.id}`] }
      )()

  const [
    { data: _paymentSettings },
    qrCodeResult,
    locationPages
  ] = await Promise.all([
    paymentSettingsPromise,
    qrCodePromise,
    locationPagesPromise
  ])

  const qrCode = qrCodeResult?.data

  // Handle Dynamic QR Routing
  if (qrId) {
    if (!qrCode || !qrCode.is_active) {
      return <InvalidQrMessage />
    }

    // If the QR code has a specific destination page, redirect directly to it
    const rootPath = `/m/${slug}`
    if (qrCode.destination_path && qrCode.destination_path !== rootPath) {
      const destWithQr = `${qrCode.destination_path}?qr_id=${qrId}`
      redirect(destWithQr)
    }
  }

  let activePages = locationPages || []
  if (activePages.length === 0 && slug === 'demo') {
    await ensureFlagshipDemoLocation()
    const adminClient = await createAdminClient()
    const { data: seededPages } = await adminClient
      .from('location_pages')
      .select('*')
      .eq('location_id', location.id)
      .eq('is_published', true)
      .order('created_at', { ascending: true })
    if (seededPages && seededPages.length > 0) {
      activePages = seededPages
    }
  }

  const pageCount = activePages.length
  // ── Routing Decision Tree ───────────────────────────────────────────────────
  // 1 page  → redirect directly to it (e.g. a phone store with only one catalog)
  // >1 pages → render the Portal (becomes the business's branded landing page)
  // 0 pages → render empty state
  // ────────────────────────────────────────────────────────────────────────────

  if (pageCount === 1 && activePages) {
    const singlePage = activePages[0]
    let destination = `/m/${slug}/p/${singlePage.slug}?`
    if (qrId) destination += `qr_id=${qrId}&`
    if (resource) destination += `resource=${resource}&`
    redirect(destination.replace(/[\?&]$/, ''))
  }

  if (pageCount > 1 && activePages) {
    const ldJson = location.is_search_visible ? {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": location.name,
      "image": location.cover_image_url || undefined,
      "telephone": location.phone_number || undefined,
      "url": `https://ourmenuos.online/m/${slug}`,
      "openingHours": location.operating_hours || undefined
    } : null;

    // Fetch all items across all active pages of this portal location
    const activePageIds = activePages.map(p => p.id)
    const adminSupabase = await createAdminClient()
    const { data: allPortalItems } = await adminSupabase
      .from('page_items')
      .select('id, title, description, price_minor, department, images, item_data, is_published, availability_status, page_id')
      .in('page_id', activePageIds)
      .eq('is_published', true)

    const pageLookup = new Map<string, { slug: string; title: string }>()
    activePages.forEach(p => pageLookup.set(p.id, { slug: p.slug, title: p.title }))

    const portalMenuItems = (allPortalItems || []).map(it => {
      const pageInfo = it.page_id ? pageLookup.get(it.page_id) : undefined
      const itemData = (it.item_data as Record<string, unknown>) || {}
      return {
        id: it.id,
        name: it.title,
        description: it.description,
        price_minor: it.price_minor || 0,
        category: it.department || 'General',
        image_url: it.images && it.images.length > 0 ? it.images[0] : null,
        dietary_tags: (itemData.dietary_tags as string[]) || [],
        variants: (itemData.variants as any) || [],
        modifiers: (itemData.modifiers as any) || [],
        is_available: it.availability_status !== 'sold_out',
        conceptSlug: pageInfo?.slug || null,
        conceptTitle: pageInfo?.title || null
      }
    })

    return (
      <>
        {ldJson && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }}
          />
        )}
        {showPreviewBanner && <PreviewBanner />}
        <PortalRenderer location={location as unknown as Parameters<typeof PortalRenderer>[0]['location']} pages={activePages} />
        {location.ai_enabled && (
          <AIChat
            locationId={location.id}
            organizationId={location.organization_id}
            aiName={location.ai_name || 'Pacy Concierge'}
            businessName={location.portal_display_name || location.name}
            themeColor={location.theme_color || '#0f7b55'}
            tableIdentifier="Portal Visitor"
            menuItems={portalMenuItems}
          />
        )}
        <WebMCPProvider
          locationId={location.id}
          locationName={location.portal_display_name || location.name}
          slug={slug}
          currency={location.currency_code || 'NGN'}
          menuItems={portalMenuItems}
          categories={activePages.map(p => p.title)}
          tableIdentifier="Portal Visitor"
          taxes={(location as any).location_taxes || []}
        />
      </>
    )
  }

  // 0 pages → Empty State
  return (
    <main className="min-h-screen bg-[#f5f7f5] dark:bg-zinc-950 font-sans flex flex-col items-center justify-center p-6 text-center">
      {showPreviewBanner && <PreviewBanner />}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl p-10 max-w-md w-full shadow-2xl border border-black/5 dark:border-white/10">
        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-2xl mx-auto flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#17201b] dark:text-white mb-3">
          {location.organizations?.portal_name || location.portal_display_name || location.organizations?.name || location.name}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          We're getting our space ready. Check back soon!
        </p>
      </div>
      <div className="mt-12 text-center">
        <a href="https://ourmenuos.online" className="text-xs text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors font-medium">
          Powered by WETAEGO
        </a>
      </div>
    </main>
  )
}
