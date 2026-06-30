import { createAnonClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'

// Default fallbacks in case the DB is unreachable or row is missing
const DEFAULT_PRICING = { 
  lite_monthly_ngn: 14999, 
  pro_monthly_ngn: 49999, 
  credits_10_ngn: 6000,
  credits_25_ngn: 12000,
  credits_50_ngn: 20000 
}
const DEFAULT_CREDIT_COSTS = { ai_cover: 5, copywriter: 1, translation_per_category: 2, custom_page: 10, qr_code: 1 }
const DEFAULT_PLAN_LIMITS = {
  lite: { credits: 10, pages: 0, qr_codes: 2 },
  pro: { credits: 50, pages: 1, qr_codes: 9999 },
  enterprise: { credits: 200, pages: 5, qr_codes: 9999 }
}
const DEFAULT_AI_MODELS = { text_generation: "gemini-3.5-flash", image_generation: "imagen-3.0-generate-001" }
const DEFAULT_EXCHANGE_RATES = { usd_to_ngn: 1500 }
const DEFAULT_AFFILIATE = { default_percentage: 10 }
const DEFAULT_PLATFORM_FEES = { business_subaccount: 5, affiliate_subaccount: 5, staff_tip_subaccount: 0 }

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
    return { ...fallback, ...((data.value as object) || {}) }
  } catch (err) {
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

export const getExchangeRates = unstable_cache(
  async () => fetchSystemSettingFromDB('exchange_rates', DEFAULT_EXCHANGE_RATES),
  ['system_setting_exchange_rates'],
  { revalidate: 86400, tags: ['exchange_rates'] }
)

export const getAffiliateSettings = unstable_cache(
  async () => fetchSystemSettingFromDB('affiliate', DEFAULT_AFFILIATE),
  ['system_setting_affiliate'],
  { revalidate: 86400, tags: ['affiliate'] }
)

export const getPlatformFees = unstable_cache(
  async () => fetchSystemSettingFromDB('platform_fees', DEFAULT_PLATFORM_FEES),
  ['system_setting_platform_fees'],
  { revalidate: 86400, tags: ['platform_fees'] }
)

const DEFAULT_TRIAL_SETTINGS = { default_trial_days: 30 }
export const getTrialSettings = unstable_cache(
  async () => fetchSystemSettingFromDB('trial_settings', DEFAULT_TRIAL_SETTINGS),
  ['system_setting_trial_settings'],
  { revalidate: 86400, tags: ['trial_settings'] }
)
