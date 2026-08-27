import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { WebhooksManager } from './webhooks-manager'
import { PageHeader } from '@/components/ui/page-header'

export const metadata = {
  title: 'Webhooks | WETAEGO',
}

export default async function WebhooksPage() {
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
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (member && member.organizations) {
    org = member.organizations as { id: string }
  } else {
    const { data } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', userId)
      .limit(1)
      .maybeSingle()
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

  // Fetch Webhooks
  const { data: webhooks } = await supabase
    .from('location_webhooks')
    .select('*')
    .eq('location_id', activeLocationId)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="Webhooks"
        description="Configure webhooks to receive real-time HTTP POST payloads when orders, bookings, and customer events occur."
      />

      <div>
        <WebhooksManager locationId={activeLocationId} initialWebhooks={webhooks || []} />
      </div>
    </div>
  )
}
