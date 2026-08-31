import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const DEFAULT_WALLET = '0x87A8f8303e339F091F8402D3b934789518d6e9d6'
const DEFAULT_SOLANA_WALLET = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'

function getEVMWallet() {
  return process.env.X402_TREASURY_WALLET || process.env.NEXT_PUBLIC_TREASURY_WALLET || DEFAULT_WALLET
}

function getSolanaWallet() {
  return process.env.X402_SOLANA_TREASURY_WALLET || process.env.NEXT_PUBLIC_SOLANA_TREASURY_WALLET || DEFAULT_SOLANA_WALLET
}

export async function GET() {
  const evmWallet = getEVMWallet()
  const solanaWallet = getSolanaWallet()

  const metadata = {
    protocol: 'x402',
    version: '1.0',
    name: 'OurMenu OS x402 Payment Gateway',
    description: 'Agent-native HTTP 402 micropayment protocol supporting instant automated agent settlement for dining orders, deposits, and AI credits.',
    facilitator: 'https://ourmenuos.online/api/x402',
    x402: {
      version: '1.0',
      facilitator: 'https://ourmenuos.online/api/x402',
      wallet: evmWallet,
      network: 'base',
      currency: 'USDC'
    },
    supported_networks: ['base', 'solana', 'polygon', 'ethereum'],
    supported_tokens: ['USDC', 'USDT', 'SOL', 'ETH'],
    receiver_addresses: {
      evm: evmWallet,
      solana: solanaWallet
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

  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Payment, X402-Payment',
    'X-402-Payment-Required': 'true',
    'X-402-Facilitator': 'https://ourmenuos.online/api/x402',
    'X-402-Address': evmWallet,
    'X-402-Network': 'base',
    'X-402-Token': 'USDC',
    'X-402-Amount': '0.05',
    'WWW-Authenticate': `X402 token="USDC", network="base", address="${evmWallet}", amount="0.05", facilitator="https://ourmenuos.online/api/x402"`,
    'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    'Vary': 'Accept, Accept-Encoding'
  }

  return NextResponse.json(metadata, {
    status: 200,
    headers
  })
}

export async function OPTIONS() {
  const evmWallet = getEVMWallet()
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Payment, X402-Payment',
      'X-402-Address': evmWallet
    }
  })
}
