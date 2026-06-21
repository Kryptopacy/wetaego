import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/upstash'

const generateContentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  businessTypePreset: z.string().optional().nullable(),
  templateType: z.string().optional().nullable()
})

export async function POST(req: Request) {
  try {
    const { success } = await checkRateLimit('ai_generate');
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json()
    const parsed = generateContentSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }

    const { title, businessTypePreset, templateType } = parsed.data

    let systemPrompt = `You are an expert copywriter for a high-end business.`
    
    if (businessTypePreset) {
      systemPrompt += ` The business is a ${businessTypePreset}.`
    }
    if (templateType) {
      systemPrompt += ` You are writing a description for an item on their ${templateType} page.`
    }

    systemPrompt += `
Write a compelling, concise, and professional description for the following item/service.
Keep it between 2 to 4 sentences. Do not use emojis unless absolutely necessary.
Make it sound premium and appealing to customers.
DO NOT wrap the response in quotes.`

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: `Item Title: ${title}`,
    })

    return NextResponse.json({ text: text.trim() })
  } catch (error: unknown) {
    console.error('AI Generation Error:', error)
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
  }
}
