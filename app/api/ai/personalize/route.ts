import { checkRateLimit } from '@/lib/upstash'
import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { getAiModels } from '@/lib/utils/settings'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { success: rlSuccess } = await checkRateLimit('ai_personalize');
    if (!rlSuccess) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { pastItemIds, availableItems } = await req.json()

    if (!pastItemIds || pastItemIds.length === 0 || !availableItems || availableItems.length === 0) {
      return NextResponse.json({ recommendedItemIds: [] })
    }

    // Filter available items to those not already ordered, to provide variety,
    // or just include everything and let the AI decide. We'll let the AI decide.
    const pastItems = availableItems.filter((i: { id: string }) => pastItemIds.includes(i.id))
    
    if (pastItems.length === 0) {
      return NextResponse.json({ recommendedItemIds: [] })
    }

    const pastItemsStr = pastItems.map((i: { name: string, description?: string }) => `${i.name} - ${i.description || ''}`).join(', ')
    const availableItemsStr = availableItems.map((i: { id: string, name: string, description?: string }) => `[ID: ${i.id}] ${i.name} - ${i.description || ''}`).join('\n')

    const prompt = `
    A customer is browsing our menu. Based on their past orders, recommend 3 new or similar items from our current menu that they would love.
    
    PAST ORDERS:
    ${pastItemsStr}

    AVAILABLE MENU ITEMS:
    ${availableItemsStr}

    Return exactly 3 item IDs as recommendations. Do not recommend items they have already ordered if there are good alternatives.
    `

    const aiModels = await getAiModels() as Record<string, string>
    const modelName = aiModels.customer_ai_model || aiModels.text_generation || 'gemini-3-flash-preview'

    const result = await generateObject({
      model: google(modelName),
      schema: z.object({
        recommendedItemIds: z.array(z.string()).max(3).min(1),
      }),
      prompt,
    })

    return NextResponse.json(result.object)

  } catch (error) {
    console.error('Personalization error:', error)
    return NextResponse.json({ recommendedItemIds: [] }, { status: 500 })
  }
}
