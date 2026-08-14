import { createClient } from '@/lib/supabase/server'
import { getInfrastructureFlags } from '@/lib/utils/settings'
import { GoogleGenAI } from '@google/genai'
import { checkRateLimit } from '@/lib/upstash'

export async function POST(req: Request) {
  try {
    const { success: rlSuccess } = await checkRateLimit('ai_copilot')
    if (!rlSuccess) {
      return new Response('Too many requests', { status: 429 })
    }

    const infraFlags = await getInfrastructureFlags() as Record<string, boolean>
    if (infraFlags.ai_enabled === false) {
      return new Response('AI services are currently undergoing maintenance.', { status: 503 })
    }

    const { organizationId } = await req.json() as { organizationId: string }
    if (!organizationId) {
      return new Response('Missing organization ID', { status: 400 })
    }

    const supabase = await createClient()
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData?.user) {
      return new Response('Not authenticated', { status: 401 })
    }

    // Verify user belongs to organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userData.user.id)
      .single()

    if (!member) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', organizationId)
        .eq('created_by', userData.user.id)
        .single()

      if (!org) {
        return new Response('Unauthorized', { status: 403 })
      }
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      return new Response('Gemini API key is not configured on server.', { status: 500 })
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: 'v1alpha' }
    })

    // Mint ephemeral token for Gemini Live
    const authToken = await ai.authTokens.create({
      config: {
        uses: 3,
        expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      }
    })

    if (!authToken.name) {
      return new Response('Failed to create ephemeral token', { status: 500 })
    }

    return Response.json({ token: authToken.name })
  } catch (err: unknown) {
    console.error('Error generating Gemini Live token:', err)
    return new Response((err as Error)?.message || 'Internal Server Error', { status: 500 })
  }
}
