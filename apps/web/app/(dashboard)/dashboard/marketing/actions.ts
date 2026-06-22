'use server'



import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy')

export async function sendBroadcastAction(formData: FormData) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const { cookies } = await import('next/headers')
  if ((await cookies()).get('demo_mode')?.value === '1') {
    return { success: true }
  }
  if (!userData?.user) throw new Error('Not authenticated')

  const orgId = formData.get('organization_id') as string
  const subject = formData.get('subject') as string
  const message = formData.get('message') as string

  if (!orgId || !subject || !message) {
    return { error: 'Missing fields' }
  }

  // 1. Verify user is owner or manager
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userData.user.id)
    .single()

  const isOwner = member?.role === 'owner' || member?.role === 'manager'
  
  if (!isOwner) {
    // Check if creator
    const { data: org } = await supabase
      .from('organizations')
      .select('created_by')
      .eq('id', orgId)
      .single()
    if (org?.created_by !== userData.user.id) {
      return { error: 'Not authorized to send broadcasts' }
    }
  }

  // 2. Fetch unique customer emails for this org
  const { data: orders } = await supabase
    .from('orders')
    .select('customer_email')
    .eq('organization_id', orgId)
    .not('customer_email', 'is', null)

  if (!orders || orders.length === 0) {
    return { error: 'No customers found with email addresses.' }
  }

  const uniqueEmails = Array.from(new Set(orders.map(o => o.customer_email).filter(Boolean))) as string[]

  if (uniqueEmails.length === 0) {
    return { error: 'No customers found with email addresses.' }
  }

  // 3. Batch send (Resend limit is 100 per batch call)
  const chunkSize = 100
  let totalSent = 0

  try {
    for (let i = 0; i < uniqueEmails.length; i += chunkSize) {
      const chunk = uniqueEmails.slice(i, i + chunkSize)
      
      const payload = chunk.map(email => ({
        from: 'OurMenu Marketing <onboarding@resend.dev>',
        to: email,
        subject: subject,
        html: `<div style="font-family: sans-serif; padding: 20px;">
                <p style="white-space: pre-wrap;">${message}</p>
                <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eaeaea;" />
                <p style="color: #888; font-size: 12px; text-align: center;">Powered by OurMenu OS</p>
               </div>`
      }))

      const { error: batchError } = await resend.batch.send(payload)
      if (batchError) {
        console.error('Batch error:', batchError)
        return { error: 'Failed to send some emails. Please contact support.' }
      }
      
      totalSent += chunk.length
    }

    revalidatePath('/dashboard/marketing')
    return { success: true, count: totalSent }
  } catch (err: unknown) {
    return { error: (err as Error).message || 'An unknown error occurred.' }
  }
}


