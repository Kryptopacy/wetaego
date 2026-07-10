import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPreset, buildPageTitle } from '@/lib/templates/presets'
import { BookingBuilderClient } from './booking-builder-client'
import { CatalogBuilderClient } from './catalog-builder-client'
import { InfoBuilderClient } from './info-builder-client'
import { QuoteBuilderClient } from './quote-builder-client'
import { ListingBuilderClient } from './listing-builder-client'
import { RateCardBuilderClient } from './rate-card-builder-client'

export default async function BuildTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ businessType: string }>
  searchParams: Promise<{ mode?: string; pageId?: string }>
}) {
  const { businessType } = await params
  const { mode = 'primary', pageId } = await searchParams

  const preset = getPreset(businessType)

  // Special cases: info and custom don't need a preset
  const isSpecial = ['info', 'custom'].includes(businessType)
  if (!preset && !isSpecial) redirect('/dashboard/pages/setup')

  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) redirect('/login')
  // Get org
  let org: { id: string; name: string; subscription_tier: string; purchased_credits: number; monthly_free_credits_used: number } | null = null

  const { data: member } = await supabase
    .from('organization_members')
    .select('role, organizations(id, name, subscription_tier, purchased_credits, monthly_free_credits_used)')
    .eq('user_id', userData.user!.id)
    .single()

  if (member?.organizations) {
    org = member.organizations as unknown as typeof org
  } else {
    const { data } = await supabase
      .from('organizations')
      .select('id, name, subscription_tier, purchased_credits, monthly_free_credits_used')
      .eq('created_by', userData.user!.id)
      .single()
    org = data
  }

  if (!org) redirect('/dashboard')

  const { data: loc } = await supabase
    .from('locations')
    .select('id, slug')
    .eq('organization_id', org.id)
    .single()

  if (!loc) redirect('/dashboard')

  // Editing existing page?
  let existingPage = null
  let existingItems: unknown[] = []
  if (pageId) {
    const { data: page } = await supabase
      .from('location_pages')
      .select('*')
      .eq('id', pageId)
      .single()
    existingPage = page

    const { data: items } = await supabase
      .from('page_items')
      .select('*')
      .eq('page_id', pageId)
      .order('sort_order')
    existingItems = items || []
  }

  const defaultTitle = preset ? buildPageTitle(preset, org.name) : org.name

  const sharedProps = {
    businessType,
    orgId: org.id,
    orgName: org.name,
    locationId: loc.id,
    locationSlug: loc.slug,
    mode,
    existingPage,
    existingItems,
    defaultTitle,
  }

  // Route to the right builder by template type
  const templateType = preset?.template_type ?? businessType

  if (templateType === 'booking') {
    return <BookingBuilderClient preset={preset!} {...sharedProps} />
  }

  if (templateType === 'catalog') {
    return <CatalogBuilderClient preset={preset!} {...sharedProps} />
  }

  // listing template
  if (templateType === 'listing') {
    return <ListingBuilderClient preset={preset!} {...sharedProps} />
  }

  // rate card template
  if (templateType === 'rate_card') {
    return <RateCardBuilderClient preset={preset!} {...sharedProps} />
  }

  // quote template
  if (templateType === 'quote') {
    return <QuoteBuilderClient preset={preset!} {...sharedProps} />
  }

  // info / custom / portfolio templates
  if (templateType === 'info' || templateType === 'custom' || templateType === 'portfolio') {
    return <InfoBuilderClient preset={preset!} {...sharedProps} />
  }

  redirect('/dashboard/pages')
}
