import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { GoogleGenAI, Type } from '@google/genai'
import { chargeCredits } from '@/lib/payments/credits'
import { getAiModels, getCreditCosts } from '@/lib/utils/settings'

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
    const base64Image = buffer.toString('base64')

    // 1. Flawless Direct Multimodal structuring using Gemini Vision
    const aiModels = await getAiModels() as Record<string, string>
    const modelToUse = aiModels.text_generation || 'gemini-3.5-flash' // Vision is natively supported in 3.5 Flash

    const genai = new GoogleGenAI({})
    
    const interaction = await genai.models.generateContent({
      model: modelToUse,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category_name: { type: Type.STRING, description: "The section/category of the menu (e.g. Appetizers, Mains)" },
              name: { type: Type.STRING, description: "The name of the menu item" },
              description: { type: Type.STRING, description: "Description or ingredients of the item. Leave empty if none." },
              price: { type: Type.NUMBER, description: "The price of the item. Parse into a number." },
            },
            required: ["category_name", "name", "price"]
          }
        },
        systemInstruction: "You are an expert OCR AI that structures raw restaurant menu images into a precise JSON array of items. Extract the category, item name, description, and price perfectly. Respect spatial layouts (e.g. prices aligned on the right)."
      },
      contents: [
        {
          role: 'user',
          parts: [
            { text: "Please parse this menu image into the requested JSON format." },
            { inlineData: { data: base64Image, mimeType: file.type || 'image/jpeg' } }
          ]
        }
      ]
    })

    const resultText = interaction.text
    if (!resultText) {
      return new NextResponse('Failed to generate structured data', { status: 500 })
    }

    const structuredData = JSON.parse(resultText)

    return NextResponse.json({ items: structuredData })

  } catch (err: any) {
    console.error('OCR Error:', err)
    return new NextResponse(err.message || 'Internal Server Error', { status: 500 })
  }
}
