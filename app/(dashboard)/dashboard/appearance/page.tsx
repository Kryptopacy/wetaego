import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LiveBuilder } from './builder'
import { cookies } from 'next/headers'

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
    .select('id, theme_color, design_tokens, organization_id, organizations(slug)')
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

  const orgSlug = (Array.isArray(loc.organizations) ? loc.organizations[0] : loc.organizations)?.slug

  const { data: pages } = await supabase
    .from('location_pages')
    .select('id, title, slug, design_tokens')
    .eq('location_id', activeLocationId)
    .order('created_at')

  return (
    <LiveBuilder 
      locationId={loc.id} 
      initialTokens={loc.design_tokens || {}}
      themeColor={loc.theme_color || '#10b981'}
      storefrontSlug={orgSlug || ''}
      pages={pages || []}
    />
  )
}
