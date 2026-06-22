import { Database } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/server'
import { QrClient } from './qr-client'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function QRCodeBatchPage() {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  const cookieStore = await cookies()
  const isDemo = !user && cookieStore.get('demo_mode')?.value === '1'

  if (!user && !isDemo) {
    redirect('/login')
  }

  const userId = user?.id || 'demo-user-id'

  let org: { id: string } | null = null
  let role = 'viewer'
  let locations: Database['public']['Tables']['locations']['Row'][] = []
  let qrCodes: Database['public']['Tables']['qr_codes']['Row'][] = []
  let orgLogo: string | null = null

  if (isDemo) {
    org = { id: 'demo-org' }
    role = 'owner'
    orgLogo = 'https://picsum.photos/200'
    locations = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 'demo-loc', name: 'Demo Venue', slug: 'demo-venue', theme_color: '#3b82f6' } as unknown as any
    ]
    qrCodes = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 'qr-1', table_identifier: 'Table 1', location_id: 'demo-loc', organization_id: 'demo-org', is_active: true } as unknown as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 'qr-2', table_identifier: 'Bar A', location_id: 'demo-loc', organization_id: 'demo-org', is_active: true } as unknown as any
    ]
  } else {
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
      .select('logo_url')
      .eq('id', org.id)
      .single()
    orgLogo = orgData?.logo_url || null

    const { data: locs } = await supabase
      .from('locations')
      .select('*')
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
      
    if (activeLocationId) {
      query = query.eq('location_id', activeLocationId)
    }

    const { data: qrs } = await query.order('created_at', { ascending: false })
    
    qrCodes = qrs || []
  }

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
      />
    </div>
  )
}
