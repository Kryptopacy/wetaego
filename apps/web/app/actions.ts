'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function searchDirectory(formData: FormData) {
  const query = formData.get('query')?.toString().trim()
  
  if (!query) {
    return { error: 'Please enter a venue name' }
  }
  
  const supabase = await createClient()

  // Find location by name match
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: locMatch, error } = await supabase
    .from('location_pages')
    .select('slug, locations!inner(name)')
    .or(`slug.ilike.%${query}%,locations.name.ilike.%${query}%`)
    .eq('is_published', true)
    .limit(1)
    .maybeSingle()

  if (locMatch) {
    redirect(`/m/${locMatch.slug}`)
  }

  return { error: `No active venue found matching "${query}".` }
}
