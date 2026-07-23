'use server'

import { revalidatePath } from 'next/cache'
import { authActionClient } from '@/lib/safe-action'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import crypto from 'crypto'

export const createApiKey = authActionClient
  .schema(zfd.formData({
    organization_id: zfd.text(z.string().min(1)),
    name: zfd.text(z.string().min(1, "Name is required").max(100)),
  }))
  .action(async ({ parsedInput: { organization_id, name }, ctx: { supabase } }) => {
    if (organization_id === 'demo-org') {
      throw new Error("Cannot create API keys in demo mode")
    }

    // Generate a secure random key
    const rawKey = `ourmenu_live_${crypto.randomBytes(32).toString('hex')}`
    
    // Hash the key for storage (we never store the raw key)
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

    const { error } = await supabase.from('api_keys').insert({
      organization_id,
      name,
      key_hash: keyHash,
      scopes: ['*'] // Admin scope by default for now
    })

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/api')
    
    // We return the raw key ONLY ONCE so the user can copy it
    return { success: true, rawKey }
  })

export const revokeApiKey = authActionClient
  .schema(zfd.formData({
    organization_id: zfd.text(z.string().min(1)),
    key_id: zfd.text(z.string().min(1)),
  }))
  .action(async ({ parsedInput: { organization_id, key_id }, ctx: { supabase } }) => {
    if (organization_id === 'demo-org') {
      throw new Error("Cannot revoke API keys in demo mode")
    }

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', key_id)
      .eq('organization_id', organization_id)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/api')
    return { success: true }
  })
