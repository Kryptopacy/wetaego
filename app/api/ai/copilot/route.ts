import { createClient } from '@/lib/supabase/server'
import { getAiModels, getCreditCosts } from '@/lib/utils/settings'
import { chargeCredits } from '@/lib/payments/credits'
import { google } from '@ai-sdk/google'
import { streamText, UIMessage, tool, convertToModelMessages } from 'ai'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/upstash'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { success: rlSuccess } = await checkRateLimit('ai_copilot')
    if (!rlSuccess) {
      return new Response('Too many requests', { status: 429 })
    }

    const { messages, organizationId } = await req.json() as { messages: UIMessage[], organizationId: string }
    
    if (!organizationId) {
      return new Response('Missing organization ID', { status: 400 })
    }

    const supabase = await createClient()

    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData?.user) {
      return new Response('Not authenticated', { status: 401 })
    }

    // Verify user belongs to org
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userData.user.id)
      .single()

    let isAuthorized = !!member
    let userRole = member?.role || 'viewer'
    
    if (!member) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', organizationId)
        .eq('created_by', userData.user.id)
        .single()
      isAuthorized = !!org
      if (org) userRole = 'owner'
    }

    if (!isAuthorized) {
      return new Response('Unauthorized', { status: 403 })
    }

    // Charge credit for AI interaction (1 credit per message sent)
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'user') {
      const creditCosts = await getCreditCosts() as Record<string, number>
      const cost = creditCosts.copilot || 1
      const charge = await chargeCredits(organizationId, cost, 'Admin AI Co-Pilot', userData.user.id)
      
      if (!charge.success) {
        return new Response(charge.error, { status: 402 })
      }
    }

    const aiModels = await getAiModels() as Record<string, string>
    const modelName = aiModels.text_generation || 'gemini-3.5-flash'

    const result = streamText({
      model: google(modelName),
      messages: await convertToModelMessages(messages),
      system: `You are the Admin AI Co-Pilot for OurMenu OS. 
      You are an expert business assistant built directly into the merchant dashboard. 
      Your goal is to help merchants manage their restaurant, spa, or boutique efficiently. 
      Always use the 'get_business_structure' tool first if you need to know their locations or pages.
      For now, you can check inventory and update stock levels. 
      Keep responses brief and actionable. Always act like a professional, friendly assistant.`,
      tools: {
        get_business_structure: tool({
          description: 'Fetch the locations and pages (menus, booking pages) belonging to this organization.',
          parameters: z.object({}),
          // @ts-ignore - TS inference struggles with Vercel AI SDK tool execute signatures
          execute: async (): Promise<any> => {
            const { data: locations } = await supabase
              .from('locations')
              .select('id, name, slug, location_pages(id, title, template_type, is_published)')
              .eq('organization_id', organizationId)
            return locations || []
          }
        }),
        get_low_stock_alerts: tool({
          description: 'Get a list of inventory items that are running low (current quantity is at or below the reorder threshold).',
          parameters: z.object({
            locationId: z.string().uuid('The ID of the location to check inventory for.')
          }),
          // @ts-ignore
          execute: async ({ locationId }: { locationId: string }): Promise<any> => {
            // Fetch all non-archived for the location and filter here
            const { data: allItems } = await supabase
              .from('inventory_items')
              .select('id, name, current_quantity, unit, reorder_threshold')
              .eq('location_id', locationId)
              .eq('is_archived', false)

            if (!allItems) return []
            return allItems.filter(item => item.reorder_threshold !== null && item.current_quantity <= item.reorder_threshold)
          }
        }),
        update_inventory_stock: tool({
          description: 'Update the current quantity (stock level) of an inventory item.',
          parameters: z.object({
            itemId: z.string().uuid(),
            newQuantity: z.number()
          }),
          // @ts-ignore
          execute: async ({ itemId, newQuantity }: { itemId: string; newQuantity: number }): Promise<any> => {
            const { error } = await supabase
              .from('inventory_items')
              .update({ current_quantity: newQuantity, updated_at: new Date().toISOString() })
              .eq('id', itemId)
            
            if (error) throw new Error(error.message)
            return { success: true, itemId, newQuantity }
          }
        }),
        generate_sales_summary: tool({
          description: 'Get a summary of sales revenue and order volume for a specific location over a timeframe.',
          parameters: z.object({
            locationId: z.string().uuid(),
            timeframe: z.enum(['today', 'this_week', 'this_month'])
          }),
          // @ts-ignore
          execute: async ({ locationId, timeframe }: { locationId: string; timeframe: 'today' | 'this_week' | 'this_month' }): Promise<any> => {
            if (userRole !== 'owner' && userRole !== 'manager') {
              return { error: 'Unauthorized: Only owners and managers can view sales summaries.' }
            }
            
            const now = new Date()
            let startDate = new Date()
            if (timeframe === 'today') {
              startDate.setHours(0, 0, 0, 0)
            } else if (timeframe === 'this_week') {
              startDate.setDate(now.getDate() - now.getDay())
              startDate.setHours(0, 0, 0, 0)
            } else if (timeframe === 'this_month') {
              startDate.setDate(1)
              startDate.setHours(0, 0, 0, 0)
            }

            const { data: orders } = await supabase
              .from('orders')
              .select('total_amount_minor, status')
              .eq('location_id', locationId)
              .gte('created_at', startDate.toISOString())
              
            if (!orders) return { revenueMinor: 0, orderCount: 0, timeframe }
            
            const completed = orders.filter(o => o.status !== 'cancelled')
            const revenueMinor = completed.reduce((sum, o) => sum + (o.total_amount_minor || 0), 0)
            
            return {
              timeframe,
              revenueMinor,
              orderCount: completed.length
            }
          }
        })
      }
    })

    // Fallback to toTextStreamResponse or toDataStreamResponse depending on ai sdk version
    return (result as any).toDataStreamResponse ? (result as any).toDataStreamResponse() : (result as any).toTextStreamResponse()
    
  } catch (error) {
    console.error('Co-Pilot Error:', error)
    return new Response('Failed to process chat', { status: 500 })
  }
}
