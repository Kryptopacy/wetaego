import { checkRateLimit } from '@/lib/upstash'

import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { getAiModels } from '@/lib/utils/settings'

const triageSchema = z.object({
  requestText: z.string().min(1, 'Request text is required')
})

export async function POST(req: Request) {
  try {
    const { success: rlSuccess } = await checkRateLimit('ai_triage');
    if (!rlSuccess) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json()
    const parsed = triageSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }

    const { requestText } = parsed.data

    const aiModels = await getAiModels() as Record<string, string>
    const modelName = aiModels.text_generation || 'gemini-3.5-flash'

    const { object } = await generateObject({
      model: google(modelName),
      schema: z.object({
        urgency_tier: z.enum(['critical', 'standard', 'low']).describe('The classified urgency level of the request.')
      }),
      prompt: `You are a high-speed hospitality triage AI for a premium restaurant/lounge. 
      Classify the operational urgency of the following customer service request into one of three tiers: 'critical', 'standard', or 'low'.
      
      RULES:
      - 'critical': Spills, broken glass, emergencies, urgent payment issues, or extreme customer dissatisfaction. Needs immediate staff attention to prevent damage or churn.
      - 'standard': General assistance, bill requests, calling waiter to order more items, complaints about food taking too long.
      - 'low': Minor requests (extra napkins, tap water, changing shisha coal, clearing empty plates). Can be batched by staff.
      
      Customer Request: "${requestText}"
      `
    })

    return NextResponse.json(object)
  } catch (error) {
     
    console.error('Triage Error:', error)
    
    // Catch AI Provider Timeouts & Overloads
    const err = error as Error & { message?: string, name?: string }
    const isTimeout = err?.name === 'TimeoutError' || err?.message?.includes('timeout')
    const isOverloaded = err?.message?.includes('503') || err?.message?.includes('overloaded')
    
    if (isTimeout || isOverloaded) {
      return NextResponse.json({ error: 'AI service is temporarily overloaded or timed out. Please try again in a moment.' }, { status: 503 })
    }
    
    return NextResponse.json({ error: 'Failed to triage request' }, { status: 500 })
  }
}
