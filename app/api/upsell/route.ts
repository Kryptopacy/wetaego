import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { getAiModels } from '@/lib/utils/settings'

export const maxDuration = 15 // Short duration since it's a quick upsell

const upsellRequestSchema = z.object({
  cartItems: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number().optional()
  })).min(1, 'Cart is empty'),
  availableItems: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price_minor: z.number().optional(),
    description: z.string().nullable().optional(),
    is_upsell_eligible: z.boolean().optional()
  })).min(1, 'No available items to upsell'),
  templateType: z.string().optional().default('catalog'),
  upsellMode: z.string().optional().default('auto')
})

export async function POST(req: Request) {
  let body: { availableItems?: { id: string; name: string; is_upsell_eligible?: boolean }[]; upsellMode?: string } | null = null
  try {
    body = await req.json()
    const parsed = upsellRequestSchema.safeParse(body)

    if (!parsed.success) {
      return new Response('Invalid payload', { status: 400 })
    }

    const { cartItems, availableItems, templateType, upsellMode } = parsed.data

    let finalAvailableItems = availableItems
    if (upsellMode === 'curated') {
      finalAvailableItems = availableItems.filter(i => i.is_upsell_eligible)
      if (finalAvailableItems.length === 0) {
        return new Response('No eligible upsell items in curated mode', { status: 200 })
      }
    }

    const prompt = `
You are an expert sales assistant powering the checkout flow for a business.
The business is using a "${templateType}" template (e.g., if catalog -> restaurant/store, if booking -> services/hotel, if rate-card -> professional services).

Here is the current guest's cart:
${JSON.stringify(cartItems, null, 2)}

Here are the available items/services they could add:
${JSON.stringify(finalAvailableItems, null, 2)}

Your goal: Suggest EXACTLY ONE available item that perfectly complements their cart but is NOT already in it.
Provide a short, enticing 1-sentence pitch (max 10 words) encouraging them to add it.

Examples:
- (Restaurant) "Add a chilled Sprite with your Suya?"
- (Booking) "Add an extra 30mins to your session?"
- (Rate Card) "Add drone coverage for your shoot?"
`

    const aiModels = await getAiModels() as Record<string, string>
    const modelName = aiModels.customer_ai_model || aiModels.text_generation || 'gemini-3-flash-preview'

    const { object } = await generateObject({
      model: google(modelName),
      schema: z.object({
        suggestedItemId: z.string().describe('The ID of the suggested item from availableItems'),
        pitch: z.string().describe('A short, enticing 1-sentence pitch (max 10 words)')
      }),
      prompt,
    })

    // Verify the item exists
    const itemExists = finalAvailableItems.find((i: { id: string }) => i.id === object.suggestedItemId)
    if (!itemExists) {
      return new Response('Failed to find a valid upsell item', { status: 400 })
    }

    return Response.json(object)
  } catch (error) {
    console.error('Upsell API Error:', error)
    // AI Circuit Breaker: Graceful Fallback instead of failure
    if (body?.availableItems && Array.isArray(body.availableItems) && body.availableItems.length > 0) {
      // Fallback: Just suggest the first available item if AI fails
      const fallbackItems = body.upsellMode === 'curated' ? body.availableItems.filter((i: any) => i.is_upsell_eligible) : body.availableItems
      if (fallbackItems.length > 0) {
        const fallbackItem = fallbackItems[0]
        return Response.json({
          suggestedItemId: fallbackItem.id,
          pitch: `Would you like to add ${fallbackItem.name}?`
        })
      }
    }
    return new Response('Internal Server Error', { status: 500 })
  }
}
