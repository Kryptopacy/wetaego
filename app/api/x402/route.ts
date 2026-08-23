import { NextResponse, type NextRequest } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'active',
    protocol: 'x402',
    version: '1.0',
    facilitator: 'https://ourmenuos.online/api/x402',
    networks: ['base', 'solana', 'polygon'],
    tokens: ['USDC', 'USDT', 'SOL']
  })
}

export async function POST(request: NextRequest) {
  const authPaymentHeader = request.headers.get('x-payment') || request.headers.get('x402-payment')
  
  if (!authPaymentHeader) {
    return NextResponse.json(
      {
        error: 'Payment Required',
        message: 'This resource requires agent-native settlement via the x402 protocol.',
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
          'X-Payment-Required': 'true',
          'X-Payment-Facilitator': 'https://ourmenuos.online/api/x402',
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
