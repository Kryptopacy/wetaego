import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { PageHeader } from '@/components/ui/page-header'
import { Building2 } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

export default async function PropertiesDashboard() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData?.user) {
    redirect('/login')
  }

  // Get user's org
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userData.user.id)
    .single()

  if (!member) redirect('/dashboard')

  // Fetch inquiries linked to 'listing' template pages
  const { data: inquiries } = await supabase
    .from('page_bookings')
    .select(`
      *,
      location_pages!inner(id, title, template_type, locations!inner(organization_id)),
      page_items(title)
    `)
    .eq('location_pages.locations.organization_id', member.organization_id)
    .eq('location_pages.template_type', 'listing')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        description="Manage property inquiries, tour requests, and short-stay bookings."
      />

      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/[0.02] border-b border-white/5 text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Property</th>
                <th className="px-6 py-4 font-medium">Date Requested</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {inquiries?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState
                      icon={Building2}
                      title="No Property Inquiries"
                      description="Tour requests and short-stay booking inquiries from your real estate listings will appear here."
                      className="border-0 rounded-none shadow-none bg-transparent"
                    />
                  </td>
                </tr>
              ) : (
                inquiries?.map((inq) => (
                  <tr key={inq.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{inq.customer_name}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{inq.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      {inq.page_items?.title || inq.location_pages.title}
                    </td>
                    <td className="px-6 py-4">
                      {inq.booking_date ? format(new Date(inq.booking_date), 'MMM d, yyyy') : 'No Date'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 uppercase tracking-widest">
                        {inq.payment_status === 'not_required' ? 'Inquiry' : 'Booking'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                        inq.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                        inq.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {inq.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
