import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
import Link from 'next/link'
import { format } from 'date-fns'

export default async function BookingsDashboard() {
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

  // Fetch bookings linked to 'booking' template pages
  const { data: bookings } = await supabase
    .from('page_bookings')
    .select(`
      *,
      location_pages!inner(id, title, template_type, locations!inner(organization_id)),
      page_items(title)
    `)
    .eq('location_pages.locations.organization_id', member.organization_id)
    .eq('location_pages.template_type', 'booking')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Booking Management System</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage reservations, appointments, and service bookings.</p>
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/[0.02] border-b border-white/5 text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Service / Item</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Guests</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Payment</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {bookings?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                bookings?.map((booking) => (
                  <tr key={booking.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{booking.customer_name}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{booking.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      {booking.page_items?.title || booking.location_pages.title}
                    </td>
                    <td className="px-6 py-4">
                      {booking.booking_date ? format(new Date(booking.booking_date), 'MMM d, yyyy') : 'Any time'}
                      {booking.booking_time && <div className="text-xs text-zinc-500 mt-0.5">{booking.booking_time}</div>}
                    </td>
                    <td className="px-6 py-4">{booking.number_of_guests}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                        booking.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                        booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                        booking.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                        booking.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                        booking.payment_status === 'not_required' ? 'bg-zinc-500/20 text-zinc-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {booking.payment_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {booking.status === 'pending' && (
                          <form action={async () => {
                            'use server';
                            const { updateBookingStatus } = await import('./actions');
                            await updateBookingStatus(booking.id, 'confirm');
                          }}>
                            <button className="px-3 py-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 font-medium text-xs transition-colors">
                              Confirm
                            </button>
                          </form>
                        )}
                        {booking.payment_status !== 'paid' && booking.status !== 'cancelled' && (
                          <form action={async () => {
                            'use server';
                            const { updateBookingStatus } = await import('./actions');
                            await updateBookingStatus(booking.id, 'mark_paid');
                          }}>
                            <button className="px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-medium text-xs transition-colors">
                              Mark Paid
                            </button>
                          </form>
                        )}
                        {booking.status !== 'cancelled' && (
                          <form action={async () => {
                            'use server';
                            const { updateBookingStatus } = await import('./actions');
                            await updateBookingStatus(booking.id, 'cancel');
                          }}>
                            <button className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-red-500/20 hover:text-red-400 font-medium text-xs transition-colors">
                              Cancel
                            </button>
                          </form>
                        )}
                      </div>
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
