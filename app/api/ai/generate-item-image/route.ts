import { checkRateLimit } from '@/lib/upstash'
import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { chargeCredits, refundCredits } from '@/lib/payments/credits'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'

const generateItemImageSchema = z.object({
  organizationId: z.string(),
  itemName: z.string(),
  itemContext: z.string().optional().nullable()
})

export async function POST(req: Request) {
  try {
    const { success: rlSuccess } = await checkRateLimit('ai_generate-item-image');
    if (!rlSuccess) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const supabase = await createClient()

    const { cookies } = await import('next/headers')
    const isDemo = (await cookies()).get('demo_mode')?.value === '1'

    if (isDemo) {
      return NextResponse.json({
        success: true,
        url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&h=600&fit=crop',
        remaining: 100
      })
    }

    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = generateItemImageSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }

    const { organizationId, itemName, itemContext } = parsed.data

    // 1. Verify membership
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userData.user.id)
      .single()

    let isAuthorized = member?.role === 'owner' || member?.role === 'manager' || member?.role === 'editor'
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
      return NextResponse.json({ error: 'Unauthorized to generate for this organization' }, { status: 403 })
    }

    // Fetch dynamic settings
    const { getCreditCosts, getAiModels } = await import('@/lib/utils/settings')
    const creditCosts = await getCreditCosts() as Record<string, number>
    const aiModels = await getAiModels() as Record<string, string>
    const cost = creditCosts.ai_cover || 5
    const modelName = aiModels.image_generation || 'imagen-3.0-generate-001'

    // 2. Charge Credits
    const charge = await chargeCredits(organizationId, cost, 'AI Item Image Generation', userData.user.id)
    if (!charge.success) {
      return NextResponse.json({ error: charge.error }, { status: 402 })
    }

    // 3. Generate Image using Gemini API
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI is not configured on the server.' }, { status: 500 })
    }

    const systemPrompt = `You are a professional food photographer. 
Generate a stunning, appetizing, 1:1 square high-resolution photo for a menu item.
Item Name: ${itemName}
Context/Description: ${itemContext || 'No extra context'}

CRITICAL RULES:
- DO NOT INCLUDE ANY TEXT, WORDS, OR TYPOGRAPHY IN THE IMAGE.
- Must be a single beautiful shot of the item, perfectly lit, mouth-watering.
- Clean background or natural restaurant setting.`

    try {
      // Direct fetch to Gemini Imagen
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${apiKey}`
      const aiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: systemPrompt }],
          parameters: { sampleCount: 1, aspectRatio: "1:1" }
        })
      })

      if (!aiRes.ok) {
        const err = await aiRes.text()
        console.error('Gemini error:', err)
        throw new Error('Failed to generate image from AI provider.')
      }

      const aiData = await aiRes.json()
      const base64Image = aiData.predictions?.[0]?.bytesBase64Encoded || aiData.predictions?.[0]?.bytes || null

      if (!base64Image) {
        throw new Error('AI provider returned an empty image.')
      }

      // 4. Upload to Supabase Storage
      const buffer = Buffer.from(base64Image, 'base64')
      const fileName = `items/${organizationId}/${Date.now()}.png`

      const adminClient = await createAdminClient()
      const { error: uploadError } = await adminClient
        .storage
        .from('menu-images')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: true
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: publicUrlData } = adminClient.storage.from('menu-images').getPublicUrl(fileName)
      const publicUrl = publicUrlData.publicUrl

      return NextResponse.json({ success: true, url: publicUrl, remaining: charge.remaining })
    } catch (apiError: unknown) {
      // Refund credits if anything fails after deduction
      await refundCredits(organizationId, cost, 'AI Image Generation Failed', userData.user.id)
      throw new Error((apiError as Error).message || 'Generation or storage failed, credits refunded.')
    }
  } catch (error: unknown) {
    Sentry.captureException(error)
    return NextResponse.json({ error: (error as Error).message || 'An unexpected error occurred.' }, { status: 500 })
  }
}
