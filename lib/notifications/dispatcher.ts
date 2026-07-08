import { createClient } from '@supabase/supabase-js'
import { sendPushToOrg } from './push'
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

    // 1.5 Save to In-App Notifications
    const { error: staffNotifError } = await (supabaseAdmin as any)
      .from('staff_notifications')
      .insert({
        organization_id: orgId,
        title: payload.title,
        body: payload.body,
        action_url: payload.url || null
      })
      
    if (staffNotifError) {
      console.error('Failed to save staff notification:', staffNotifError)
    }

    // 2. Send Push Notification
    await sendPushToOrg(orgId, {
      title: payload.title,
      body: payload.body,
      url: payload.url,
      tag: payload.tag,
      requireInteraction: true,
    }).catch(err => {
      console.error('Push error in dispatcher:', err)
      console.error(err?.stack || err)
    })

    // 3. Send Email
    const { data: members } = await supabaseAdmin
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId)

    if (members && members.length > 0) {
      await Promise.all(
        members.map(async (member) => {
          try {
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(member.user_id)
            const email = userData?.user?.email
            if (email) {
              const emailSent = await sendEmailNotification(
                email,
                `[${location.name}] ${payload.title}`,
                payload.body + (payload.url ? `\n\nView details: ${process.env.NEXT_PUBLIC_SITE_URL}${payload.url}` : '')
              )
              if (!emailSent) {
                 console.error(`Email delivery failed for ${email}`);
              }
            }
          } catch (e) {
            console.error(`Failed to get email or send email for user ${member.user_id}:`, e)
          }
        })
      )
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

export async function notifyCustomer(
  orderId: string,
  payload: {
    title: string;
    body: string;
    url?: string;
  }
) {
  try {
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select(`
        customer_email, 
        customer_phone, 
        tracking_code, 
        locations!orders_location_id_fkey(name, organization_id),
        organizations!orders_organization_id_fkey(slug)
      `)
      .eq('id', orderId)
      .single()

    if (!order) return

    // @ts-expect-error - Postgrest relations typing can be tricky
    const locationName = order.locations?.name || 'Our Store'
    // @ts-expect-error
    const orgSlug = order.organizations?.slug
    
    const trackUrl = payload.url || (orgSlug && order.tracking_code ? `${process.env.NEXT_PUBLIC_SITE_URL}/m/${orgSlug}/track?code=${order.tracking_code}` : undefined)
    const fullBody = payload.body + (trackUrl ? `\n\nTrack your order here: ${trackUrl}` : '')

    // 1. Send Email
    if (order.customer_email) {
      await sendEmailNotification(
        order.customer_email,
        `[${locationName}] ${payload.title}`,
        fullBody
      ).catch(err => console.error('Email notify error:', err))
    }

    // 2. Send SMS/WhatsApp via Termii
    if (order.customer_phone) {
      await sendWhatsAppMessage(
        order.customer_phone, 
        `*${locationName}*\n${payload.title}\n\n${payload.body}${trackUrl ? `\nTrack: ${trackUrl}` : ''}`
      ).catch(err => console.error('Termii notify error:', err))
    }

    // 3. Intercom Sync
    // Without an active Intercom API key, we log the intent. 
    // Usually this requires pushing an event to Intercom's REST API: POST https://api.intercom.io/events
    console.log(`[Intercom Sync] Pushing milestone event '${payload.title}' to customer: ${order.customer_email || order.customer_phone}`)

  } catch (error) {
    console.error('Error dispatching customer notifications:', error)
  }
}
