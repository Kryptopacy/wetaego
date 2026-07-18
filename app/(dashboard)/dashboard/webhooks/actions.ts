'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

export async function createWebhook(locationId: string, url: string, eventsSubscribed: string[]) {
  const supabase = await createClient()
  
  // Generate a cryptographically secure random secret
  const secret = 'whsec_' + crypto.randomBytes(32).toString('hex')

  const { data, error } = await supabase
    .from('location_webhooks')
    .insert({
      location_id: locationId,
      url,
      events_subscribed: eventsSubscribed,
      secret,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating webhook:', error)
    throw new Error('Failed to create webhook')
  }

  revalidatePath('/dashboard/webhooks')
  return data
}

export async function toggleWebhookStatus(webhookId: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('location_webhooks')
    .update({ is_active: isActive })
    .eq('id', webhookId)

  if (error) {
    console.error('Error toggling webhook status:', error)
    throw new Error('Failed to update webhook')
  }

  revalidatePath('/dashboard/webhooks')
}

export async function rotateWebhookSecret(webhookId: string) {
  const supabase = await createClient()
  
  const secret = 'whsec_' + crypto.randomBytes(32).toString('hex')

  const { error } = await supabase
    .from('location_webhooks')
    .update({ secret })
    .eq('id', webhookId)

  if (error) {
    console.error('Error rotating webhook secret:', error)
    throw new Error('Failed to rotate webhook secret')
  }

  revalidatePath('/dashboard/webhooks')
}

export async function deleteWebhook(webhookId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('location_webhooks')
    .delete()
    .eq('id', webhookId)

  if (error) {
    console.error('Error deleting webhook:', error)
    throw new Error('Failed to delete webhook')
  }

  revalidatePath('/dashboard/webhooks')
}
