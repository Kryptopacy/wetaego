import { checkRateLimit } from '@/lib/upstash'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chargeCredits } from '@/lib/payments/credits'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'

const generateCoverSchema = z.object({
  locationId: z.string().uuid('Invalid location ID'),
  prompt: z.string().optional().nullable()
})

// We will use standard fetch for Gemini Imagen to be perfectly safe, 
// as `@ai-sdk/google` image generation might not be fully stable in this exact version.
export async function POST(req: Request) {
  try {
    const { success: rlSuccess } = await checkRateLimit('ai_generate-cover');
    if (!rlSuccess) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const supabase = await createClient()

    const { cookies } = await import('next/headers')
    const isDemo = (await cookies()).get('demo_mode')?.value === '1'

    if (isDemo) {
      return NextResponse.json({
        success: true,
        url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1200&h=400&fit=crop',
        remaining: 100
      })
    }

    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = generateCoverSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 })
    }

    const { locationId, prompt } = parsed.data

    // 1. Fetch location and verify ownership
    const { data: loc, error: locError } = await supabase
      .from('locations')
      .select('id, organization_id, name, tagline, brand_knowledge')
      .eq('id', locationId)
      .single()

    if (locError || !loc) return NextResponse.json({ error: 'Location not found' }, { status: 404 })

    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', loc.organization_id)
      .eq('user_id', userData.user.id)
      .single()

    let isAuthorized = member?.role === 'owner' || member?.role === 'manager'
    if (!member) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', loc.organization_id)
        .eq('created_by', userData.user.id)
        .single()
      isAuthorized = !!org
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized to modify this location' }, { status: 403 })
    }

    // Fetch dynamic settings
    const { getCreditCosts, getAiModels } = await import('@/lib/utils/settings')
    const creditCosts = await getCreditCosts() as Record<string, number>
    const aiModels = await getAiModels() as Record<string, string>
    const cost = creditCosts.ai_cover || 5
    const modelName = aiModels.image_generation || 'imagen-3.0-generate-001'

    // 2. Charge Credits
    const charge = await chargeCredits(loc.organization_id, cost, 'AI Cover Image Generation', userData.user.id)
    if (!charge.success) {
      return NextResponse.json({ error: charge.error }, { status: 402 })
    }

    // 3. Generate Image using Gemini API
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      // Refund credits technically if API key is missing, but here we just throw
      return NextResponse.json({ error: 'AI is not configured on the server.' }, { status: 500 })
    }

    const systemPrompt = `You are a professional architectural and interior photographer. 
Generate a stunning, high-quality, 4k cinematic 16:9 shot for the venue cover image. 
Venue Name: ${loc.name}
Tagline: ${loc.tagline || 'A great place to eat'}
Context: ${loc.brand_knowledge || 'No extra context'}

CRITICAL RULES:
- DO NOT INCLUDE ANY TEXT, WORDS, OR TYPOGRAPHY IN THE IMAGE. 
- It must be purely environmental, architectural, or mood-focused.
- Photorealistic, perfect lighting, welcoming atmosphere.
`

    const finalPrompt = prompt ? `${systemPrompt}\n\nUser Fine-Tuning Request: ${prompt}` : systemPrompt

    // Direct fetch to Gemini Imagen
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${apiKey}`
    const aiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: finalPrompt }],
        parameters: { sampleCount: 1, aspectRatio: "16:9" }
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
    const fileName = `covers/${loc.organization_id}/${loc.id}-${Date.now()}.png`

    const { error: uploadError } = await supabase
      .storage
      .from('public-assets')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      throw uploadError
    }

    const { data: publicUrlData } = supabase.storage.from('public-assets').getPublicUrl(fileName)
    const publicUrl = publicUrlData.publicUrl

    // 5. Update Location
    const { error: updateError } = await supabase
      .from('locations')
      .update({ cover_image_url: publicUrl })
      .eq('id', loc.id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, url: publicUrl, remaining: charge.remaining })

  } catch (error: unknown) {
    Sentry.captureException(error)
    return NextResponse.json({ error: (error as Error).message || 'An unexpected error occurred.' }, { status: 500 })
  }
}
