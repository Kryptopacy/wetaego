import { createClient } from '@/lib/supabase/server'

// Default fallbacks in case the DB is unreachable or row is missing
const DEFAULT_PRICING = { pro_monthly_ngn: 49000, credits_10_ngn: 15000, credits_50_ngn: 60000 }
const DEFAULT_CREDIT_COSTS = { ai_cover: 5, copywriter: 1, translation_per_category: 2, custom_page: 10 }
const DEFAULT_PLAN_LIMITS = {
  starter: { credits: 0, pages: 0 },
  pro: { credits: 50, pages: 1 },
  enterprise: { credits: 200, pages: 100 }
}
const DEFAULT_AI_MODELS = { text_generation: "gemini-3.1-flash", image_generation: "imagen-3.0-generate-001" }

export async function getSystemSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .single()

    if (error || !data) return fallback
    
    // Merge with fallback to ensure no missing keys
    return { ...fallback, ...data.value }
  } catch (err) {
    console.error(`Failed to fetch setting ${key}`, err)
    return fallback
  }
}

export async function getPricingSettings() {
  return getSystemSetting('pricing', DEFAULT_PRICING)
}

export async function getCreditCosts() {
  return getSystemSetting('credit_costs', DEFAULT_CREDIT_COSTS)
}

export async function getPlanLimits() {
  return getSystemSetting('plan_limits', DEFAULT_PLAN_LIMITS)
}

export async function getAiModels() {
  return getSystemSetting('ai_models', DEFAULT_AI_MODELS)
}
