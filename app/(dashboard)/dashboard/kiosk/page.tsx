import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { KioskDisplay } from '../shifts/kiosk-display'

export const metadata = {
  title: 'Kiosk Mode | OurMenu OS',
  robots: { index: false, follow: false }
}

export default async function KioskPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Only managers/owners can open kiosk mode
  const { data: member } = await supabase
    .from('organization_members')
    .select('role, organization_id, organizations(name, logo_url)')
    .eq('user_id', user.id)
    .in('role', ['owner', 'manager'])
    .single()

  if (!member) redirect('/dashboard')

  const org = member.organizations as { name: string; logo_url: string | null } | null

  const activeLocationId = cookieStore.get('ourmenu_active_location_id')?.value
  if (!activeLocationId) redirect('/dashboard/settings')

  const { data: location } = await supabase
    .from('locations')
    .select('id, name')
    .eq('id', activeLocationId)
    .eq('organization_id', member.organization_id)
    .single()

  if (!location) redirect('/dashboard')

  // Kiosk exit PIN — stored in system settings or fallback to "1234"
  // In production, the manager configures this in Settings > Team
  const { data: pinSetting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', `kiosk_exit_pin_${location.id}`)
    .maybeSingle()

  const exitPin = (pinSetting?.value as string) || '1234'

  return (
    <KioskDisplay
      locationId={location.id}
      locationName={location.name}
      businessName={org?.name || 'OurMenu OS'}
      logoUrl={org?.logo_url}
      exitPin={exitPin}
    />
  )
}
