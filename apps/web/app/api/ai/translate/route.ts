/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chargeCredits } from '@/lib/payments/credits'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { targetLanguage, menuData, organizationId } = await req.json()

    if (!targetLanguage || !menuData || !organizationId) {
      return NextResponse.json({ error: 'Missing targetLanguage, menuData, or organizationId' }, { status: 400 })
    }

    // Verify user belongs to org
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userData.user.id)
      .single()

    let isAuthorized = !!member
    if (!member) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', organizationId)
        .eq('created_by', userData.user.id)
        .single()
      isAuthorized = !!org
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized to modify this organization' }, { status: 403 })
    }

    // Fetch dynamic settings
    const { getCreditCosts, getAiModels } = await import('@/lib/utils/settings')
    const creditCosts = await getCreditCosts() as Record<string, number>
    const aiModels = await getAiModels() as Record<string, string>
    
    // Cost: dynamic per category
    const numCategories = Array.isArray(menuData) ? menuData.length : 1
    const costPerCategory = creditCosts.translation_per_category || 2
    const cost = numCategories * costPerCategory

    const charge = await chargeCredits(organizationId, cost, `AI Menu Translation (${targetLanguage})`, userData.user.id)
    if (!charge.success) {
      return NextResponse.json({ error: charge.error }, { status: 402 })
    }

    const modelName = aiModels.text_generation || 'gemini-3.1-flash'

    const { object } = await generateObject({
      model: google(modelName),
      schema: z.object({
        categories: z.array(z.object({
          id: z.string(),
          name: z.string(),
          items: z.array(z.object({
            id: z.string(),
            name: z.string(),
            description: z.string().optional()
          }))
        }))
      }),
      prompt: `You are a professional culinary translator working for a high-end restaurant. 
      Translate the following menu into ${targetLanguage}.
      
      RULES:
      1. Maintain the exact same JSON array structure and preserve all IDs.
      2. Translate the category names, item names, and item descriptions.
      3. CRITICAL: DO NOT translate proper nouns, venue names, brand names, or specific cultural dishes (e.g., leave "Jollof" as "Jollof", leave "Dom Perignon" as "Dom Perignon"). Only translate the descriptive words around them.
      4. Ensure the culinary context sounds appetizing, accurate, and completely natural to a native speaker of ${targetLanguage}.
      
      Menu JSON to translate:
      ${JSON.stringify(menuData)}
      `
    })

    return NextResponse.json(object)
  } catch (error: any) {
    console.error('Translation Error:', error)
    return NextResponse.json({ error: 'Failed to translate menu' }, { status: 500 })
  }
}
