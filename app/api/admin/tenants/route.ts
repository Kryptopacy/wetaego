import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/utils/admin'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()

    // Ensure the user is the admin
    const { data: userData } = await supabase.auth.getUser()
    if (!isAdminEmail(userData?.user?.email)) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const adminClient = await createAdminClient()

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = adminClient
      .from('organizations')
      .select('id, name, subscription_plan, subscription_status, purchased_credits, created_at, slug, status', { count: 'exact' })
      
    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`)
    }

    query = query.order('created_at', { ascending: false }).range(from, to)

    const { data, count, error } = await query

    if (error) {
      console.error('Error fetching tenants:', error)
      return new NextResponse('Failed to fetch tenants', { status: 500 })
    }

    return NextResponse.json({
      data,
      count,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    })
  } catch (error) {
    console.error('Admin tenants error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
