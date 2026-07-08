import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { IouReminderEmail } from '@/components/emails/IouReminderEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

// This route should be secured by Vercel Cron.
// For testing locally, you can hit it manually, but in prod Vercel will send an auth header.
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    // In production, enforce VERCEL_CRON_SECRET
    if (
      process.env.NODE_ENV === 'production' &&
      authHeader !== `Bearer ${process.env.VERCEL_CRON_SECRET}`
    ) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const supabase = await createAdminClient()

    // 1. Fetch all enabled IOU settings
    const { data: orgSettings, error: settingsError } = await supabase
      .from('iou_settings')
      .select('organization_id, reminder_frequency_days, minimum_balance_to_remind_minor, minimum_repayment_percentage, organizations(name, slug)')
      .eq('is_enabled', true)

    if (settingsError) {
       
      console.error('Error fetching IOU settings:', settingsError)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    if (!orgSettings || orgSettings.length === 0) {
      return NextResponse.json({ message: 'No enabled IOU settings found.' })
    }

    let emailsSent = 0

    // 2. Iterate through organizations and find customers who need reminders
    for (const settings of orgSettings) {
      const orgId = settings.organization_id
      const minBalance = settings.minimum_balance_to_remind_minor
      const freqDays = settings.reminder_frequency_days
      const orgName = (settings.organizations as Record<string, unknown>).name as string
      const orgSlug = (settings.organizations as Record<string, unknown>).slug as string

      // Customers whose credit balance exceeds minimum
      const { data: customers, error: customersError } = await supabase
        .from('customer_profiles')
        .select('id, email, credit_balance_minor, last_iou_reminder_sent_at')
        .eq('organization_id', orgId)
        .gt('credit_balance_minor', minBalance || 0)

      if (customersError) {
         
        console.error(`Error fetching customers for org ${orgId}:`, customersError)
        continue
      }

      if (!customers) continue

      const now = new Date()

      for (const customer of customers) {
        // Skip if no email
        if (!customer.email) continue

        let shouldSend = false

        if (!customer.last_iou_reminder_sent_at) {
          shouldSend = true
        } else {
          const lastSent = new Date(customer.last_iou_reminder_sent_at)
          const diffTime = Math.abs(now.getTime() - lastSent.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          if (diffDays >= (freqDays || 7)) {
            shouldSend = true
          }
        }

        if (shouldSend) {
          // Send email
          const paymentLink = `https://ourmenuos.online/m/${orgSlug}/iou/${customer.id}`

          try {
            await resend.emails.send({
              from: 'OurMenu IOU <reminder@ourmenuos.online>',
              to: customer.email,
              subject: `Action Required: Outstanding IOU Balance at ${orgName}`,
              react: IouReminderEmail({
                customerName: 'Customer',
                organizationName: orgName,
                balanceDueMinor: customer.credit_balance_minor || 0,
                minimumRepaymentPercentage: settings.minimum_repayment_percentage || 100,
                paymentLink,
              }),
            })

            // Update last_iou_reminder_sent_at
            await supabase
              .from('customer_profiles')
              .update({ last_iou_reminder_sent_at: new Date().toISOString() })
              .eq('id', customer.id)

            emailsSent++
          } catch (e) {
             
            console.error(`Failed to send email to ${customer.email}:`, e)
          }
        }
      }
    }

    return NextResponse.json({ success: true, emailsSent })
  } catch (err) {
     
    console.error('Unhandled Cron Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
