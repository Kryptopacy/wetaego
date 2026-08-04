'use server'

import { createClient } from '@/lib/supabase/server'
import { authActionClient } from '@/lib/safe-action'
import { z } from 'zod'

const importSchema = z.object({
  organizationId: z.string(),
  customers: z.array(z.object({
    email: z.string().email(),
    phone_number: z.string().optional().nullable(),
    total_orders: z.number().optional().nullable(),
    total_spend_minor: z.number().optional().nullable(),
    last_visit_at: z.string().optional().nullable(),
    marketing_opt_in: z.boolean().optional().nullable()
  }))
})

export const importCustomersAction = authActionClient
  .schema(importSchema)
  .action(async ({ parsedInput: { organizationId, customers }, ctx: { user } }) => {
    const supabase = await createClient()

    // 1. Verify user is part of the organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (!member) {
      // Check if creator
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', organizationId)
        .eq('created_by', user.id).limit(1).maybeSingle()

      if (!org) {
        throw new Error('Unauthorized')
      }
    }

    // 2. Map and upsert
    const payload = customers.map(c => ({
      organization_id: organizationId,
      email: c.email.toLowerCase(),
      phone_number: c.phone_number || null,
      total_orders: c.total_orders || 0,
      total_spend_minor: c.total_spend_minor || 0,
      last_visit_at: c.last_visit_at || null,
      marketing_opt_in: c.marketing_opt_in ?? null,
      wallet_balance_minor: 0,
      wallet_escrow_minor: 0
    }))

    const { error } = await supabase
      .from('customer_profiles')
      .upsert(payload, {
        onConflict: 'organization_id, email',
        ignoreDuplicates: false
      })

    if (error) {
      console.error('Import error:', error)
      throw new Error(`Failed to import customers: ${error.message}`)
    }

    return { success: true, count: payload.length }
  })
