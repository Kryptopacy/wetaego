/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAnonClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'

// Default fallbacks in case the DB is unreachable or row is missing
const DEFAULT_PRICING = { pro_monthly_ngn: 49000, credits_10_ngn: 15000, credits_50_ngn: 60000 }
const DEFAULT_CREDIT_COSTS = { ai_cover: 5, copywriter: 1, translation_per_category: 2, custom_page: 10 }
const DEFAULT_PLAN_LIMITS = {
  starter: { credits: 0, pages: 0 },
  pro: { credits: 50, pages: 1 },
  enterprise: { credits: 200, pages: 100 }
}
const DEFAULT_AI_MODELS = { text_generation: "gemini-3.1-flash", image_generation: "imagen-3.0-generate-001" }

async function fetchSystemSettingFromDB<T>(key: string, fallback: T): Promise<T> {
  try {
    const supabase = createAnonClient()
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .single()

    if (error || !data) return fallback
    
    // Merge with fallback to ensure no missing keys
    return { ...fallback, ...data.value }
  } catch (err: any) {
    console.error(`Failed to fetch setting ${key}`, err)
    return fallback
  }
}

export const getPricingSettings = unstable_cache(
  async () => fetchSystemSettingFromDB('pricing', DEFAULT_PRICING),
  ['system_setting_pricing'],
  { revalidate: 86400, tags: ['pricing'] }
)

export const getCreditCosts = unstable_cache(
  async () => fetchSystemSettingFromDB('credit_costs', DEFAULT_CREDIT_COSTS),
  ['system_setting_credit_costs'],
  { revalidate: 86400, tags: ['credit_costs'] }
)

export const getPlanLimits = unstable_cache(
  async () => fetchSystemSettingFromDB('plan_limits', DEFAULT_PLAN_LIMITS),
  ['system_setting_plan_limits'],
  { revalidate: 86400, tags: ['plan_limits'] }
)

export const getAiModels = unstable_cache(
  async () => fetchSystemSettingFromDB('ai_models', DEFAULT_AI_MODELS),
  ['system_setting_ai_models'],
  { revalidate: 86400, tags: ['ai_models'] }
)
