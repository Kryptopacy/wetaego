import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ActionForm } from '@/components/ActionForm'
import { updateBookingStatus } from './actions'
import { BookingsClient } from './bookings-client'
  
import { format } from 'date-fns'
import { Calendar } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

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

    // Fetch bookings linked to 'booking' or 'listing' template pages
    const { data: bookings } = await supabase
      .from('page_bookings')
      .select(`
        *,
        location_pages!inner(id, title, template_type, locations!inner(organization_id)),
        page_items(title)
      `)
      .eq('location_pages.locations.organization_id', member.organization_id)
      .in('location_pages.template_type', ['booking', 'listing'])
      .order('created_at', { ascending: false })

  return (
    <BookingsClient bookings={bookings || []}>
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/2 border-b border-white/5 text-zinc-400">
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
                  <td colSpan={7} className="p-0">
                    <EmptyState
                      icon={Calendar}
                      title="No Bookings Yet"
                      description="When guests reserve appointments or book tables via your storefront, they will appear here in real-time."
                      className="border-0 rounded-none shadow-none bg-transparent"
                    />
                  </td>
                </tr>
              ) : (
                bookings?.map((booking) => (
                  <tr key={booking.id} className="hover:bg-white/2 transition-colors">
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
                          <ActionForm action={updateBookingStatus}>
                            <input type="hidden" name="bookingId" value={booking.id} />
                            <input type="hidden" name="action" value="confirm" />
                            <button type="submit" className="px-3 py-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 font-medium text-xs transition-colors">
                              Confirm
                            </button>
                          </ActionForm>
                        )}
                        {booking.payment_status !== 'paid' && booking.status !== 'cancelled' && (
                          <ActionForm action={updateBookingStatus}>
                            <input type="hidden" name="bookingId" value={booking.id} />
                            <input type="hidden" name="action" value="mark_paid" />
                            <button type="submit" className="px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-medium text-xs transition-colors">
                              Mark Paid
                            </button>
                          </ActionForm>
                        )}
                        {booking.status !== 'cancelled' && (
                          <ActionForm action={updateBookingStatus}>
                            <input type="hidden" name="bookingId" value={booking.id} />
                            <input type="hidden" name="action" value="cancel" />
                            <button type="submit" className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-red-500/20 hover:text-red-400 font-medium text-xs transition-colors">
                              Cancel
                            </button>
                          </ActionForm>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="sm:hidden divide-y divide-white/5">
          {bookings?.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No bookings found.
            </div>
          ) : (
            bookings?.map((booking) => (
              <div key={booking.id} className="p-4 flex flex-col gap-3 hover:bg-white/2 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-white">{booking.customer_name}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{booking.customer_phone}</div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold ${
                    booking.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                    booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                    booking.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {booking.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Service / Item</div>
                    <div className="text-zinc-300 line-clamp-1">{booking.page_items?.title || booking.location_pages.title}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Date & Time</div>
                    <div className="text-zinc-300">
                      {booking.booking_date ? format(new Date(booking.booking_date), 'MMM d') : 'Any time'}
                      {booking.booking_time && <span className="ml-1 text-zinc-400">at {booking.booking_time}</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Guests</div>
                    <div className="text-zinc-300">{booking.number_of_guests}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Payment</div>
                    <div className="text-zinc-300 capitalize">{booking.payment_status.replace('_', ' ')}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 pt-3 border-t border-white/5">
                  {booking.status === 'pending' && (
                    <ActionForm action={updateBookingStatus} className="flex-1">
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input type="hidden" name="action" value="confirm" />
                      <button type="submit" className="w-full px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 font-medium text-sm transition-colors">
                        Confirm
                      </button>
                    </ActionForm>
                  )}
                  {booking.payment_status !== 'paid' && booking.status !== 'cancelled' && (
                    <ActionForm action={updateBookingStatus} className="flex-1">
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input type="hidden" name="action" value="mark_paid" />
                      <button type="submit" className="w-full px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-medium text-sm transition-colors">
                        Mark Paid
                      </button>
                    </ActionForm>
                  )}
                  {booking.status !== 'cancelled' && (
                    <ActionForm action={updateBookingStatus} className="flex-1">
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input type="hidden" name="action" value="cancel" />
                      <button type="submit" className="w-full px-3 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-red-500/20 hover:text-red-400 font-medium text-sm transition-colors">
                        Cancel
                      </button>
                    </ActionForm>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </BookingsClient>
  )
}
