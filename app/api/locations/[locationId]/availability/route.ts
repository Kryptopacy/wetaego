import { NextResponse } from 'next/server'
import { getAvailableSlots } from '@/lib/utils/availability'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const locationId = (await params).locationId

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required (YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    const targetDate = new Date(date)
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Support resource_ids if provided as comma-separated
    const resourcesParam = searchParams.get('resource_ids')
    const resourceIds = resourcesParam ? resourcesParam.split(',').map(s => s.trim()) : undefined

    const slots = await getAvailableSlots(locationId, targetDate, resourceIds)

    return NextResponse.json({ slots })
  } catch (error) {
    console.error('[AVAILABILITY_GET]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
