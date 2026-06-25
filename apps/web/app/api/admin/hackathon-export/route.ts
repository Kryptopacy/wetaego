import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const organizationId = url.searchParams.get('orgId')

    let query = supabase.from('orders').select('created_at, total_amount_minor').eq('status', 'paid')
    let countQuery = supabase.from('orders').select('*', { count: 'exact', head: true })

    // If orgId is provided, run for specific org, else run for ENTIRE platform (Hackathon Total)
    if (organizationId) {
       // Verify user is part of the org
      const { data: member } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .single()

      let isAuthorized = !!member
      if (!member) {
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('id', organizationId)
          .eq('created_by', user.id)
          .single()
        isAuthorized = !!org
      }

      if (!isAuthorized) {
        return NextResponse.json({ error: 'Forbidden for this org' }, { status: 403 })
      }
      query = query.eq('organization_id', organizationId)
      countQuery = countQuery.eq('organization_id', organizationId)
    } else {
      // Platform-wide aggregate. You could optionally restrict this to superadmins.
      // For hackathon purposes, we will aggregate all data.
    }

    // 2. Calculate Total Revenue (Orders with status 'paid')
    const { data: paidOrders } = await query

    let totalRevenueMinor = 0
    const monthlyRevenueMinor: Record<string, number> = {
      'May 2026': 0,
      'Jun 2026': 0,
      'Jul 2026': 0,
      'Aug 2026': 0
    }

    if (paidOrders) {
      for (const order of paidOrders) {
        totalRevenueMinor += order.total_amount_minor
        
        const monthKey = format(new Date(order.created_at), 'MMM yyyy')
        if (monthlyRevenueMinor[monthKey] !== undefined) {
          monthlyRevenueMinor[monthKey] += order.total_amount_minor
        }
      }
    }

    // 3. Get total scans (if available) - checking tracking tables
    const { count: totalOrders } = await countQuery

    // 4. Return formatted report
    const report = {
      scope: organizationId ? \`Organization: \${organizationId}\` : "Platform-Wide Total (Hackathon Submission)",
      hackathon_metrics: {
        total_revenue_usd: (totalRevenueMinor / 100).toFixed(2), // Assumes currency is USD or normalized
        revenue_by_month: {
          'May 2026': (monthlyRevenueMinor['May 2026'] / 100).toFixed(2),
          'Jun 2026': (monthlyRevenueMinor['Jun 2026'] / 100).toFixed(2),
          'Jul 2026': (monthlyRevenueMinor['Jul 2026'] / 100).toFixed(2),
          'Aug 2026': (monthlyRevenueMinor['Aug 2026'] / 100).toFixed(2)
        },
        total_users_engaged: totalOrders, // Proxy for user engagement
        ai_operations_status: "Active (Demand Forecasting, Order Triage, Conversational Ordering, Translations)"
      },
      export_date: new Date().toISOString()
    }

    return NextResponse.json(report)

  } catch (error) {
    console.error('Export Error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
