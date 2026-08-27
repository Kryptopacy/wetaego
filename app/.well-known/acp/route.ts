import { NextResponse } from 'next/server'

export async function GET() {
  const acpConfig = {
    protocol: {
      name: 'acp',
      version: '1.0.0'
    },
    name: 'WETAEGO Agentic Commerce Protocol',
    description: 'Agentic Commerce Protocol (ACP) discovery manifest for autonomous agent browsing, cart building, order placement, and booking.',
    api_base_url: 'https://ourmenuos.online/api',
    transports: ['https', 'mcp', 'websocket'],
    capabilities: {
      services: [
        'catalog_search',
        'cart_management',
        'order_checkout',
        'service_booking',
        'receipt_printing',
        'payment_roulette'
      ],
      settlement_methods: [
        'paystack',
        'bachs',
        'x402',
        'mpp',
        'crypto_usdc'
      ]
    },
    endpoints: {
      catalog: 'https://ourmenuos.online/api/chat',
      orders: 'https://ourmenuos.online/api/orders',
      bookings: 'https://ourmenuos.online/api/bookings',
      ocr: 'https://ourmenuos.online/api/ai/parse-menu',
      mcp_server: 'https://ourmenuos.online/.well-known/mcp.json',
      skills_index: 'https://ourmenuos.online/.well-known/agent-skills/index.json'
    }
  }

  return NextResponse.json(acpConfig, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Vary': 'Accept, Accept-Encoding'
    }
  })
}
