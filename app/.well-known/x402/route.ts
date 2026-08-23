import { NextResponse } from 'next/server'

const x402Config = {
  x402: {
    version: '1.0',
    facilitator: 'https://ourmenuos.online/api/x402',
    wallet: '0x87A8f8303e339F091F8402D3b934789518d6e9d6',
    network: 'base',
    currency: 'USDC'
  },
  version: '1.0',
  name: 'OurMenu OS x402 Payment Gateway',
  description: 'Agent-native HTTP 402 micropayment protocol supporting instant automated agent settlement for dining orders, deposits, and AI credits.',
  facilitator: 'https://ourmenuos.online/api/x402',
  supported_networks: ['base', 'solana', 'polygon', 'ethereum'],
  supported_tokens: ['USDC', 'USDT', 'SOL', 'ETH'],
  receiver_addresses: {
    evm: '0x87A8f8303e339F091F8402D3b934789518d6e9d6',
    solana: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
  },
  payable_endpoints: [
    {
      path: '/api/orders',
      method: 'POST',
      pricing: {
        model: 'dynamic_order_total',
        currency: 'USDC'
      }
    },
    {
      path: '/api/ai/live-token',
      method: 'POST',
      pricing: {
        model: 'fixed',
        amount: 0.05,
        currency: 'USDC'
      }
    }
  ]
}

export async function GET() {
  return NextResponse.json(x402Config, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'X-402-Payment-Required': 'true',
      'X-402-Facilitator': 'https://ourmenuos.online/api/x402',
      'WWW-Authenticate': 'X402 token="USDC", network="base", address="0x87A8f8303e339F091F8402D3b934789518d6e9d6", amount="0.05", facilitator="https://ourmenuos.online/api/x402"',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Vary': 'Accept, Accept-Encoding'
    }
  })
}
