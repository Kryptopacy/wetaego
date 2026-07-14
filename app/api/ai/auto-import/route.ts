import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { GoogleGenAI, Type } from '@google/genai'
import { chargeCredits } from '@/lib/payments/credits'
import { getAiModels, getCreditCosts } from '@/lib/utils/settings'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return new NextResponse('Unauthorized', { status: 401 })

    const formData = await req.formData()
    const file = formData.get('image') as File
    const organizationId = formData.get('organizationId') as string

    if (!file || !organizationId) {
      return new NextResponse('Missing file or organization ID', { status: 400 })
    }

    // Verify membership
    const { data: member } = await supabase.from('organization_members').select('role').eq('organization_id', organizationId).eq('user_id', userData.user.id).single()
    if (!member) {
      const { data: org } = await supabase.from('organizations').select('id').eq('id', organizationId).eq('created_by', userData.user.id).single()
      if (!org) return new NextResponse('Unauthorized', { status: 403 })
    }

    // Charge credits
    const creditCosts = await getCreditCosts() as Record<string, number>
    const cost = creditCosts.auto_fill || 2
    const charge = await chargeCredits(organizationId, cost, 'AI Menu Auto-Import (OCR)', userData.user.id)
    if (!charge.success) {
      return new NextResponse(charge.error, { status: 402 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const mimeType = file.type || 'image/jpeg'
    const isTextFile = mimeType === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.csv')

    const aiModels = await getAiModels() as Record<string, string>
    const modelToUse = aiModels.business_ai_model || aiModels.text_generation || 'gemini-2.5-flash'

    const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category_name: { type: Type.STRING, description: 'The section/category of the menu (e.g. Appetizers, Mains)' },
          name: { type: Type.STRING, description: 'The name of the menu item' },
          description: { type: Type.STRING, description: 'Description or ingredients. Leave empty if none.' },
          price: { type: Type.NUMBER, description: 'The price as a number in the local currency.' },
        },
        required: ['category_name', 'name']
      }
    }

    let contents

    if (isTextFile) {
      const textContent = buffer.toString('utf-8')
      contents = [
        {
          role: 'user' as const,
          parts: [
            { text: `Parse this menu text into the requested JSON format. Extract categories, item names, descriptions, and prices.\n\nMenu text:\n${textContent}` }
          ]
        }
      ]
    } else {
      // Image or PDF
      const base64Data = buffer.toString('base64')
      const validMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'].includes(mimeType)
        ? mimeType
        : 'image/jpeg'

      contents = [
        {
          role: 'user' as const,
          parts: [
            { text: 'Please parse this menu image into the requested JSON format. Extract all categories, items, descriptions, and prices visible.' },
            { inlineData: { data: base64Data, mimeType: validMime } }
          ]
        }
      ]
    }

    const interaction = await genai.models.generateContent({
      model: modelToUse,
      config: {
        responseMimeType: 'application/json',
        responseSchema,
        systemInstruction: 'You are an expert menu parser. Extract all menu items precisely from the provided menu — whether it is an image, PDF, or text file. Return only valid structured JSON matching the schema. Prices should be numeric values in the local currency unit shown.'
      },
      contents
    })

    const resultText = interaction.text
    if (!resultText) {
      return new NextResponse('Failed to generate structured data', { status: 500 })
    }

    let structuredData
    try {
      const cleaned = resultText.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '')
      structuredData = JSON.parse(cleaned)
    } catch {
      return new NextResponse('AI returned invalid data. Please try a clearer file.', { status: 422 })
    }

    if (!Array.isArray(structuredData) || structuredData.length === 0) {
      return new NextResponse('No menu items found in the uploaded file.', { status: 422 })
    }

    return NextResponse.json({ items: structuredData })

  } catch (err) {
    console.error('Menu Import Error:', err)
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return new NextResponse(message, { status: 500 })
  }
}
