'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addResource({ 
  organization_id, 
  location_id, 
  name, 
  type, 
  capacity, 
  zone_name 
}: { 
  organization_id: string, 
  location_id: string, 
  name: string, 
  type: string, 
  capacity?: number, 
  zone_name?: string 
}) {
  const supabase = await createClient()

  const payload: import('@/lib/supabase/types').Database['public']['Tables']['resources']['Insert'] = {
    organization_id,
    location_id,
    name,
    type,
    zone_name: zone_name || null
  }
  if (capacity) payload.capacity = capacity

  const { error } = await supabase.from('resources').insert(payload)
  
  if (error) return { serverError: error.message }
  
  revalidatePath('/dashboard/resources')
  return { success: true }
}

export async function updateResource({ 
  id, 
  name, 
  type, 
  capacity, 
  zone_name 
}: { 
  id: string, 
  name: string, 
  type: string, 
  capacity?: number, 
  zone_name?: string 
}) {
  const supabase = await createClient()

  const payload: import('@/lib/supabase/types').Database['public']['Tables']['resources']['Update'] = {
    name,
    type,
    zone_name: zone_name || null,
    updated_at: new Date().toISOString()
  }
  if (capacity) payload.capacity = capacity
  else payload.capacity = null

  const { error } = await supabase.from('resources').update(payload).eq('id', id)
  
  if (error) return { serverError: error.message }
  
  revalidatePath('/dashboard/resources')
  return { success: true }
}

export async function deleteResource(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('resources').delete().eq('id', id)
  
  if (error) return { serverError: error.message }
  
  revalidatePath('/dashboard/resources')
  return { success: true }
}
