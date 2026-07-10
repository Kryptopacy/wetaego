'use server'

import { createClient } from '@/lib/supabase/server'

export async function verifyQuotePin(reference: string, pin: string) {
  const supabase = await createClient()
  
  const { data: quote, error } = await supabase
    .from('page_bookings')
    .select('id, access_pin, status')
    .filter('booking_notes', 'ilike', `%Reference: ${reference}%`)
    .limit(1)
    .single()
    
  if (error || !quote) {
    return { success: false, error: 'Quote not found.' }
  }
  
  if (!quote.access_pin) {
    return { success: false, error: 'This quote is closed or has been converted to an order.' }
  }
  
  if (quote.access_pin !== pin) {
    return { success: false, error: 'Invalid PIN.' }
  }
  
  return { success: true, quoteId: quote.id }
}

export async function getQuoteDetails(quoteId: string, pin: string) {
  const supabase = await createClient()
  
  const { data: quote, error } = await supabase
    .from('page_bookings')
    .select('*, location_pages(locations(name, logo_url))')
    .eq('id', quoteId)
    .single()
    
  if (error || !quote) {
    return { success: false, error: 'Quote not found.' }
  }
  
  if (quote.access_pin !== pin) {
    return { success: false, error: 'Unauthorized.' }
  }
  
  return { success: true, data: quote }
}
