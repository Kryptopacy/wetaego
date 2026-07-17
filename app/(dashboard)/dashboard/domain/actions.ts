'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import { authActionClient } from '@/lib/safe-action'

export const addCustomDomain = authActionClient
  .schema(zfd.formData({
    hostname: zfd.text(z.string().min(3)),
    location_id: zfd.text(z.string().min(1)),
  }))
  .action(async ({ parsedInput: { hostname, location_id }, ctx: { supabase } }) => {
    
    // Check demo mode
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    if (cookieStore.get('demo_mode')?.value === '1') {
      return { data: { success: true } }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('custom_domains' as any).insert({
      hostname,
      location_id,
      status: 'pending',
      ssl_status: 'pending'
    })

    if (error) {
      if (error.code === '23505') {
        throw new Error('This domain is already registered to an OurMenu store.')
      }
      throw new Error((error as Error).message)
    }

    revalidatePath('/dashboard/domain')
    return { data: { success: true } }
  })

export const removeCustomDomain = authActionClient
  .schema(z.object({
    domainId: z.string().min(1)
  }))
  .action(async ({ parsedInput: { domainId }, ctx: { supabase } }) => {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    if (cookieStore.get('demo_mode')?.value === '1' && domainId.startsWith('temp-')) {
      return { success: true }
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('custom_domains' as any).delete().eq('id', domainId)
    
    if (error) throw new Error((error as Error).message)
    
    revalidatePath('/dashboard/domain')
    return { success: true }
  })

export const checkDomainStatus = authActionClient
  .schema(z.object({
    domainId: z.string().min(1)
  }))
  .action(async ({ parsedInput: { domainId }, ctx: { supabase } }) => {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    if (cookieStore.get('demo_mode')?.value === '1') {
      return { success: true }
    }

    // In a real implementation, you would do a DNS lookup here
    // e.g. dns.resolveCname(hostname) to verify it points to cname.ourmenuos.online
    // For now, we just simulate verification and update the status to active
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('custom_domains' as any).update({
      status: 'active',
      ssl_status: 'active'
    }).eq('id', domainId)
    
    if (error) throw new Error((error as Error).message)
    
    revalidatePath('/dashboard/domain')
    return { success: true }
  })
