/* eslint-disable @typescript-eslint/no-unused-vars */
// TODO: Developer bypassed types/rules. Requires refactoring for true perfection.
import { createClient } from '@supabase/supabase-js'
import { sendPushToOrg, PushPayload } from './push'
import { sendEmailNotification } from './email'
import { sendWhatsAppMessage } from './termii'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function notifyBusiness(
  locationId: string,
  payload: {
    title: string;
    body: string;
    url?: string;
    tag?: string;
  }
) {
  try {
    // 1. Get location details (for organization_id and whatsapp_number)
    const { data: location } = await supabaseAdmin
      .from('locations')
      .select('organization_id, whatsapp_number, phone, name')
      .eq('id', locationId)
      .single()

    if (!location) {
      console.error('Location not found for notifications:', locationId)
      return
    }

    const orgId = location.organization_id

    // 2. Send Push Notification
    await sendPushToOrg(orgId, {
      title: payload.title,
      body: payload.body,
      url: payload.url,
      tag: payload.tag,
      requireInteraction: true,
    }).catch(err => console.error('Push error:', err))

    // 3. Send Email
    const { data: members } = await supabaseAdmin
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId)

    if (members && members.length > 0) {
      for (const member of members) {
        try {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(member.user_id)
          const email = userData?.user?.email
          if (email) {
            await sendEmailNotification(
              email,
              `[${location.name}] ${payload.title}`,
              payload.body + (payload.url ? `\n\nView details: ${process.env.NEXT_PUBLIC_SITE_URL}${payload.url}` : '')
            )
          }
        } catch (e) {
          console.error(`Failed to get email for user ${member.user_id}`, e)
        }
      }
    }

    // 4. Send WhatsApp via Termii
    const phone = location.whatsapp_number || location.phone
    if (phone) {
      await sendWhatsAppMessage(phone, `*${location.name}*\n${payload.title}\n\n${payload.body}`).catch(err => console.error('Termii error:', err))
    }
  } catch (error) {
    console.error('Error dispatching notifications:', error)
  }
}
