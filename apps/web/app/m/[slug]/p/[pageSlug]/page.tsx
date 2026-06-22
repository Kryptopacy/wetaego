import { QueryData } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { BookingRenderer } from './templates/booking-renderer'
import { CatalogPageRenderer } from './templates/catalog-page-renderer'
import { ListingRenderer } from './templates/listing-renderer'
import { RateCardRenderer } from './templates/rate-card-renderer'
import { InfoRenderer } from './templates/info-renderer'
import { AIChat } from '../../ai-chat'
import { RouletteFAB } from '../../roulette-fab'
import { EcosystemNav } from '@/components/layout/ecosystem-nav'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; pageSlug: string }>
}): Promise<Metadata> {
  const { slug, pageSlug } = await params
  const supabase = await createClient()

  const locQuery = supabase
    .from('locations')
    .select('id, name, cover_image_url')
    .eq('slug', slug)
    .single()
  const { data: loc } = await locQuery
  if (!loc) return { title: 'Not Found' }

  const pageQuery = supabase
    .from('location_pages')
    .select('title, content, template_type')
    .eq('location_id', loc.id)
    .eq('slug', pageSlug)
    .eq('is_published', true)
    .single()
  const { data: page } = await pageQuery
  if (!page) return { title: 'Not Found' }

  const description = page.content
    ? page.content.slice(0, 160).replace(/[#\n]/g, ' ').trim()
    : `${page.title} — ${loc.name}`

  return {
    title: `${page.title} | ${loc.name}`,
    description,
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
  searchParams: Promise<{ qr_id?: string; ref?: string }>
}) {
  const { slug, pageSlug } = await params
  const { ref } = await searchParams

  const supabase = await createClient()

  // 1. Location
  const locQuery = supabase
    .from('locations')
    .select('id, name, organization_id, theme_color, cover_image_url, ai_enabled, ai_name, instagram_handle, x_handle, tiktok_handle, whatsapp_number, phone_number, organizations(logo_url), manual_payment_enabled, manual_payment_bank_name, manual_payment_account_name, manual_payment_account_number, manual_payment_instructions')
    .eq('slug', slug)
    .single()
  const { data: loc } = await locQuery

  if (!loc) notFound()

  // 2. Page
  const pageQuery = supabase
    .from('location_pages')
    .select('id, title, slug, content, template_type, billing_enabled, billing_mode, payment_mode, deposit_percentage, business_type_preset, randomizer_enabled')
    .eq('location_id', loc.id)
    .eq('slug', pageSlug)
    .eq('is_published', true)
    .single()
  const { data: page } = await pageQuery

  if (!page) notFound()

  // 3. Items (for catalog, booking, listing, rate_card)
  const itemsQuery = supabase
    .from('page_items')
    .select('*')
    .eq('page_id', page.id)
    .eq('is_published', true)
    .order('sort_order')
  const { data: items } = await itemsQuery

  // 4. Payment Settings
  const { data: paymentSettings } = await supabase
    .from('organization_payment_settings')
    .select('is_active')
    .eq('organization_id', loc.organization_id)
    .single()

  const sharedProps = {
     
    location: { ...loc, cover_image_url: loc.cover_image_url ?? undefined } as never,
     
    page: page as never,
     
    items: items as never[],
    locationSlug: slug,
    referralSource: ref,
    paymentIsLive: paymentSettings?.is_active ?? false,
  }

  // Route to the right renderer
  let RendererContent = null
  switch (page.template_type) {
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
    case 'info':
    case 'custom':
    default:
      RendererContent = <InfoRenderer {...sharedProps} />
      break
  }

  return (
    <>
      {RendererContent}
      <EcosystemNav locationId={loc.id} slug={slug} currentPath={page.slug} />
      {loc.ai_enabled && (
        <AIChat
          locationId={loc.id}
          organizationId={loc.organization_id}
          aiName={loc.ai_name || ''}
          themeColor={loc.theme_color || '#7c3aed'}
          tableIdentifier="QR Scan" // Standard fallback for generic pages
          menuItems={(items as QueryData<typeof itemsQuery>).map(i => ({ id: i.id, name: i.title, price_minor: i.price_minor || 0 })) || []}
          templateType={page.template_type}
          billingMode={page.billing_mode}
          businessTypePreset={page.business_type_preset}
        />
      )}
      {page.randomizer_enabled && (
        <RouletteFAB />
      )}
    </>
  )
}
