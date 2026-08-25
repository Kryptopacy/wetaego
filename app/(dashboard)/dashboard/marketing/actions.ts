'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { authActionClient } from '@/lib/safe-action'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { sendMarketingBroadcastEmail } from '@/lib/notifications/email'

export const sendBroadcastAction = authActionClient
  .schema(zfd.formData(z.object({
    organization_id: z.string(),
    subject: z.string(),
    message: z.string()
  })))
  .action(async ({ parsedInput: { organization_id, subject, message }, ctx: { user } }) => {
    const supabase = await createClient()

    const { cookies } = await import('next/headers')
    if ((await cookies()).get('demo_mode')?.value === '1') {
      return { success: true, count: 0 }
    }

    // 1. Verify user is owner or manager
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .single()

    const isAuthorized = member?.role === 'owner' || member?.role === 'manager'
    
    const { data: org } = await supabase
      .from('organizations')
      .select('name, logo_url, slug, created_by')
      .eq('id', organization_id)
      .single()

    if (!isAuthorized && org?.created_by !== user.id) {
      throw new Error('Not authorized to send broadcasts')
    }

    const businessName = org?.name || 'OurMenu OS Partner'
    const logoUrl = org?.logo_url || null
    const slug = org?.slug || null

    // 2. Fetch unique customer emails from profiles that explicitly opted in
    const { data: profiles, error: profileError } = await supabase
      .from('customer_profiles')
      .select('email')
      .eq('organization_id', organization_id)
      .eq('marketing_opt_in', true)
      .not('email', 'is', null)

    if (profileError || !profiles || profiles.length === 0) {
      throw new Error('No customers found who opted into marketing.')
    }

    const uniqueEmails = Array.from(new Set(profiles.map(p => p.email).filter(Boolean))) as string[]

    if (uniqueEmails.length === 0) {
      throw new Error('No customers found who opted into marketing.')
    }

    // 3. Batch send decoupled via after()
    after(async () => {
      for (const email of uniqueEmails) {
        try {
          await sendMarketingBroadcastEmail({
            toEmail: email,
            businessName,
            logoUrl,
            subject,
            message,
            locationSlug: slug,
          })
        } catch (e) {
          console.error(`Failed to send marketing email to ${email}:`, e)
        }
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    })

    revalidatePath('/dashboard/marketing')
    return { success: true, count: uniqueEmails.length }
  })
