'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'

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
    const { data: org } = await supabase
      .from('organizations')
      .select('created_by')
      .eq('id', orgId)
      .single()
    if (org?.created_by !== userData.user.id) {
      return { error: 'Not authorized to send broadcasts' }
    }
  }

  // 2. Fetch unique customer emails from profiles that explicitly opted in
  const { data: profiles, error: profileError } = await supabase
    .from('customer_profiles')
    .select('email')
    .eq('organization_id', orgId)
    .eq('marketing_opt_in', true)
    .not('email', 'is', null)

  if (profileError || !profiles || profiles.length === 0) {
    return { error: 'No customers found who opted into marketing.' }
  }

  const uniqueEmails = profiles.map(p => p.email).filter(Boolean) as string[]

  if (uniqueEmails.length === 0) {
    return { error: 'No customers found who opted into marketing.' }
  }

  // Sanitise user-supplied content — escape HTML special chars to prevent injection
  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')

  const safeSubject = escapeHtml(subject)
  const safeMessage = escapeHtml(message)

  // 3. Batch send (Resend limit is 100 per batch call) decoupled via after()
  after(async () => {
    const chunkSize = 100
    for (let i = 0; i < uniqueEmails.length; i += chunkSize) {
      const chunk = uniqueEmails.slice(i, i + chunkSize)
      
      const payload = chunk.map(email => ({
        from: 'OurMenu Marketing <onboarding@resend.dev>',
        to: email,
        subject: safeSubject,
        html: `<div style="font-family: sans-serif; padding: 20px;">
                <p style="white-space: pre-wrap;">${safeMessage}</p>
                <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eaeaea;" />
                <p style="color: #888; font-size: 12px; text-align: center;">Powered by OurMenu OS</p>
               </div>`
      }))

      try {
        const { error: batchError } = await resend.batch.send(payload)
        if (batchError) {
          console.error('Batch error:', batchError)
        }
      } catch (e) {
        console.error('Fatal batch send error:', e)
      }
      
      // Delay slightly between batches to respect rate limits if needed
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  })

  revalidatePath('/dashboard/marketing')
  return { success: true, count: uniqueEmails.length }
}
