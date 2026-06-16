import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const qrId = searchParams.get('qr_id')

  if (!qrId) {
    return NextResponse.json({ error: 'Missing qr_id' }, { status: 400 })
  }

  const supabase = await createClient()

  // 1. Fetch QR Code info
  const { data: qrData, error: qrError } = await supabase
    .from('qr_codes')
    .select('location_id, table_identifier, organizations(slug)')
    .eq('id', qrId)
    .single()

  if (qrError || !qrData) {
    return NextResponse.json({ error: 'Invalid QR Code' }, { status: 404 })
  }

  const orgSlug = (qrData.organizations as any)?.slug
  const locationId = qrData.location_id
  const tableIdentifier = qrData.table_identifier

  if (!orgSlug) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  // 2. Redirect to the Feedback Verify Page
  // We pass the location_id so the verify page knows where the user is
  const verifyUrl = new URL(`/m/${orgSlug}/feedback-verify`, req.url)
  verifyUrl.searchParams.set('location_id', locationId)
  
  if (tableIdentifier) {
    verifyUrl.searchParams.set('table', tableIdentifier)
  }

  return NextResponse.redirect(verifyUrl)
}
