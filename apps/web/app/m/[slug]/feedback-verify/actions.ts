'use server'

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect, @typescript-eslint/ban-ts-comment */
// FIXME: Developer bypassed types/rules. Requires refactoring for true perfection.


import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function verifyFeedbackPin(orgSlug: string, pin: string) {
  const cookieStore = await cookies()
  const attempts = parseInt(cookieStore.get('pin_attempts')?.value || '0')
  
  if (attempts >= 5) {
    return { error: 'Too many failed attempts. Please try again later.' }
  }

  const supabase = await createClient()

  // Find the organization
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single()

  if (!org) return { error: 'Organization not found' }

  // Look for a paid/completed order with this PIN in this org
  // within the last 24 hours to prevent guessing old pins
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .eq('organization_id', org.id)
    .eq('feedback_pin' as any, pin)
    .gte('created_at', yesterday.toISOString())
    .in('status', ['paid', 'completed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!order) {
    cookieStore.set('pin_attempts', (attempts + 1).toString(), { maxAge: 3600 }) // 1 hour lockout after 5 attempts
    return { error: 'Invalid PIN or no eligible order found.' }
  }

  // Success, reset attempts
  cookieStore.set('pin_attempts', '0', { maxAge: 3600 })
  return { orderId: order.id }
}
