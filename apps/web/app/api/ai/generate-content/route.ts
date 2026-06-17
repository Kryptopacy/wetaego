import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'

export async function POST(req: Request) {
  try {
    const { title, businessTypePreset, templateType } = await req.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

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
  } catch (error: any) {
    console.error('AI Generation Error:', error)
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
  }
}
