import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { getAiModels } from '@/lib/utils/settings'

export const maxDuration = 15 // Short duration since it's a quick upsell

const upsellRequestSchema = z.object({
  cartItems: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number().optional(),
    category: z.string().optional()
  })).min(1, 'Cart is empty'),
  availableItems: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price_minor: z.number().optional(),
    description: z.string().nullable().optional(),
    category: z.string().optional(),
    is_upsell_eligible: z.boolean().optional()
  })).min(1, 'No available items to upsell'),
  templateType: z.string().optional().default('catalog'),
  upsellMode: z.string().optional().default('auto')
})

export async function POST(req: Request) {
  let body: { availableItems?: { id: string; name: string; category?: string; is_upsell_eligible?: boolean }[]; upsellMode?: string } | null = null
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

    const cartItemIds = new Set(cartItems.map(i => i.id))
    const eligibleItems = finalAvailableItems.filter(i => !cartItemIds.has(i.id))

    if (eligibleItems.length === 0) {
      return new Response('No valid upsell items available', { status: 200 })
    }

    const prompt = `
You are an expert, highly intelligent sales concierge powering the checkout upsell modal.
Business Template: "${templateType}"

Customer's Current Cart:
${JSON.stringify(cartItems, null, 2)}

Available Store Catalog Items to Suggest:
${JSON.stringify(eligibleItems, null, 2)}

STRICT CROSS-CATEGORY PAIRING RULES:
1. CROSS-CATEGORY COMPANION (CRITICAL):
   - NEVER suggest an item from the exact same category as what is already in their cart!
   - If the guest only ordered drinks: DO NOT suggest another drink. Suggest an appetizer, suya, snack, burger, or dessert!
   - If the guest ordered food/mains/steak/suya: Suggest a signature cocktail, chilled beverage, side dish, or artisanal dessert.
   - If the guest ordered a dessert: Suggest a hot coffee, digestif, or refreshing soda (NOT another dessert!).
   - If the guest booked a massage/spa: Suggest an aromatherapy upgrade, hot oil, or foot treatment.
   - If the guest requested gadget repairs: Suggest a protective case, tempered glass, or power bank.
2. NO CART DUPLICATES: Never suggest an item that is already in their cart.
3. NATURAL TONE: The pitch must be maximum 10 words, witty, conversational, and direct.

Pick the single best item ID and write a 1-sentence punchy pitch.
`

    const aiModels = await getAiModels() as Record<string, string>
    const modelName = aiModels.customer_ai_model || aiModels.text_generation || 'gemini-3-flash-preview'

    const { object } = await generateObject({
      model: google(modelName),
      schema: z.object({
        suggestedItemId: z.string().describe('The ID of the suggested item from eligibleItems'),
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
