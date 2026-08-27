import { NextResponse } from 'next/server'

export async function GET() {
  const ucpProfile = {
    ucp: {
      version: '1.0.0',
      services: [
        'catalog',
        'checkout',
        'fulfillment',
        'inventory',
        'reservations'
      ],
      capabilities: [
        'table_ordering',
        'split_payments',
        'appointment_booking',
        'escpos_printing',
        'multimodal_ai_concierge',
        'fleet_catalog_replication'
      ]
    },
    protocol: 'ucp',
    version: '1.0.0',
    name: 'WETAEGO Universal Commerce Profile',
    description: 'Universal Commerce Protocol profile for automated AI agent commerce across restaurants, supermarkets, salons, and retail.',
    spec_url: 'https://ucp.dev/specification/overview/',
    services: [
      'catalog',
      'checkout',
      'fulfillment',
      'inventory',
      'reservations'
    ],
    capabilities: [
      'table_ordering',
      'split_payments',
      'appointment_booking',
      'escpos_printing',
      'multimodal_ai_concierge',
      'fleet_catalog_replication'
    ],
    endpoints: {
      catalog: 'https://ourmenuos.online/api/chat',
      checkout: 'https://ourmenuos.online/api/orders',
      bookings: 'https://ourmenuos.online/api/bookings',
      ocr_parser: 'https://ourmenuos.online/api/ai/parse-menu',
      health: 'https://ourmenuos.online/api/health',
      openapi: 'https://ourmenuos.online/openapi.json'
    }
  }

  return NextResponse.json(ucpProfile, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Vary': 'Accept, Accept-Encoding'
    }
  })
}
