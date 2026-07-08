'use server'

import { createClient } from '@/lib/supabase/server'
import { sendEmailNotification } from '@/lib/notifications/email'
import { sendWhatsAppMessage } from '@/lib/notifications/termii'

export async function sendBroadcastAction(
  organizationId: string, 
  channels: string[], 
  subject: string, 
  message: string
) {
  const supabase = await createClient()

  // Verify auth and permissions
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('Unauthorized')

  // Fetch opted-in customers
  const { data: customers } = await supabase
    .from('customer_profiles')
    .select('email, phone_number')
    .eq('organization_id', organizationId)
    .eq('marketing_opt_in', true)

  if (!customers || customers.length === 0) {
    return { success: true, sentCount: 0 }
  }

  let sentCount = 0

  await Promise.all(
    customers.map(async (customer) => {
      let sent = false
      // Infer name from email if needed
      const name = customer.email ? customer.email.split('@')[0] : 'Valued Customer'

      if (channels.includes('email') && customer.email) {
        const success = await sendEmailNotification(
          customer.email, 
          subject, 
          message.replace('{{name}}', name)
        )
        if (success) sent = true
      }

      if (channels.includes('whatsapp') && customer.phone_number) {
        const success = await sendWhatsAppMessage(
          customer.phone_number,
          `*${subject}*\n\n${message.replace('{{name}}', name)}`
        ).then(() => true).catch(() => false)
        if (success) sent = true
      }

      if (sent) sentCount++
    })
  )

  return { success: true, sentCount }
}
