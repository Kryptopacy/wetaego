import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'

import { PortalRenderer } from './portal-renderer'
import { InvalidQrMessage } from './components/qr-state-messages'
import { PreviewBanner } from '@/components/preview-banner'
import { unstable_cache } from 'next/cache'

// Revalidate this page every 60 seconds (Incremental Static Regeneration)
// This ensures edge caching handles high traffic seamlessly
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const getCachedMetadata = unstable_cache(async () => {
    const supabase = await createClient()
    const { data: locationData } = await supabase.from('locations').select('id, name, cover_image_url, is_search_visible').eq('slug', resolvedParams.slug).single()
    if (!locationData) return null

    const { data: locationPages } = await supabase
      .from('location_pages')
      .select('template_type')
      .eq('location_id', locationData.id)
      .eq('is_published', true)

    let templateName = "Menu"
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

  const title = `${locationData.name} - ${templateName} | OurMenu OS`;
  const description = `View the live ${templateName.toLowerCase()} and order directly at ${locationData.name}.`;

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
  searchParams: Promise<{ qr_id?: string, view?: string, preview?: string }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const slug = resolvedParams.slug
  const qrId = resolvedSearchParams.qr_id
  const preview = resolvedSearchParams.preview

  const supabase = await createClient()

  const locationFetcher = async () => {
    const { data } = await supabase
      .from('locations')
      .select('id, name, organization_id, is_search_visible, ai_enabled, ai_name, theme_color, cover_image_url, operating_hours, wifi_network, wifi_password, instagram_handle, twitter_handle, facebook_handle, whatsapp_number, phone_number, google_maps_url, randomizer_enabled, spinner_enabled, spinner_config, global_discount_enabled, global_discount_banner_text, global_discount_percentage, manual_payment_enabled, manual_payment_bank_name, manual_payment_account_name, manual_payment_account_number, manual_payment_instructions, delivery_enabled, delivery_fee_minor, delivery_minimum_order_minor, delivery_note, fulfillment_location_label, organizations(logo_url)')
      .eq('slug', slug)
      .single()
    return data;
  }

  const locationData = await unstable_cache(
    locationFetcher,
    [`location_${slug}`],
    { revalidate: 60, tags: [`location_${slug}`] }
  )();

  if (!locationData) {
    notFound()
  }

  const location = locationData;

  let isPreview = false
  if (preview === 'true') {
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
          .eq('created_by', userData.user.id)
          .single()
        if (org) isPreview = true
      }
    }
  }

  // Fetch secondary data in parallel
  const paymentSettingsPromise = supabase
    .from('organization_payment_settings')
    .select('is_active, provider_account_id')
    .eq('organization_id', location.organization_id)
    .single()

  const qrCodePromise = qrId ? supabase
    .from('qr_codes')
    .select('table_identifier, destination_path, is_active')
    .eq('id', qrId)
    .eq('location_id', location.id)
    .single() : Promise.resolve(null)

  const fetchLocationPages = async () => {
    let query = supabase
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

  const locationPagesPromise = isPreview
    ? fetchLocationPages()
    : unstable_cache(
        fetchLocationPages,
        [`location_pages_${location.id}`],
        { revalidate: 60, tags: [`location_pages_${location.id}`] }
      )()

  const [
    { data: paymentSettings },
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

  const pageCount = locationPages?.length ?? 0
  // ── Routing Decision Tree ───────────────────────────────────────────────────
  // 1 page  → redirect directly to it (e.g. a phone store with only one catalog)
  // >1 pages → render the Portal (becomes the business's branded landing page)
  // 0 pages → render empty state
  // ────────────────────────────────────────────────────────────────────────────

  if (pageCount === 1 && locationPages) {
    const singlePage = locationPages[0]
    const destination = `/m/${slug}/p/${singlePage.slug}${qrId ? `?qr_id=${qrId}` : ''}`
    redirect(destination)
  }

  if (pageCount > 1 && locationPages) {
    const ldJson = location.is_search_visible ? {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": location.name,
      "image": location.cover_image_url || undefined,
      "telephone": location.phone_number || undefined,
      "url": `https://ourmenuos.online/m/${slug}`,
      "openingHours": location.operating_hours || undefined
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
        <PortalRenderer location={location as unknown as Parameters<typeof PortalRenderer>[0]['location']} pages={locationPages} />
      </>
    )
  }

  // 0 pages → Empty State
  return (
    <main className="min-h-screen bg-[#f5f7f5] dark:bg-zinc-950 font-sans flex flex-col items-center justify-center p-6 text-center">
      {isPreview && <PreviewBanner />}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl p-10 max-w-md w-full shadow-2xl border border-black/5 dark:border-white/10">
        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-2xl mx-auto flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#17201b] dark:text-white mb-3">
          {location.name}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          We're getting our space ready. Check back soon!
        </p>
      </div>
      <div className="mt-12 text-center">
        <a href="https://ourmenuos.online" className="text-xs text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors font-medium">
          Powered by OurMenu OS
        </a>
      </div>
    </main>
  )
}
