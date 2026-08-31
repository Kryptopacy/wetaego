import { NextResponse } from 'next/server'

export const dynamic = 'force-static'
export const revalidate = 86400

const METADATA = {
  "ucp": {
    "version": "1.0.0",
    "services": [
      "catalog",
      "checkout",
      "fulfillment",
      "inventory",
      "reservations"
    ],
    "capabilities": [
      "table_ordering",
      "split_payments",
      "appointment_booking",
      "escpos_printing",
      "multimodal_ai_concierge",
      "fleet_catalog_replication"
    ]
  },
  "protocol": "ucp",
  "version": "1.0.0",
  "name": "OurMenu OS Universal Commerce Profile",
  "description": "Universal Commerce Protocol profile for automated AI agent commerce across restaurants, supermarkets, salons, and retail.",
  "spec_url": "https://ucp.dev/specification/overview/",
  "services": [
    "catalog",
    "checkout",
    "fulfillment",
    "inventory",
    "reservations"
  ],
  "capabilities": [
    "table_ordering",
    "split_payments",
    "appointment_booking",
    "escpos_printing",
    "multimodal_ai_concierge",
    "fleet_catalog_replication"
  ],
  "endpoints": {
    "catalog": "https://ourmenuos.online/api/chat",
    "checkout": "https://ourmenuos.online/api/orders",
    "bookings": "https://ourmenuos.online/api/bookings",
    "ocr_parser": "https://ourmenuos.online/api/ai/parse-menu",
    "health": "https://ourmenuos.online/api/health",
    "openapi": "https://ourmenuos.online/openapi.json"
  }
}

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400'
}

export async function GET() {
  return NextResponse.json(METADATA, { status: 200, headers: HEADERS })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEADERS })
}
