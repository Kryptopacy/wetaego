'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateBookingStatus(bookingId: string, action: 'mark_paid' | 'cancel') {
  const supabase = await createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) throw new Error('Not authenticated')

  const { data: booking } = await supabase
    .from('page_bookings' as any)
    .select('organization_id')
    .eq('id', bookingId)
    .single()

  if (!booking) throw new Error('Booking not found')

  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', booking.organization_id)
    .eq('user_id', userData.user.id)
    .single()

  let isAuthorized = member?.role === 'owner' || member?.role === 'manager'
  if (!member) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', booking.organization_id)
      .eq('created_by', userData.user.id)
      .single()
    isAuthorized = !!org
  }

  if (!isAuthorized) throw new Error('Unauthorized')

  if (action === 'mark_paid') {
    await supabase.from('page_bookings' as any).update({ payment_status: 'paid', status: 'confirmed' }).eq('id', bookingId)
  } else if (action === 'cancel') {
    await supabase.from('page_bookings' as any).update({ status: 'cancelled' }).eq('id', bookingId)
  }

  revalidatePath('/dashboard/bookings')
}
