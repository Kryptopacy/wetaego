'use server'

import { z } from 'zod'
import { authActionClient } from '@/lib/safe-action'
import { revalidatePath } from 'next/cache'

// ─── Add Item ────────────────────────────────────────────────────────────────
export const addInventoryItem = authActionClient
  .schema(z.object({
    organization_id: z.string().uuid(),
    location_id: z.string().uuid(),
    name: z.string().min(1).max(120),
    sku: z.string().max(60).optional(),
    category: z.string().max(60).default('General'),
    unit: z.string().max(30).default('pieces'),
    initial_quantity: z.number().min(0).default(0),
    reorder_threshold: z.number().min(0).optional(),
    cost_price_minor: z.number().int().min(0).optional(),
    notes: z.string().max(500).optional(),
  }))
  .action(async ({ parsedInput: input, ctx: { supabase, user } }) => {
    const { data: item, error } = await supabase
      .from('inventory_items')
      .insert({
        organization_id: input.organization_id,
        location_id: input.location_id,
        name: input.name,
        sku: input.sku || null,
        category: input.category,
        unit: input.unit,
        current_quantity: input.initial_quantity,
        reorder_threshold: input.reorder_threshold ?? null,
        cost_price_minor: input.cost_price_minor ?? null,
        notes: input.notes || null,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) throw new Error(error.message)

    // Log initial stock as a restock movement (only if > 0)
    if (input.initial_quantity > 0) {
      await supabase.from('inventory_movements').insert({
        organization_id: input.organization_id,
        location_id: input.location_id,
        item_id: item.id,
        movement_type: 'restock',
        quantity: input.initial_quantity,
        note: 'Initial stock entry',
        recorded_by: user.id,
      })
    }

    revalidatePath('/dashboard/inventory')
    return { success: true, itemId: item.id }
  })

// ─── Update Item ──────────────────────────────────────────────────────────────
export const updateInventoryItem = authActionClient
  .schema(z.object({
    item_id: z.string().uuid(),
    organization_id: z.string().uuid(),
    name: z.string().min(1).max(120),
    sku: z.string().max(60).optional(),
    category: z.string().max(60),
    unit: z.string().max(30),
    reorder_threshold: z.number().min(0).optional(),
    cost_price_minor: z.number().int().min(0).optional(),
    notes: z.string().max(500).optional(),
  }))
  .action(async ({ parsedInput: input, ctx: { supabase } }) => {
    const { error } = await supabase
      .from('inventory_items')
      .update({
        name: input.name,
        sku: input.sku || null,
        category: input.category,
        unit: input.unit,
        reorder_threshold: input.reorder_threshold ?? null,
        cost_price_minor: input.cost_price_minor ?? null,
        notes: input.notes || null,
      })
      .eq('id', input.item_id)
      .eq('organization_id', input.organization_id)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/inventory')
    return { success: true }
  })

// ─── Log Movement ─────────────────────────────────────────────────────────────
export const logInventoryMovement = authActionClient
  .schema(z.object({
    organization_id: z.string().uuid(),
    location_id: z.string().uuid(),
    item_id: z.string().uuid(),
    movement_type: z.enum(['restock', 'use', 'wastage', 'sale', 'adjustment']),
    quantity: z.number().positive('Quantity must be positive'),
    note: z.string().max(500).optional(),
  }))
  .action(async ({ parsedInput: input, ctx: { supabase, user } }) => {
    // Determine sign: outbound movements are negative
    const outboundTypes = ['use', 'wastage', 'sale']
    const sign = outboundTypes.includes(input.movement_type) ? -1 : 1
    const signedQuantity = input.quantity * sign

    // For outbound: check we won't go negative
    if (sign === -1) {
      const { data: item } = await supabase
        .from('inventory_items')
        .select('current_quantity, name')
        .eq('id', input.item_id)
        .single()

      if (item && item.current_quantity + signedQuantity < 0) {
        throw new Error(`Insufficient stock. ${item.name} only has ${item.current_quantity} ${item.unit ?? 'units'} remaining.`)
      }
    }

    const { error } = await supabase.from('inventory_movements').insert({
      organization_id: input.organization_id,
      location_id: input.location_id,
      item_id: input.item_id,
      movement_type: input.movement_type,
      quantity: signedQuantity,
      note: input.note || null,
      recorded_by: user.id,
    })

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/inventory')
    return { success: true }
  })

// ─── Archive Item ─────────────────────────────────────────────────────────────
export const archiveInventoryItem = authActionClient
  .schema(z.object({
    item_id: z.string().uuid(),
    organization_id: z.string().uuid(),
  }))
  .action(async ({ parsedInput: input, ctx: { supabase } }) => {
    const { error } = await supabase
      .from('inventory_items')
      .update({ is_archived: true })
      .eq('id', input.item_id)
      .eq('organization_id', input.organization_id)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/inventory')
    return { success: true }
  })
