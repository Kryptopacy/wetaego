import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { QRGeneratorClient } from './qr-generator-client'

export const metadata = {
  title: 'QR Code Generator & Signage | OurMenu OS',
}

export default async function QRPage() {
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

  const { data: loc } = await supabase
    .from('locations')
    .select('id, name, slug, portal_display_name, theme_color, organization_id, organizations(id, logo_url, business_type)')
    .eq('id', activeLocationId)
    .single()

  if (!loc) {
    redirect('/dashboard/settings')
  }

  // Fetch location pages
  const { data: pages } = await supabase
    .from('location_pages')
    .select('id, title, slug, template_type, business_type_preset')
    .eq('location_id', loc.id)
    .order('created_at')

  // Fetch resources / tables
  const { data: resources } = await supabase
    .from('resources')
    .select('id, name, type')
    .eq('location_id', loc.id)
    .order('name')

  const orgData = Array.isArray(loc.organizations) ? loc.organizations[0] : loc.organizations

  return (
    <QRGeneratorClient
      locationSlug={loc.slug}
      locationName={loc.portal_display_name || loc.name}
      themeColor={loc.theme_color || '#10b981'}
      logoUrl={orgData?.logo_url}
      businessType={orgData?.business_type}
      pages={pages || []}
      initialResources={resources || []}
    />
  )
}
