import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI } from '@google/genai'

export const maxDuration = 60

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

interface ExtractedItem {
  name: string
  description?: string
  price?: number // in whole currency units
  category?: string
}

interface ExtractedMenu {
  categories: string[]
  items: ExtractedItem[]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const organizationId = formData.get('organization_id') as string
    const currencyCode = (formData.get('currency_code') as string) || 'NGN'

    if (!file || !organizationId) {
      return NextResponse.json({ error: 'Missing file or organization_id' }, { status: 400 })
    }

    // Check membership
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (!member && !(await supabase.from('organizations').select('id').eq('id', organizationId).eq('created_by', user.id).single()).data) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf' | 'text/plain'

    const prompt = `You are a restaurant menu parser. Extract all menu items from this menu ${mimeType.startsWith('image') ? 'image' : 'document'}.

Return ONLY valid JSON in this exact structure (no markdown, no explanation):
{
  "categories": ["Category Name 1", "Category Name 2"],
  "items": [
    {
      "name": "Item Name",
      "description": "Brief description if available",
      "price": 1500,
      "category": "Category Name"
    }
  ]
}

Rules:
- price should be in WHOLE currency units (e.g. 1500 not 150000)  
- If a price is not visible, omit the price field
- Preserve exact item names as written on the menu
- Group items under their menu section/category
- If no categories exist, use "Menu" as default category
- Return at most 100 items`

    let extractedText = ''

    if (mimeType === 'text/plain') {
      extractedText = new TextDecoder().decode(bytes)
    }

    const contents = mimeType === 'text/plain'
      ? `${prompt}\n\nMenu text:\n${extractedText}`
      : { 
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64 } }
          ]
        }

    const response = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: typeof contents === 'string' 
        ? [{ role: 'user', parts: [{ text: contents }] }]
        : [{ role: 'user', parts: contents.parts }],
    })

    const raw = response.text?.trim() || ''
    
    // Strip markdown code fences if present
    const jsonStr = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    
    let menu: ExtractedMenu
    try {
      menu = JSON.parse(jsonStr) as ExtractedMenu
    } catch {
      return NextResponse.json({ error: 'AI could not parse the menu. Please try a clearer image or text file.' }, { status: 422 })
    }

    if (!menu.items || menu.items.length === 0) {
      return NextResponse.json({ error: 'No menu items found in the uploaded file.' }, { status: 422 })
    }

    // Convert price from whole units to minor (cents/kobo)
    const multiplier = ['USD', 'EUR', 'GBP'].includes(currencyCode) ? 100 : 100
    const itemsWithMinor = menu.items.map(item => ({
      ...item,
      price_minor: item.price ? Math.round(item.price * multiplier) : null
    }))

    return NextResponse.json({
      success: true,
      categories: menu.categories || ['Menu'],
      items: itemsWithMinor,
      total: itemsWithMinor.length
    })

  } catch (error) {
    console.error('Auto-menu import error:', error)
    return NextResponse.json({ error: 'Failed to process menu. Please try again.' }, { status: 500 })
  }
}
