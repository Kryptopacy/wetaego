
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
    const modelName = aiModels.text_generation || 'gemini-3.1-flash'

    // Charge dynamic credit cost
    const charge = await chargeCredits(organizationId, cost, 'AI Copywriter Generation', userData.user.id)
    if (!charge.success) {
      return NextResponse.json({ error: charge.error }, { status: 402 })
    }

    const { object } = await generateObject({
      model: google(modelName),
      schema: z.object({
        description: z.string().describe('A sensory, appetizing, premium description of the food or beverage item. Max 2 sentences.'),
        dietary_tags: z.array(z.string()).describe('An array of dietary tags like "Spicy", "Vegan", "Gluten-Free", "Halal", etc. Capitalize first letter. Max 3 tags.'),
        allergen_tags: z.array(z.string()).describe('An array of potential allergens present in this item like "Dairy", "Nuts", "Shellfish", "Soy", etc. Capitalize first letter.')
      }),
      prompt: `Act as a world-class culinary copywriter and nutritionist for a high-end hospitality venue. 
      Generate a premium description, guess the likely dietary profile, and identify potential allergens for the following menu item.
      
      Item Name: ${itemName}
      Category: ${categoryName || 'General'}
      
      Ensure the description sounds incredibly appetizing, sensory, and professional. 
      Be conservative with allergens (if a dish traditionally contains dairy or nuts, tag it).`
    })

    return NextResponse.json(object)
  } catch (error: unknown) {
    console.error('AI Copywriter Error:', error)
    return NextResponse.json({ error: 'Failed to generate copy' }, { status: 500 })
  }
}
