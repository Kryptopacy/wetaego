'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { authActionClient } from '@/lib/safe-action'
import { zfd } from 'zod-form-data'

export const updateBookingStatus = authActionClient
  .schema(zfd.formData({
    bookingId: zfd.text(z.string().uuid()),
    action: zfd.text(z.enum(['mark_paid', 'cancel', 'confirm']))
  }))
  .action(async ({ parsedInput: { bookingId, action }, ctx: { user } }) => {
    const supabase = await createClient()

    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      return { success: true }
    }

    const { data: bookingData } = await supabase
      .from('page_bookings')
      .select('location_pages!inner(locations!inner(organization_id))')
      .eq('id', bookingId)
      .single()

    if (!bookingData) throw new Error('Booking not found')
    
    
    const orgId = (bookingData.location_pages as { locations: { organization_id: string } })?.locations?.organization_id

    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single()

    let isAuthorized = member?.role === 'owner' || member?.role === 'manager'
    if (!member) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', orgId)
        .eq('created_by', user.id)
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
    return { success: true }
  })
