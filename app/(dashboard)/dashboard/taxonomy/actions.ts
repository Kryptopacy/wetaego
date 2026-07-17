'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCollection(pageId: string, name: string, parentId?: string | null) {
  const supabase = await createClient()
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  
  // Get max sort_order
  const { data: maxData } = await supabase
    .from('page_collections')
    .select('sort_order')
    .eq('page_id', pageId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()
    
  const nextSortOrder = (maxData?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('page_collections')
    .insert({
      page_id: pageId,
      name,
      slug,
      parent_id: parentId || null,
      sort_order: nextSortOrder
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/taxonomy')
  return { data }
}

export async function updateCollection(id: string, updates: { name?: string; parent_id?: string | null; sort_order?: number }) {
  const supabase = await createClient()
  
  const payload: any = { ...updates }
  if (updates.name) {
    payload.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  const { data, error } = await supabase
    .from('page_collections')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/taxonomy')
  return { data }
}

export async function deleteCollection(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('page_collections')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/taxonomy')
  return { success: true }
}
