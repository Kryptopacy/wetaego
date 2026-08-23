import { NextResponse } from 'next/server'

export async function GET() {
  const mppConfig = {
    version: '1.0',
    name: 'OurMenu OS Machine Payment Protocol',
    description: 'Machine Payment Protocol (MPP) configuration for automated AI agent checkout, live token minting, and deposit settlements.',
    facilitator: 'https://ourmenuos.online/api/x402',
    supported_methods: ['crypto', 'paystack_subaccount', 'tempo', 'card'],
    currencies_supported: ['NGN', 'USD', 'USDC', 'USDT', 'SOL'],
    discovery_url: 'https://ourmenuos.online/openapi.json',
    documentation: 'https://ourmenuos.online/docs'
  }

  return NextResponse.json(mppConfig, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Vary': 'Accept, Accept-Encoding'
    }
  })
}
