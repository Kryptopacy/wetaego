import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { LeadsClient } from './leads-client'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) redirect('/login')

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userData.user.id)
    .single()

  if (!member) redirect('/dashboard')

  // Fetch all inquiries for listings owned by this org
  const { data: inquiries } = await supabase
    .from('page_inquiries')
    .select(`
      id, customer_name, customer_email, customer_phone, message, status, created_at,
      page_items(title),
      location_pages!inner(title, locations!inner(organization_id))
    `)
    .eq('location_pages.locations.organization_id', member.organization_id)
    .order('created_at', { ascending: false })

  const safeInquiries = (inquiries ?? []).map(i => ({
    ...i,
    location_pages: Array.isArray(i.location_pages) ? i.location_pages[0] : i.location_pages,
    page_items: Array.isArray(i.page_items) ? i.page_items[0] : i.page_items,
  }))

  const newCount = safeInquiries.filter(i => i.status === 'new').length

  return (
    <div className="max-w-5xl space-y-8 pb-24">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Leads Pipeline</h1>
            <p className="text-sm text-zinc-500">
              Track and manage all enquiries from your property and service listings.
            </p>
          </div>
          {newCount > 0 && (
            <span className="ml-auto px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-semibold border border-blue-500/30">
              {newCount} new
            </span>
          )}
        </div>
      </div>

      <LeadsClient initialInquiries={safeInquiries as any} />
    </div>
  )
}
