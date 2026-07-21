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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: domainRec } = await supabase.from('custom_domains' as any).select('hostname').eq('id', domainId).single()
    const hostname = (domainRec as unknown as { hostname: string })?.hostname

    if (hostname) {
      try {
        const dns = await import('dns')
        const cnames = await dns.promises.resolveCname(hostname).catch(() => [] as string[])
        const isVerified = cnames.some(c => c.toLowerCase().includes('ourmenuos.online'))

        if (!isVerified) {
          throw new Error(`CNAME for ${hostname} is not pointing to cname.ourmenuos.online yet. Please check your DNS settings and wait for propagation.`)
        }
      } catch (err: unknown) {
        if ((err as Error).message.includes('not pointing')) throw err
        // If resolution fails or unsupported in environment, proceed with activation check
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('custom_domains' as any).update({
      status: 'active',
      ssl_status: 'active'
    }).eq('id', domainId)

    if (error) throw new Error((error as Error).message)

    revalidatePath('/dashboard/domain')
    return { success: true }
  })
