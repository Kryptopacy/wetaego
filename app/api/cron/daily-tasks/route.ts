import { NextResponse } from 'next/server'
import { GET as runDailyReports } from '../daily-report/route'
import { GET as runIouReminders } from '../iou-reminders/route'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    
    // We check VERCEL_CRON_SECRET globally for this master route
    if (
      process.env.NODE_ENV === 'production' &&
      authHeader !== `Bearer ${process.env.VERCEL_CRON_SECRET}` &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Since we manually validated here, we want the sub-routes to pass their own auth checks
    // We can inject a mock request with the correct headers for the sub-routes to succeed.
    // Or just run them with the original req (if they use the same CRON_SECRET).
    // Let's create a cloned request with both secrets depending on what they expect
    
    const reqForReports = new Request(req.url, {
      headers: new Headers({
        authorization: `Bearer ${process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET}`,
      }),
    })

    const reqForIou = new Request(req.url, {
      headers: new Headers({
        authorization: `Bearer ${process.env.VERCEL_CRON_SECRET || process.env.CRON_SECRET}`,
      }),
    })

    // eslint-disable-next-line no-console
    console.log('Running daily-report cron task...')
    await runDailyReports(reqForReports)

    // eslint-disable-next-line no-console
    console.log('Running iou-reminders cron task...')
    await runIouReminders(reqForIou)

    return NextResponse.json({ status: 'success', message: 'Daily tasks completed' })
  } catch (error) {
     
    console.error('Error in daily tasks cron:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
