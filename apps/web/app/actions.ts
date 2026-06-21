'use server'

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect, @typescript-eslint/ban-ts-comment */
// FIXME: Developer bypassed types/rules. Requires refactoring for true perfection.


import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function searchDirectory(formData: FormData) {
  const query = formData.get('query')?.toString().trim()
  
  if (!query) {
    return { error: 'Please enter a venue name' }
  }
  
  const supabase = await createClient()

  // Find location by name match
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
