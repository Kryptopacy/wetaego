/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { requestText } = await req.json()

    if (!requestText) {
      return NextResponse.json({ error: 'Missing requestText' }, { status: 400 })
    }

    const { object } = await generateObject({
      model: google('gemini-3.1-flash'),
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
  } catch (error: any) {
    console.error('Triage Error:', error)
    return NextResponse.json({ error: 'Failed to triage request' }, { status: 500 })
  }
}
