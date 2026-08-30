import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'WETAEGO API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      features: {
        chat: 'operational',
        menu_ocr: 'operational',
        live_gemini: 'operational',
        escpos_printing: 'operational',
        payment_gateways: ['paystack', 'bachs']
      }
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      }
    }
  )
}
