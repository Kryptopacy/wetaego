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

    const results = []

    // 3. For each org, fetch their orders from the last 24h
    for (const org of orgs) {
      if (!org.created_by) continue

      const { data: orders } = await adminClient
        .from('orders')
        .select('total_amount_minor, status')
        .eq('organization_id', org.id)
        .eq('status', 'paid')
        .gte('created_at', yesterdayIso)

      if (!orders || orders.length === 0) continue

      const totalRevenueMinor = orders.reduce((sum, order) => sum + (order.total_amount_minor || 0), 0)
      const totalOrders = orders.length

      // Fetch owner email
      const { data: ownerUser } = await adminClient.auth.admin.getUserById(org.created_by)
      const ownerEmail = ownerUser?.user?.email

      if (ownerEmail) {
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'OurMenu Reports <onboarding@resend.dev>',
          to: ownerEmail,
          subject: `Daily Sales Report: ${org.name}`,
          react: DailyReportEmail({
            organizationName: org.name,
            totalOrders,
            totalRevenueMinor,
            dateString: new Date().toLocaleDateString()
          }) as React.ReactElement
        })

        if (emailError) {
          console.error(`Failed to send report for ${org.name}:`, emailError)
        } else {
          results.push({ org: org.name, sentId: emailData?.id })
        }
      }
    }

    return NextResponse.json({ status: 'success', sent: results.length, details: results })
  } catch (err: any) {
    console.error('Cron Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
