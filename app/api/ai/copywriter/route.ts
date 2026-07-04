import { checkRateLimit } from '@/lib/upstash'

import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chargeCredits } from '@/lib/payments/credits'

const copywriterSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  categoryName: z.string().optional().nullable(),
  organizationId: z.string().uuid('Invalid organization ID')
})

export async function POST(req: Request) {
  try {
    const { success: rlSuccess } = await checkRateLimit('ai_copywriter');
    if (!rlSuccess) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const supabase = await createClient()
    const { cookies } = await import('next/headers')
    const isDemo = (await cookies()).get('demo_mode')?.value === '1'

    if (isDemo) {
      return NextResponse.json({
        description: 'A delicious, hand-crafted culinary masterpiece guaranteed to delight your senses.',
        dietary_tags: ['Vegetarian'],
        allergen_tags: ['Dairy']
      })
    }

    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = copywriterSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }

    const { itemName, categoryName, organizationId } = parsed.data

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
    const cost = creditCosts.copywriter || 1
    const modelName = aiModels.text_generation || 'gemini-3.5-flash'

    // Charge dynamic credit cost
    const charge = await chargeCredits(organizationId, cost, 'AI Copywriter Generation', userData.user.id)
    if (!charge.success) {
      return NextResponse.json({ error: charge.error }, { status: 402 })
    }

    const { object } = await generateObject({
      model: google(modelName),
      schema: z.object({
        description: z.string().describe('A premium, engaging description highlighting the value of the product or service. Max 2 sentences.'),
        dietary_tags: z.array(z.string()).describe('ONLY if it is a food/beverage item, an array of dietary tags like "Spicy", "Vegan", etc. Capitalize first letter. Otherwise, return an empty array.'),
        allergen_tags: z.array(z.string()).describe('ONLY if it is a food/beverage item, an array of potential allergens like "Dairy", "Nuts", etc. Capitalize first letter. Otherwise, return an empty array.')
      }),
      prompt: `Act as a world-class copywriter for a premium business. 
      Analyze the Item Name and Category to determine if this is a food/beverage item, a physical product, or a service.
      Generate a premium, engaging description for it.
      If it is a food/beverage item, guess the likely dietary profile and identify potential allergens. If it is NOT a food/beverage item, return empty arrays for dietary_tags and allergen_tags.
      
      Item Name: ${itemName}
      Category: ${categoryName || 'General'}
      
      Ensure the description highlights its value, appeals to customers, and sounds professional.`
    })

    return NextResponse.json(object)
  } catch (error: any) {
    console.error('Copywriter Error:', error)
    
    // Catch AI Provider Timeouts & Overloads
    const isTimeout = error?.name === 'TimeoutError' || error?.message?.includes('timeout')
    const isOverloaded = error?.message?.includes('503') || error?.message?.includes('overloaded')
    
    if (isTimeout || isOverloaded) {
      return NextResponse.json({ error: 'AI service is temporarily overloaded or timed out. Please try again in a moment.' }, { status: 503 })
    }
    
    return NextResponse.json({ error: 'Failed to generate copy' }, { status: 500 })
  }
}
