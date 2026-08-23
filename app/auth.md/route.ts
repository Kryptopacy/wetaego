import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'auth.md')
    const content = fs.readFileSync(filePath, 'utf8')
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'Vary': 'Accept, Accept-Encoding'
      }
    })
  } catch {
    return new NextResponse('# OurMenu OS Agent Authentication Guide\n\nSee https://ourmenuos.online/docs', {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}
