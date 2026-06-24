
export const revalidate = 60;
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
import { withCache } from '@/lib/redis-cache'
import { PreviewBanner } from '@/components/preview-banner'

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
  searchParams: Promise<{ qr_id?: string; ref?: string; preview?: string }>
}) {
  const { slug, pageSlug } = await params
  const { ref, preview } = await searchParams

  const supabase = await createClient()

  const fetchLocation = async () => {
    if (slug === 'demo-venue') {
      return {
        id: 'demo-loc',
        name: 'Demo Venue',
        organization_id: 'demo-org',
        theme_color: '#3b82f6',
        cover_image_url: 'https://picsum.photos/1000/400',
        ai_enabled: true,
        ai_name: 'MenuAI',
        whatsapp_number: '+1234567890',
        organizations: { logo_url: 'https://picsum.photos/200' },
        randomizer_enabled: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any
    }

    const { data } = await supabase
      .from('locations')
      .select('id, name, organization_id, theme_color, cover_image_url, ai_enabled, ai_name, instagram_handle, x_handle, tiktok_handle, whatsapp_number, phone_number, organizations(logo_url), manual_payment_enabled, manual_payment_bank_name, manual_payment_account_name, manual_payment_account_number, manual_payment_instructions, delivery_enabled, delivery_fee_minor, delivery_minimum_order_minor, delivery_note, fulfillment_location_label')
      .eq('slug', slug)
      .single()
    return data
  }
  const loc = await withCache(`location_${slug}`, fetchLocation, 60)

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
    if (slug === 'demo-venue' && pageSlug === 'allergens') {
      return {
        id: 'page-2',
        title: 'Allergen Information',
        slug: 'allergens',
        template_type: 'info',
        content: '# Allergen Policy\n\nPlease let our staff know if you have any allergies. We handle nuts, dairy, and wheat in our kitchen.',
        is_published: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any
    }
    let query = supabase
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
    : await withCache(`location_page_${loc.id}_${pageSlug}`, fetchPage, 60)

  if (!page) notFound()

  // 3. Items (for catalog, booking, listing, rate_card)
  const fetchItems = async () => {
    let query = supabase
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
  const items = isPreview
    ? await fetchItems()
    : await withCache(`page_items_${page.id}`, fetchItems, 60)

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
      {isPreview && <PreviewBanner />}
      {RendererContent}
      <EcosystemNav locationId={loc.id} slug={slug} currentPath={page.slug} />
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
      {page.randomizer_enabled && (
        <RouletteFAB />
      )}
    </>
  )
}
