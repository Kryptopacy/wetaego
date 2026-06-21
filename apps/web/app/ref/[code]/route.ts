import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const code = (await params).code
  
  // Set a cookie that expires in 30 days
  const response = NextResponse.redirect(new URL('/login', request.url))
  response.cookies.set('ourmenu_ref', code, {
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
  
  return response
}
