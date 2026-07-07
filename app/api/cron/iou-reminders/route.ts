import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { sendWhatsAppMessage } from '@/lib/notifications/termii'

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendEmailReminder(email: string, subject: string, text: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Resend key absent. Cannot send email.')
    return false
  }

  try {
    await resend.emails.send({
      from: 'OurMenu <noreply@ourmenu.com>',
      to: email,
      subject,
      text
    })
    return true
  } catch (error) {
    console.error('Failed to send email', error)
    return false
  }
}

export async function GET(request: Request) {
  try {
    // 1. Fetch all customers with an active IOU
    const { data: customers, error } = await supabase
      .from('customer_profiles')
      .select('*, organizations(name, metadata)')
      .gt('credit_balance_minor', 0)

    if (error) throw error

    let remindersSent = 0

    for (const customer of customers || []) {
      const orgMetadata = customer.organizations?.metadata as any || {}
      const frequency = orgMetadata.iou_reminder_frequency || 'weekly'
      const minInstallmentPct = orgMetadata.iou_min_installment_pct || 100

      // 2. Check if it's time to send a reminder based on frequency
      if (customer.last_iou_reminder_sent_at) {
        const lastSent = new Date(customer.last_iou_reminder_sent_at)
        const now = new Date()
        const daysSinceLastReminder = (now.getTime() - lastSent.getTime()) / (1000 * 3600 * 24)

        if (frequency === 'daily' && daysSinceLastReminder < 1) continue
        if (frequency === 'weekly' && daysSinceLastReminder < 7) continue
        if (frequency === 'monthly' && daysSinceLastReminder < 30) continue
      }

      // 3. Prepare the reminder message
      const balance = (customer.credit_balance_minor / 100).toFixed(2)
      const minPayment = ((customer.credit_balance_minor / 100) * (minInstallmentPct / 100)).toFixed(2)
      
      const message = `Hello, this is a gentle reminder from ${customer.organizations?.name} regarding your open tab. ` +
        `Your current outstanding balance is ${balance}. ` +
        (minInstallmentPct < 100 ? `You can pay in installments. The minimum accepted payment is ${minPayment} (${minInstallmentPct}%). ` : '') +
        `Please settle your tab at your earliest convenience.`

      // 4. Try WhatsApp first if phone exists
      let success = false
      if (customer.phone_number) {
        success = await sendWhatsAppMessage(customer.phone_number, message)
      }

      // 5. Fallback to Email if WhatsApp failed or no phone exists
      if (!success && customer.email) {
        success = await sendEmailReminder(customer.email, `Tab Reminder from ${customer.organizations?.name}`, message)
      }

      // 6. Update last_iou_reminder_sent_at if successful
      if (success) {
        await supabase
          .from('customer_profiles')
          .update({ last_iou_reminder_sent_at: new Date().toISOString() })
          .eq('id', customer.id)
        
        remindersSent++
      }
    }

    return NextResponse.json({ success: true, remindersSent })
  } catch (error: any) {
    console.error('IOU Reminder Cron Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
