import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { AvailabilityClient } from './availability-client'
import { AvailabilitySchedule } from '@/lib/utils/availability'
import { PageHeader } from '@/components/ui/page-header'

export const metadata = {
  title: 'Availability | WETAEGO',
}

const DEFAULT_SCHEDULE = {
  "1": [{ start: "09:00", end: "17:00" }],
  "2": [{ start: "09:00", end: "17:00" }],
  "3": [{ start: "09:00", end: "17:00" }],
  "4": [{ start: "09:00", end: "17:00" }],
  "5": [{ start: "09:00", end: "17:00" }],
  "6": [],
  "0": []
}

export default async function AvailabilityPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    redirect('/login')
  }
  const userId = user!.id

  let org: { id: string } | null = null

  const { data: member } = await supabase
    .from('organization_members')
    .select('role, organizations(id)')
    .eq('user_id', userId).limit(1).maybeSingle()

  if (member && member.organizations) {
    org = member.organizations as { id: string }
  } else {
    const { data } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', userId).limit(1).maybeSingle()
    org = data
  }

  const cookieStore = await cookies()
  const savedLocId = cookieStore.get('ourmenu_active_location_id')?.value

  // Verify the savedLocId belongs to the org
  const { data: orgLocs } = await supabase.from('locations').select('id, name').eq('organization_id', org?.id || '')
  
  let locationId = savedLocId
  if (!orgLocs?.find(l => l.id === savedLocId) && savedLocId !== 'global') {
    locationId = orgLocs?.[0]?.id || ''
  }
  const activeLocationId = (savedLocId === 'global' ? orgLocs?.[0]?.id : locationId) || orgLocs?.[0]?.id || ''

  // Fetch Availability
  const { data: availability } = await supabase
    .from('location_availability')
    .select('*')
    .eq('location_id', activeLocationId)
    .single()

  const initialAvailability = availability ? {
    location_id: availability.location_id,
    timezone: availability.timezone,
    slot_interval: availability.slot_interval,
    schedule: (availability.schedule as unknown as AvailabilitySchedule) || DEFAULT_SCHEDULE
  } : {
    location_id: activeLocationId,
    timezone: 'Africa/Lagos',
    slot_interval: 30,
    schedule: DEFAULT_SCHEDULE
  }

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Availability"
        description="Configure your timezone and operational hours to power real-time smart bookings."
      />

      <div>
        <AvailabilityClient initialData={initialAvailability} locationId={activeLocationId} />
      </div>
    </div>
  )
}
