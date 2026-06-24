import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/server'
import DailyReportEmail from '../../../../emails/daily-report-email'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy')

export async function GET(req: Request) {
  // 1. Verify Vercel Cron Secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const adminClient = await createAdminClient()
    
    // 2. Fetch all organizations
    const { data: orgs, error: orgsError } = await adminClient
      .from('organizations')
      .select('id, name, created_by')

    if (orgsError || !orgs) {
      return NextResponse.json({ error: 'Failed to fetch orgs' }, { status: 500 })
    }

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayIso = yesterday.toISOString()

    // 3. Fetch ALL completed/paid orders from the last 24h across ALL orgs in ONE query (O(1))
    // We only need organization_id and total_amount_minor.
    let allOrders: any[] = []
    let hasMore = true
    let page = 0
    const PAGE_SIZE = 1000

    while (hasMore) {
      const { data: ordersBatch, error: ordersError } = await adminClient
        .from('orders')
        .select('organization_id, total_amount_minor')
        .in('status', ['paid', 'completed'])
        .gte('created_at', yesterdayIso)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (ordersError || !ordersBatch) {
        console.error('Error fetching global orders batch:', ordersError)
        hasMore = false
        break
      }

      allOrders = allOrders.concat(ordersBatch)
      
      if (ordersBatch.length < PAGE_SIZE) {
        hasMore = false
      } else {
        page++
      }
    }

    // 4. Group orders by organization in-memory
    const orgStats: Record<string, { totalOrders: number; totalRevenueMinor: number }> = {}
    for (const order of allOrders) {
      if (!orgStats[order.organization_id]) {
        orgStats[order.organization_id] = { totalOrders: 0, totalRevenueMinor: 0 }
      }
      orgStats[order.organization_id].totalOrders += 1
      orgStats[order.organization_id].totalRevenueMinor += (order.total_amount_minor || 0)
    }

    // 5. Fetch all users in one go to map created_by to emails
    const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers()
    if (usersError) {
      console.error('Error fetching users:', usersError)
    }
    const userEmailMap = new Map<string, string>()
    usersData?.users.forEach(u => {
      if (u.email) userEmailMap.set(u.id, u.email)
    })

    // 6. Build email dispatch promises (concurrent dispatch)
    const emailPromises = orgs.map(async (org) => {
      const stats = orgStats[org.id]
      if (!stats || stats.totalOrders === 0 || !org.created_by) return null

      const ownerEmail = userEmailMap.get(org.created_by)
      if (!ownerEmail) return null

      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'OurMenu Reports <noreply@ourmenuos.online>',
        to: ownerEmail,
        subject: `Daily Sales Report: ${org.name}`,
        react: DailyReportEmail({
          organizationName: org.name,
          totalOrders: stats.totalOrders,
          totalRevenueMinor: stats.totalRevenueMinor,
          dateString: new Date().toLocaleDateString()
        }) as React.ReactElement
      })

      if (emailError) {
        console.error(`Failed to send report for ${org.name}:`, emailError)
        return null
      }
      return { org: org.name, sentId: emailData?.id }
    })

    // 7. Dispatch all concurrently
    const settled = await Promise.allSettled(emailPromises)
    const results = settled
      .filter((res): res is PromiseFulfilledResult<any> => res.status === 'fulfilled' && res.value !== null)
      .map(res => res.value)

    return NextResponse.json({ status: 'success', sent: results.length, details: results })
  } catch (err: unknown) {
    console.error('Cron Error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
