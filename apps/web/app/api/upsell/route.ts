import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

export const maxDuration = 15 // Short duration since it's a quick upsell

const upsellRequestSchema = z.object({
  cartItems: z.array(z.any()).min(1, 'Cart is empty'),
  availableItems: z.array(z.any()).min(1, 'No available items to upsell'),
  templateType: z.string().optional().default('catalog')
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = upsellRequestSchema.safeParse(body)

    if (!parsed.success) {
      return new Response('Invalid payload', { status: 400 })
    }

    const { cartItems, availableItems, templateType } = parsed.data

    const prompt = `
You are an expert sales assistant powering the checkout flow for a business.
The business is using a "${templateType}" template (e.g., if catalog -> restaurant/store, if booking -> services/hotel, if rate-card -> professional services).

Here is the current guest's cart:
${JSON.stringify(cartItems, null, 2)}

Here are the available items/services they could add:
${JSON.stringify(availableItems, null, 2)}

Your goal: Suggest EXACTLY ONE available item that perfectly complements their cart but is NOT already in it.
Provide a short, enticing 1-sentence pitch (max 10 words) encouraging them to add it.

Examples:
- (Restaurant) "Add a chilled Sprite with your Suya?"
- (Booking) "Add an extra 30mins to your session?"
- (Rate Card) "Add drone coverage for your shoot?"
`

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        suggestedItemId: z.string().describe('The ID of the suggested item from availableItems'),
        pitch: z.string().describe('A short, enticing 1-sentence pitch (max 10 words)')
      }),
      prompt,
    })

    // Verify the item exists
    const itemExists = availableItems.find((i: any) => i.id === object.suggestedItemId)
    if (!itemExists) {
      return new Response('Failed to find a valid upsell item', { status: 400 })
    }

    return Response.json(object)
  } catch (error) {
    console.error('Upsell API Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
