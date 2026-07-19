import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/upstash'
import { notifyBusiness } from '@/lib/notifications/dispatcher'
import { z } from 'zod'

const inquirySchema = z.object({
  page_id: z.string().uuid('Invalid page ID'),
  item_id: z.string().uuid().optional().nullable(),
  customer_name: z.string().min(1, 'Name is required'),
  customer_email: z.string().email().optional().nullable().or(z.literal('')),
  customer_phone: z.string().min(1, 'Phone is required'),
  message: z.string().optional().nullable(),
})

/**
 * POST /api/inquiries
 * Creates a new inquiry from a listing/rate_card page.
 * Stores in page_inquiries (not page_bookings).
 */
export async function POST(req: Request) {
  try {
    const { success } = await checkRateLimit('api_inquiries')
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await req.json()
    const parsed = inquirySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }

    const { page_id, item_id, customer_name, customer_email, customer_phone, message } = parsed.data
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    // Validate page belongs to a real published page
    const { data: page } = await supabase
      .from('location_pages')
      .select('id, title, locations!inner(id, organization_id, name, slug)')
      .eq('id', page_id)
      .eq('is_published', true)
      .single()

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const location = page.locations as { id: string; organization_id: string; name: string; slug: string } | null
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Insert into page_inquiries - the right table for listings
    const { data: inquiry, error: inquiryError } = await adminClient
      .from('page_inquiries')
      .insert({
        page_id,
        item_id: item_id || null,
        customer_name,
        customer_email: customer_email || null,
        customer_phone,
        message: message || null,
        status: 'new',
      })
      .select('id')
      .single()

    if (inquiryError || !inquiry) {
      console.error('Inquiry insert error:', inquiryError)
      return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 })
    }

    // Notify the business
    try {
      // notifyBusiness takes (locationId, payload) - use location.id
      await notifyBusiness(location.id, {
        title: `New Inquiry: ${customer_name}`,
        body: `${customer_name} enquired via ${page.title}.${message ? ` Message: "${message}"` : ''}`,
        url: `/dashboard/leads`,
        tag: `inquiry-${inquiry.id}`,
      })
    } catch (e) {
      console.error('Notify error (non-fatal):', e)
    }

    return NextResponse.json({ success: true, inquiryId: inquiry.id })
  } catch (err) {
    console.error('POST /api/inquiries error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
