import { Database } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/server'
import { QrClient } from './qr-client'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getFreeQrLimit } from '@/lib/utils/billing'

export default async function QRCodeBatchPage() {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  const cookieStore = await cookies()

  if (!user) {
    redirect('/login')
  }

  const userId = user?.id || 'demo-user-id'

  let org: { id: string } | null = null
  let role = 'viewer'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let locations: any[] = []
  let qrCodes: Database['public']['Tables']['qr_codes']['Row'][] = []
  let orgLogo: string | null = null

  const { data: member } = await supabase
    .from('organization_members')
    .select('role, organizations(id)')
    .eq('user_id', userId)
    .single()

  if (member && member.organizations) {
     
    org = member.organizations as unknown as { id: string }
    role = member.role
  } else {
    const { data } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', userId)
      .single()
    org = data
    role = 'owner'
  }
    const isOwnerOrManager = role === 'owner' || role === 'manager'
    if (!isOwnerOrManager || !org) {
      redirect('/dashboard')
    }

    const { data: orgData } = await supabase
      .from('organizations')
      .select('logo_url, subscription_plan, purchased_credits')
      .eq('id', org.id)
      .single()
    orgLogo = orgData?.logo_url || null
    
    const planLimit = await getFreeQrLimit((orgData?.subscription_plan as string) || 'lite')
    const creditBalance = orgData?.purchased_credits || 0

    const { data: locs } = await supabase
      .from('locations')
      .select('*, location_pages(*)')
      .eq('organization_id', org.id)
    
    locations = locs || []

    const savedLocId = cookieStore.get('ourmenu_active_location_id')?.value
    let locationId = savedLocId
    if (!locationId && locations.length > 0) {
      locationId = locations[0].id
    }
    const activeLocationId = locationId || ''

    let query = supabase
      .from('qr_codes')
      .select('*')
      .eq('organization_id', org.id)
      
    if (activeLocationId && activeLocationId !== 'global') {
      query = query.eq('location_id', activeLocationId)
    }

    const { data: qrs } = await query.order('created_at', { ascending: false })
    
    qrCodes = qrs || []
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ourmenuos.online'

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8 print:hidden">QR Codes</h1>
      <QrClient 
        organizationId={org.id} 
        orgLogo={orgLogo}
        locations={locations} 
        qrCodes={qrCodes || []} 
        baseUrl={baseUrl}
        planLimit={planLimit}
        creditBalance={creditBalance}
      />
    </div>
  )
}
