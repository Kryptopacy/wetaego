import { NextResponse, type NextRequest } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      status: 'active',
      protocol: 'x402',
      version: '1.0',
      facilitator: 'https://ourmenuos.online/api/x402',
      wallet: '0x87A8f8303e339F091F8402D3b934789518d6e9d6',
      network: 'base',
      currency: 'USDC',
      networks: ['base', 'solana', 'polygon', 'ethereum'],
      tokens: ['USDC', 'USDT', 'SOL', 'ETH']
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'X-402-Payment-Required': 'true',
        'X-402-Facilitator': 'https://ourmenuos.online/api/x402',
        'X-402-Address': '0x87A8f8303e339F091F8402D3b934789518d6e9d6',
        'X-402-Network': 'base',
        'X-402-Token': 'USDC',
        'X-402-Amount': '0.05',
        'WWW-Authenticate': 'X402 token="USDC", network="base", address="0x87A8f8303e339F091F8402D3b934789518d6e9d6", amount="0.05", facilitator="https://ourmenuos.online/api/x402"',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'Vary': 'Accept, Accept-Encoding'
      }
    }
  )
}

export async function POST(request: NextRequest) {
  const authPaymentHeader = request.headers.get('x-payment') || request.headers.get('x402-payment') || request.headers.get('authorization')
  
  if (!authPaymentHeader || !authPaymentHeader.startsWith('X402') && !authPaymentHeader.startsWith('0x') && !authPaymentHeader.startsWith('tx_')) {
    return NextResponse.json(
      {
        error: 'Payment Required',
        message: 'This resource requires agent-native settlement via the x402 protocol.',
        x402: {
          version: '1.0',
          facilitator: 'https://ourmenuos.online/api/x402',
          wallet: '0x87A8f8303e339F091F8402D3b934789518d6e9d6',
          network: 'base',
          currency: 'USDC',
          amount: 0.05
        },
        accept: [
          {
            network: 'base',
            token: 'USDC',
            amount: '0.05',
            receiver: '0x87A8f8303e339F091F8402D3b934789518d6e9d6'
          },
          {
            network: 'solana',
            token: 'USDC',
            amount: '0.05',
            receiver: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
          }
        ]
      },
      {
        status: 402,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Payment-Required': 'true',
          'X-402-Payment-Required': 'true',
          'X-402-Facilitator': 'https://ourmenuos.online/api/x402',
          'X-402-Address': '0x87A8f8303e339F091F8402D3b934789518d6e9d6',
          'X-402-Network': 'base',
          'X-402-Token': 'USDC',
          'X-402-Amount': '0.05',
          'WWW-Authenticate': 'X402 token="USDC", network="base", address="0x87A8f8303e339F091F8402D3b934789518d6e9d6", amount="0.05", facilitator="https://ourmenuos.online/api/x402"',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }

  return NextResponse.json({
    status: 'settled',
    payment_hash: authPaymentHeader,
    timestamp: new Date().toISOString()
  })
}
