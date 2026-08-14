import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { PageHeader } from '@/components/ui/page-header'
import { FileText } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

export default async function QuotesDashboard() {
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

  // Fetch quotes linked to rate_card, info, custom, quote templates
  const { data: quotes } = await supabase
    .from('page_bookings')
    .select(`
      *,
      location_pages!inner(id, title, template_type, locations!inner(organization_id)),
      page_items(title)
    `)
    .eq('location_pages.locations.organization_id', member.organization_id)
    .in('location_pages.template_type', ['rate_card', 'info', 'custom', 'quote'])
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotes & Inquiries"
        description="Manage custom quotes, service inquiries, and project requests."
      />

      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/2 border-b border-white/5 text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Interest / Package</th>
                <th className="px-6 py-4 font-medium">Date Received</th>
                <th className="px-6 py-4 font-medium">Message</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {quotes?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState
                      icon={FileText}
                      title="No Quotes Requested"
                      description="Custom price quote requests submitted through your business pages will land here."
                      className="border-0 rounded-none shadow-none bg-transparent"
                    />
                  </td>
                </tr>
              ) : (
                quotes?.map((quote) => (
                  <tr key={quote.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{quote.customer_name}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{quote.customer_email || quote.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      {quote.page_items?.title || quote.location_pages.title}
                    </td>
                    <td className="px-6 py-4">
                      {format(new Date(quote.created_at), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="px-6 py-4 max-w-50 truncate">
                      {quote.booking_notes || <span className="text-zinc-600 italic">No message</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                        quote.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                        quote.status === 'cancelled' ? 'bg-zinc-500/20 text-zinc-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {quote.status === 'pending' ? 'Needs Reply' : quote.status === 'confirmed' ? 'Replied' : 'Archived'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/quotes/${quote.id}`} className="text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors">
                        View & Reply
                      </Link>
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
