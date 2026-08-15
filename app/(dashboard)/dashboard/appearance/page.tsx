import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LiveBuilder } from './builder'
import { cookies } from 'next/headers'
import { getPlanLimits } from '@/lib/utils/settings'

export default async function AppearancePage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    redirect('/login')
  }

  const cookieStore = await cookies()
  const activeLocationId = cookieStore.get('ourmenu_active_location_id')?.value

  if (!activeLocationId) {
    redirect('/dashboard/settings')
  }

  // Fetch location and organization details
  const { data: loc } = await supabase
    .from('locations')
    .select('id, theme_color, cover_image_url, design_tokens, organization_id, organizations(id, slug, subscription_tier, purchased_credits, monthly_free_credits_used)')
    .eq('id', activeLocationId)
    .single()

  if (!loc) {
    redirect('/dashboard/settings')
  }

  // Verify authorization
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', loc.organization_id)
    .eq('user_id', user.id)
    .single()

  let isAuthorized = member?.role === 'owner' || member?.role === 'manager'
  if (!member) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', loc.organization_id)
      .eq('created_by', user.id).single()
    isAuthorized = !!org
  }

  if (!isAuthorized) {
    redirect('/dashboard')
  }

  const orgData = Array.isArray(loc.organizations) ? loc.organizations[0] : loc.organizations
  const orgSlug = orgData?.slug

  let creditsRemaining = 0
  if (orgData) {
    const tier = (orgData.subscription_tier || 'starter') as string
    const dynamicPlanLimits = await getPlanLimits() as Record<string, { credits: number; pages: number }>
    const monthlyLimit = dynamicPlanLimits[tier]?.credits || 0
    const availableFree = Math.max(0, monthlyLimit - (orgData.monthly_free_credits_used || 0))
    creditsRemaining = availableFree + (orgData.purchased_credits || 0)
  }

  const { data: pages } = await supabase
    .from('location_pages')
    .select('id, title, slug, design_tokens, global_discount_enabled, global_discount_percentage, global_discount_banner_text')
    .eq('location_id', activeLocationId)
    .order('created_at')

  return (
    <LiveBuilder 
      locationId={loc.id} 
      initialTokens={loc.design_tokens || {}}
      themeColor={loc.theme_color || '#10b981'}
      coverImageUrl={loc.cover_image_url}
      creditsRemaining={creditsRemaining}
      storefrontSlug={orgSlug || ''}
      pages={pages || []}
    />
  )
}
