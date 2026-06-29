import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const reference = searchParams.get('reference') || searchParams.get('trxref')

    if (!reference) {
      return new NextResponse('Missing payment reference', { status: 400 })
    }

    const supabase = await createClient()

    // The reference is like 'book_<uuid>_<timestamp>'
    let bookingId = ''
    if (reference.startsWith('book_')) {
      bookingId = reference.split('_')[1]
    } else {
      return new NextResponse('Invalid booking payment reference', { status: 400 })
    }

    // Fetch the booking to get the page and location slug
    const { data: booking } = await supabase
      .from('page_bookings')
      .select('page_id, location_pages(slug)')
      .eq('id', bookingId)
      .single()

    if (!booking) {
      return new NextResponse('Booking not found', { status: 404 })
    }

    
    const slug = (booking.location_pages as unknown as { slug?: string })?.slug

    if (!slug) {
      return new NextResponse('Booking page not found', { status: 404 })
    }

    // Redirect the user back to the public menu page with a success query param
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/m/${slug}?booking_success=true`)
  } catch (error) {
    console.error('Booking callback error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
