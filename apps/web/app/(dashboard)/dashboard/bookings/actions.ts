'use server'



import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateBookingStatus(bookingId: string, action: 'mark_paid' | 'cancel' | 'confirm') {
  const supabase = await createClient()

  const { data: userData, error: authError } = await supabase.auth.getUser()
  const { cookies } = await import('next/headers')
  if ((await cookies()).get('demo_mode')?.value === '1') {
    return { success: true }
  }
  if (authError || !userData?.user) throw new Error('Not authenticated')

  const { data: bookingData } = await supabase
    .from('page_bookings')
    .select('location_pages!inner(locations!inner(organization_id))')
    .eq('id', bookingId)
    .single()

  if (!bookingData) throw new Error('Booking not found')
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orgId = (bookingData.location_pages as any)?.locations?.organization_id

  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userData.user.id)
    .single()

  let isAuthorized = member?.role === 'owner' || member?.role === 'manager'
  if (!member) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', orgId)
      .eq('created_by', userData.user.id)
      .single()
    isAuthorized = !!org
  }

  if (!isAuthorized) throw new Error('Unauthorized')

  if (action === 'mark_paid') {
    await supabase.from('page_bookings').update({ payment_status: 'paid', status: 'confirmed' }).eq('id', bookingId)
  } else if (action === 'confirm') {
    await supabase.from('page_bookings').update({ status: 'confirmed' }).eq('id', bookingId)
  } else if (action === 'cancel') {
    await supabase.from('page_bookings').update({ status: 'cancelled' }).eq('id', bookingId)
  }

  revalidatePath('/dashboard/bookings')
}
