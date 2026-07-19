import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendTrialExpirationReminder } from '@/lib/notifications/email'

export const maxDuration = 60; // Max execution time

export async function GET(req: Request) {
  // Validate Vercel cron request (optional depending on settings, but good practice)
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = await createAdminClient()

  try {
    const today = new Date()
    // Find organizations on trial
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('id, name, created_by, trial_ends_at')
      .eq('subscription_status', 'trialing')
      .not('trial_ends_at', 'is', null)

    if (error) throw error
    if (!orgs) return NextResponse.json({ sent: 0 })

    let sentCount = 0

    for (const org of orgs) {
      if (!org.trial_ends_at) continue;

      const trialEnd = new Date(org.trial_ends_at)
      const diffTime = trialEnd.getTime() - today.getTime()
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      // Send reminders at exactly 3 days, 1 day, and 0 days
      if ([3, 1, 0].includes(daysLeft)) {
        // Fetch user email
        const { data: user } = await supabase.auth.admin.getUserById(org.created_by)
        if (user?.user?.email) {
          const email = user.user.email
          const name = user.user.user_metadata?.full_name
          const success = await sendTrialExpirationReminder(email, Math.max(0, daysLeft), name)
          if (success) sentCount++
        }
      }
    }

    return NextResponse.json({ success: true, sent: sentCount })
  } catch (error: unknown) {
    console.error('Failed to process trial reminders cron:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
