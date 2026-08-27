import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { KioskDisplay } from '../shifts/kiosk-display'

export const metadata = {
  title: 'Kiosk Mode | WETAEGO',
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
    .select('role, organization_id')
    .eq('user_id', user.id)
    .single()

  if (!member || (member.role !== 'owner' && member.role !== 'manager')) {
    redirect('/dashboard')
  }

  const activeLocationId = cookieStore.get('ourmenu_active_location_id')?.value

  let locationQuery = supabase
    .from('locations')
    .select('id, name, organization_id')
    .eq('organization_id', member.organization_id)

  if (activeLocationId) {
    locationQuery = locationQuery.eq('id', activeLocationId)
  }

  const { data: locations } = await locationQuery.limit(1)
  const location = locations?.[0]

  if (!location) {
    redirect('/dashboard/settings')
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('name, logo_url')
    .eq('id', member.organization_id)
    .single()

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
      businessName={org?.name || 'WETAEGO'}
      logoUrl={org?.logo_url}
      exitPin={exitPin}
    />
  )
}
